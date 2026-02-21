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

// Allow streaming responses up to 5 minutes
export const maxDuration = 300

export async function POST(req: Request) {
  // 1. Auth
  const session = await auth()
  if (!session?.user?.id) {
    console.log('[AI:DIAG] Auth failed: no session.user.id')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check AI is enabled
  if (!AI_CONFIG.isEnabled) {
    console.log('[AI:DIAG] AI not enabled: ANTHROPIC_API_KEY missing')
    return NextResponse.json(
      { error: 'AI copilot is not configured' },
      { status: 503 }
    )
  }

  // 3. Fund resolution
  const activeFund = await getActiveFundWithCurrency(session.user.id)
  if (!activeFund) {
    console.log('[AI:DIAG] No active fund for user:', session.user.id)
    return NextResponse.json(
      { error: 'No active fund found' },
      { status: 400 }
    )
  }

  // 4. Fund access verification (defense-in-depth)
  try {
    await requireFundAccess(session.user.id, activeFund.fundId)
  } catch {
    console.log('[AI:DIAG] Fund access denied:', { userId: session.user.id, fundId: activeFund.fundId })
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
    console.log('[AI:DIAG] Rate limited:', { userId: session.user.id, resetAt: rateLimitResult.resetAt })
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
    console.log('[AI:DIAG] No messages in request body')
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

  console.log('[AI:DIAG] Calling streamText', {
    model: AI_CONFIG.model,
    systemPromptLength: systemPrompt.length,
    messageCount: modelMessages.length,
    toolCount: Object.keys(createReadTools(activeFund.fundId, activeFund.currency)).length,
    conversationId,
  })

  let result
  try {
    result = streamText({
      model: anthropic(AI_CONFIG.model),
      system: systemPrompt,
      messages: modelMessages,
      tools: createReadTools(activeFund.fundId, activeFund.currency),
      onFinish: ({ usage }) => {
        console.log('[AI:DIAG] streamText.onFinish', {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          conversationId,
        })
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
  } catch (streamError) {
    console.error('[AI:DIAG] streamText threw synchronously:', streamError)
    return NextResponse.json(
      { error: 'AI streaming failed to initialize' },
      { status: 500 }
    )
  }

  // 11. Return streaming response with persistence on finish
  console.log('[AI:DIAG] Returning toUIMessageStreamResponse')
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages: allMessages }) => {
      console.log('[AI:DIAG] toUIMessageStreamResponse.onFinish', {
        messageCount: allMessages.length,
        conversationId,
      })
      // Fire-and-forget: persist all messages to DB
      persistMessages(conversationId, allMessages).catch((error: unknown) => {
        console.error('[AI:DIAG] persistMessages failed:', error)
      })
    },
    headers: {
      'X-Conversation-Id': conversationId,
    },
  })
}
