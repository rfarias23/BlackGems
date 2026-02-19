import { describe, it, expect } from 'vitest'
import { trimConversation } from '../lib/ai/conversation-trimmer'

function msg(role: string, content: string) {
  return { role, content }
}

describe('trimConversation', () => {
  it('returns empty array for empty messages', () => {
    expect(trimConversation([], 10000)).toEqual([])
  })

  it('returns single message as-is', () => {
    const messages = [msg('system', 'You are helpful')]
    expect(trimConversation(messages, 10000)).toEqual(messages)
  })

  it('returns all messages when under budget and under 31 messages', () => {
    const messages = [
      msg('system', 'You are helpful'),
      msg('user', 'Hello'),
      msg('assistant', 'Hi there'),
    ]
    expect(trimConversation(messages, 10000)).toEqual(messages)
  })

  it('trims to first message + omission marker + last 30 when over 31 messages', () => {
    const system = msg('system', 'System prompt')
    const messages = [system]
    for (let i = 0; i < 35; i++) {
      messages.push(msg(i % 2 === 0 ? 'user' : 'assistant', `Message ${i}`))
    }
    // Total: 36 messages (1 system + 35 conversation)

    const result = trimConversation(messages, 100000)

    // First message is preserved
    expect(result[0]).toEqual(system)

    // Second element is the omission marker
    expect(result[1].role).toBe('assistant')
    expect(result[1].content).toBe('[Earlier conversation context omitted]')

    // Last 30 messages are preserved
    const expectedRecent = messages.slice(-30)
    expect(result.slice(2)).toEqual(expectedRecent)

    // Total length: 1 (system) + 1 (marker) + 30 (recent) = 32
    expect(result).toHaveLength(32)
  })

  it('trims from oldest when messages exceed token budget', () => {
    const system = msg('system', 'Sys')
    const messages = [
      system,
      msg('user', 'A'.repeat(400)),   // 100 tokens
      msg('assistant', 'B'.repeat(400)), // 100 tokens
      msg('user', 'C'.repeat(400)),   // 100 tokens
    ]

    // Budget: system (1 token) + only room for ~50 tokens of recent
    // System = ceil(3/4) = 1 token, budget for recent = 49
    // Last message C = 100 tokens, won't fit alone with 49 budget
    // So we need a budget that allows the last message but not all
    // C = 100 tokens, B = 100 tokens => 200. System = 1. Budget = 150 allows C only.
    const result = trimConversation(messages, 150)

    // First message always preserved
    expect(result[0]).toEqual(system)

    // Should contain omission marker
    expect(result[1].content).toBe('[Earlier conversation context omitted]')

    // Should have trimmed older messages, keeping only what fits
    // Budget for recent = 150 - 1 = 149. C=100 fits, B=100 would be 200 > 149
    expect(result).toHaveLength(3) // system + marker + last message
    expect(result[2].content).toBe('C'.repeat(400))
  })

  it('always preserves the first message regardless of budget', () => {
    const system = msg('system', 'A'.repeat(2000)) // 500 tokens
    const messages = [
      system,
      msg('user', 'Small'),
    ]

    // Even with a tiny budget, system message is preserved
    const result = trimConversation(messages, 10)

    expect(result[0]).toEqual(system)
  })

  it('injects omission marker after first message when trimming by count', () => {
    const messages = [msg('system', 'S')]
    for (let i = 0; i < 32; i++) {
      messages.push(msg('user', `M${i}`))
    }
    // 33 messages total, > MAX_RECENT_MESSAGES + 1 (31)

    const result = trimConversation(messages, 100000)

    expect(result[0].content).toBe('S')
    expect(result[1].content).toBe('[Earlier conversation context omitted]')
    expect(result[1].role).toBe('assistant')
  })

  it('keeps last messages fitting within budget minus first message cost', () => {
    const system = msg('system', 'ABCD') // 4 chars = 1 token
    const messages = [
      system,
      msg('user', 'X'.repeat(80)),       // 20 tokens
      msg('assistant', 'Y'.repeat(80)),   // 20 tokens
      msg('user', 'Z'.repeat(40)),        // 10 tokens
    ]

    // Budget = 35 tokens. System = 1 token. Remaining = 34.
    // Z = 10, Y = 20, X = 20. From the end: Z(10) + Y(20) = 30 <= 34. X would be 50 > 34.
    // Should keep Y and Z.
    const result = trimConversation(messages, 35)

    expect(result[0]).toEqual(system)
    expect(result[1].content).toBe('[Earlier conversation context omitted]')
    expect(result[2].content).toBe('Y'.repeat(80))
    expect(result[3].content).toBe('Z'.repeat(40))
    expect(result).toHaveLength(4)
  })
})
