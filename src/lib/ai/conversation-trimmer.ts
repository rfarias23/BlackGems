const CHARS_PER_TOKEN = 4
const MAX_RECENT_MESSAGES = 30
const CONTEXT_OMITTED_MARKER = '[Earlier conversation context omitted]'

interface TrimmerMessage {
  role: string
  content: string
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

function estimateMessageTokens<T extends TrimmerMessage>(messages: T[]): number {
  return messages.reduce((total, msg) => total + estimateTokens(msg.content), 0)
}

export function trimConversation<T extends TrimmerMessage>(
  messages: T[],
  tokenBudget: number
): T[] {
  if (messages.length === 0) return []

  if (messages.length <= MAX_RECENT_MESSAGES + 1) {
    if (estimateMessageTokens(messages) <= tokenBudget) {
      return messages
    }
  }

  const systemMessage = messages[0]
  const recentMessages = messages.slice(-MAX_RECENT_MESSAGES)

  const trimmed: T[] = [systemMessage]

  if (messages.length > MAX_RECENT_MESSAGES + 1) {
    trimmed.push({
      ...recentMessages[0],
      role: 'assistant',
      content: CONTEXT_OMITTED_MARKER,
    })
  }

  trimmed.push(...recentMessages)

  if (estimateMessageTokens(trimmed) > tokenBudget) {
    const budgetForRecent = tokenBudget - estimateTokens(systemMessage.content)
    const kept: T[] = []
    let usedTokens = 0

    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msgTokens = estimateTokens(recentMessages[i].content)
      if (usedTokens + msgTokens > budgetForRecent) break
      kept.unshift(recentMessages[i])
      usedTokens += msgTokens
    }

    return [
      systemMessage,
      {
        ...kept[0],
        role: 'assistant',
        content: CONTEXT_OMITTED_MARKER,
      } as T,
      ...kept,
    ]
  }

  return trimmed
}
