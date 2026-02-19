import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { rateLimit } from '@/lib/shared/rate-limit'
import { AI_CONFIG, getAnthropicProvider } from '@/lib/ai/ai-config'
import { trackAICost } from '@/lib/ai/cost-tracker'
import { trimConversation } from '@/lib/ai/conversation-trimmer'
import { assembleFundContext } from '@/lib/ai/context/fund-context'
import { assembleUserContext } from '@/lib/ai/context/user-context'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { createReadTools } from '@/lib/ai/tools'
import {
  createConversation,
  persistMessages,
  getConversations,
} from '@/lib/actions/ai-conversations'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // 1. Auth
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check AI is enabled
  if (!AI_CONFIG.isEnabled) {
    return NextResponse.json(
      { error: 'AI copilot is not configured' },
      { status: 503 }
    )
  }

  // 3. Fund resolution
  const activeFund = await getActiveFundWithCurrency(session.user.id)
  if (!activeFund) {
    return NextResponse.json(
      { error: 'No active fund found' },
      { status: 400 }
    )
  }

  // 4. Fund access verification (defense-in-depth)
  try {
    await requireFundAccess(session.user.id, activeFund.fundId)
  } catch {
    return NextResponse.json(
      { error: 'Access denied to this fund' },
      { status: 403 }
    )
  }

  // 5. Rate limiting
  const rateLimitResult = rateLimit(
    `ai:${session.user.id}`,
    AI_CONFIG.rateLimitPerHour,
    3_600_000
  )
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before sending another message.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
    )
  }

  // 6. Parse request body
  const body = await req.json()
  const { messages, conversationId: reqConversationId } = body as {
    messages: UIMessage[]
    conversationId?: string
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages are required' },
      { status: 400 }
    )
  }

  // 7. Conversation resolution (create if needed)
  let conversationId = reqConversationId
  if (!conversationId) {
    const firstUserMsg = messages.find(m => m.role === 'user')
    const title = firstUserMsg?.parts
      ?.filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
      .map(p => p.text)
      .join(' ')
      .slice(0, 60) || undefined

    const conversation = await createConversation(activeFund.fundId, title)
    conversationId = conversation.id
  }

  // 8. Trim UIMessages if over budget, then convert to model messages.
  // The trimmer needs { role, content } — we extract text from UIMessage parts.
  const messagesForTrimmer = messages.map(m => ({
    ...m,
    role: m.role,
    content: m.parts
      .filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
      .map(p => p.text)
      .join('\n'),
  }))
  const trimmedUIMessages = trimConversation(messagesForTrimmer, AI_CONFIG.tokenBudget)

  // Convert trimmed UIMessages → model messages for the LLM
  const modelMessages = await convertToModelMessages(trimmedUIMessages)

  // 9. Assemble context
  const [fundContext, conversations] = await Promise.all([
    assembleFundContext(activeFund.fundId),
    getConversations(activeFund.fundId),
  ])

  const userContext = assembleUserContext(session)
  const isFirstTime = conversations.length <= 1 // Current conversation may be the first

  const systemPrompt = buildSystemPrompt(
    fundContext,
    userContext,
    activeFund.currency,
    isFirstTime
  )

  // 10. Stream response
  const anthropic = getAnthropicProvider()

  const result = streamText({
    model: anthropic(AI_CONFIG.model),
    system: systemPrompt,
    messages: modelMessages,
    tools: createReadTools(activeFund.fundId, activeFund.currency),
    onFinish: ({ usage }) => {
      // Fire-and-forget: track cost to audit log
      const inputTokens = usage.inputTokens ?? 0
      const outputTokens = usage.outputTokens ?? 0
      trackAICost(session.user!.id!, activeFund.fundId, {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      })
    },
  })

  // 11. Return streaming response with persistence on finish
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages: allMessages }) => {
      // Fire-and-forget: persist all messages to DB
      persistMessages(conversationId, allMessages).catch((error: unknown) => {
        console.error('Failed to persist messages after stream:', error)
      })
    },
    headers: {
      'X-Conversation-Id': conversationId,
    },
  })
}
