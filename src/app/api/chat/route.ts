import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency, requireFundAccess } from '@/lib/shared/fund-access'
import { rateLimit } from '@/lib/shared/rate-limit'
import { AI_CONFIG, getAnthropicProvider } from '@/lib/ai/ai-config'
import { trackAICost } from '@/lib/ai/cost-tracker'
import { trimConversation } from '@/lib/ai/conversation-trimmer'
import { checkBudget } from '@/lib/ai/budget/budget-guard'
import { assembleEngine } from '@/lib/ai/core/engine'
import {
  createConversation,
  persistMessages,
} from '@/lib/actions/ai-conversations'
import { prisma } from '@/lib/prisma'
import { streamText, generateText, convertToModelMessages, type UIMessage } from 'ai'
import { NextResponse } from 'next/server'

// Allow streaming responses up to 5 minutes
export const maxDuration = 300

export async function POST(req: Request) {
  // --- Auth ---
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AI_CONFIG.isEnabled) {
    return NextResponse.json({ error: 'AI copilot is not configured' }, { status: 503 })
  }

  // --- Fund resolution & access ---
  const activeFund = await getActiveFundWithCurrency(session.user.id)
  if (!activeFund) {
    return NextResponse.json({ error: 'No active fund found' }, { status: 400 })
  }

  try {
    await requireFundAccess(session.user.id, activeFund.fundId)
  } catch {
    return NextResponse.json({ error: 'Access denied to this fund' }, { status: 403 })
  }

  // --- Rate limiting (per-hour + per-day, Marcus Correction 4) ---
  const hourlyLimit = rateLimit(
    `ai:${session.user.id}`,
    AI_CONFIG.rateLimitPerHour,
    3_600_000
  )
  if (!hourlyLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before sending another message.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((hourlyLimit.resetAt - Date.now()) / 1000)) } }
    )
  }

  const dailyLimit = rateLimit(
    `ai-daily:${session.user.id}`,
    AI_CONFIG.rateLimitPerDay,
    86_400_000
  )
  if (!dailyLimit.success) {
    return NextResponse.json(
      { error: 'Daily message limit reached. Please try again tomorrow.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((dailyLimit.resetAt - Date.now()) / 1000)) } }
    )
  }

  // --- Budget guard (per-user, Marcus Correction 2) ---
  try {
    const budget = await checkBudget(session.user.id, AI_CONFIG.monthlyBudgetUSD)
    if (!budget.allowed) {
      return NextResponse.json(
        { error: `Monthly AI budget exceeded (${budget.usedUSD.toFixed(2)}/${budget.budgetUSD} USD). Please contact your administrator.` },
        { status: 429 }
      )
    }
  } catch (err) {
    // Budget check is non-blocking — log and continue
    console.error('Budget check failed, allowing request:', err)
  }

  // --- Parse request ---
  const body = await req.json()
  const { messages, conversationId: reqConversationId } = body as {
    messages: UIMessage[]
    conversationId?: string
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
  }

  // --- Conversation resolution ---
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

  // --- Message trimming ---
  const messagesForTrimmer = messages.map(m => ({
    ...m,
    role: m.role,
    content: m.parts
      .filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
      .map(p => p.text)
      .join('\n'),
  }))
  const trimmedUIMessages = trimConversation(messagesForTrimmer, AI_CONFIG.tokenBudget)
  const modelMessages = await convertToModelMessages(trimmedUIMessages)

  // --- Engine: context + tools + prompt ---
  const engine = await assembleEngine({
    userId: session.user.id,
    fundId: activeFund.fundId,
    currency: activeFund.currency,
    session,
  })

  // --- Stream ---
  const anthropic = getAnthropicProvider()

  let result
  try {
    result = streamText({
      model: anthropic(AI_CONFIG.model),
      system: engine.systemPrompt,
      messages: modelMessages,
      tools: engine.tools,
      abortSignal: req.signal,
      onFinish: ({ usage }) => {
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
    console.error('AI streaming failed to initialize:', streamError)
    return NextResponse.json({ error: 'AI streaming failed to initialize' }, { status: 500 })
  }

  // --- Response with persistence + title generation ---
  const isNewConversation = !reqConversationId
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages: allMessages }) => {
      persistMessages(conversationId, allMessages).catch((error: unknown) => {
        console.error('Failed to persist AI messages:', error)
      })

      if (isNewConversation && allMessages.length >= 2) {
        generateConversationTitle(conversationId, allMessages, anthropic).catch(
          (error: unknown) => {
            console.error('Failed to generate conversation title:', error)
          }
        )
      }
    },
    headers: {
      'X-Conversation-Id': conversationId,
    },
  })
}

// ---------------------------------------------------------------------------
// Title generation — fire-and-forget after first assistant response
// ---------------------------------------------------------------------------

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter(
      (p): p is Extract<UIMessage['parts'][number], { type: 'text' }> =>
        p.type === 'text'
    )
    .map((p) => p.text)
    .join(' ')
}

async function generateConversationTitle(
  conversationId: string,
  allMessages: UIMessage[],
  anthropic: ReturnType<typeof getAnthropicProvider>
): Promise<void> {
  const userMsg = allMessages.find((m) => m.role === 'user')
  const assistantMsg = allMessages.find((m) => m.role === 'assistant')
  if (!userMsg || !assistantMsg) return

  const userText = extractText(userMsg).slice(0, 200)
  const assistantText = extractText(assistantMsg).slice(0, 300)

  const { text: title } = await generateText({
    model: anthropic(AI_CONFIG.titleModel),
    prompt: `Generate a concise 4-6 word title for this conversation. No quotes, no ending punctuation. Examples: "Pipeline deal flow analysis", "Fund performance Q4 review", "Investor commitment breakdown".

User: ${userText}
Assistant: ${assistantText}

Title:`,
  })

  const cleaned = title.trim().replace(/^["']|["']$/g, '').slice(0, 60)
  if (!cleaned) return

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: cleaned },
  })
}
