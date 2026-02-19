import { describe, it, expect } from 'vitest'
import type { UIMessage } from 'ai'

// ============================================================================
// UIMessage <-> DB Message mapping contract tests
//
// The conversion functions (uiMessageToDb, dbMessageToUi) are private in
// ai-conversations.ts. We replicate their logic here to validate the mapping
// contract that the server actions depend on.
// ============================================================================

interface DbMessage {
  id: string
  role: string
  content: string
  toolInvocations: unknown
  createdAt: Date
}

/**
 * Replicates uiMessageToDb from ai-conversations.ts.
 * Extracts text parts into a joined content string and tool-invocation parts
 * into a separate JSON-serializable array.
 */
function uiMessageToDb(msg: UIMessage): {
  role: string
  content: string
  toolInvocations: unknown | null
} {
  const textContent = msg.parts
    .filter(
      (p): p is Extract<UIMessage['parts'][number], { type: 'text' }> =>
        p.type === 'text'
    )
    .map((p) => p.text)
    .join('\n')

  const toolParts = msg.parts.filter((p) => p.type === 'tool-invocation')
  const toolInvocations = toolParts.length > 0 ? toolParts : null

  return {
    role: msg.role,
    content: textContent,
    toolInvocations,
  }
}

/**
 * Replicates dbMessageToUi from ai-conversations.ts.
 * Reconstructs a UIMessage from flat DB fields.
 */
function dbMessageToUi(msg: DbMessage): UIMessage {
  const parts: UIMessage['parts'] = []

  if (msg.content) {
    parts.push({ type: 'text' as const, text: msg.content })
  }

  if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
    for (const ti of msg.toolInvocations) {
      parts.push(ti as UIMessage['parts'][number])
    }
  }

  return {
    id: msg.id,
    role: msg.role as UIMessage['role'],
    parts,
  }
}

// ============================================================================
// Test fixtures
// ============================================================================

function makeToolInvocationPart(overrides?: Record<string, unknown>) {
  return {
    type: 'tool-invocation',
    toolInvocationId: 'tool-1',
    toolName: 'getPipelineSummary',
    args: {},
    state: 'result',
    result: { totalDeals: 5 },
    ...overrides,
  } as unknown as UIMessage['parts'][number]
}

// ============================================================================
// uiMessageToDb tests
// ============================================================================

describe('uiMessageToDb', () => {
  it('extracts text content from a user message', () => {
    const userMsg: UIMessage = {
      id: 'msg-1',
      role: 'user',
      parts: [{ type: 'text', text: 'How many deals do we have?' }],
    }

    const result = uiMessageToDb(userMsg)

    expect(result.role).toBe('user')
    expect(result.content).toBe('How many deals do we have?')
    expect(result.toolInvocations).toBeNull()
  })

  it('preserves assistant role for assistant messages', () => {
    const assistantMsg: UIMessage = {
      id: 'msg-2',
      role: 'assistant',
      parts: [{ type: 'text', text: 'You have 12 active deals.' }],
    }

    const result = uiMessageToDb(assistantMsg)

    expect(result.role).toBe('assistant')
    expect(result.content).toBe('You have 12 active deals.')
    expect(result.toolInvocations).toBeNull()
  })

  it('separates text and tool invocations from assistant message', () => {
    const assistantMsgWithTools: UIMessage = {
      id: 'msg-3',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Let me check your pipeline.' },
        makeToolInvocationPart(),
      ],
    }

    const result = uiMessageToDb(assistantMsgWithTools)

    expect(result.role).toBe('assistant')
    expect(result.content).toBe('Let me check your pipeline.')
    expect(result.toolInvocations).not.toBeNull()
    expect(Array.isArray(result.toolInvocations)).toBe(true)
    const tools = result.toolInvocations as Array<Record<string, unknown>>
    expect(tools).toHaveLength(1)
    expect(tools[0]).toHaveProperty('type', 'tool-invocation')
    expect(tools[0]).toHaveProperty('toolName', 'getPipelineSummary')
  })

  it('joins multiple text parts with newline', () => {
    const multiTextMsg: UIMessage = {
      id: 'msg-4',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Here is a summary:' },
        { type: 'text', text: 'Total deals: 5' },
        { type: 'text', text: 'Active: 3' },
      ],
    }

    const result = uiMessageToDb(multiTextMsg)

    expect(result.content).toBe('Here is a summary:\nTotal deals: 5\nActive: 3')
    expect(result.toolInvocations).toBeNull()
  })

  it('returns empty content and null tool invocations for empty parts', () => {
    const emptyMsg: UIMessage = {
      id: 'msg-5',
      role: 'assistant',
      parts: [],
    }

    const result = uiMessageToDb(emptyMsg)

    expect(result.content).toBe('')
    expect(result.toolInvocations).toBeNull()
  })
})

// ============================================================================
// dbMessageToUi tests
// ============================================================================

describe('dbMessageToUi', () => {
  it('converts a DB text message to UIMessage with text part', () => {
    const dbMsg: DbMessage = {
      id: 'db-1',
      role: 'user',
      content: 'Show me fund performance.',
      toolInvocations: null,
      createdAt: new Date('2025-01-15T10:00:00Z'),
    }

    const result = dbMessageToUi(dbMsg)

    expect(result.id).toBe('db-1')
    expect(result.role).toBe('user')
    expect(result.parts).toHaveLength(1)
    expect(result.parts[0]).toEqual({ type: 'text', text: 'Show me fund performance.' })
  })

  it('includes both text and tool invocation parts', () => {
    const toolPart = makeToolInvocationPart()
    const dbMsg: DbMessage = {
      id: 'db-2',
      role: 'assistant',
      content: 'Here are the results.',
      toolInvocations: [toolPart],
      createdAt: new Date('2025-01-15T10:01:00Z'),
    }

    const result = dbMessageToUi(dbMsg)

    expect(result.id).toBe('db-2')
    expect(result.role).toBe('assistant')
    expect(result.parts).toHaveLength(2)
    expect(result.parts[0]).toEqual({ type: 'text', text: 'Here are the results.' })
    expect(result.parts[1]).toHaveProperty('type', 'tool-invocation')
  })

  it('omits text part when content is empty', () => {
    const toolPart = makeToolInvocationPart()
    const dbMsg: DbMessage = {
      id: 'db-3',
      role: 'assistant',
      content: '',
      toolInvocations: [toolPart],
      createdAt: new Date('2025-01-15T10:02:00Z'),
    }

    const result = dbMessageToUi(dbMsg)

    expect(result.parts).toHaveLength(1)
    expect(result.parts[0]).toHaveProperty('type', 'tool-invocation')
    // No text part should exist
    const textParts = result.parts.filter((p) => p.type === 'text')
    expect(textParts).toHaveLength(0)
  })
})

// ============================================================================
// Roundtrip tests
// ============================================================================

describe('UIMessage roundtrip', () => {
  it('preserves text content through UIMessage -> DB -> UIMessage', () => {
    const original: UIMessage = {
      id: 'rt-1',
      role: 'user',
      parts: [{ type: 'text', text: 'What is our IRR for Fund I?' }],
    }

    const dbShape = uiMessageToDb(original)
    const dbMsg: DbMessage = {
      id: original.id,
      role: dbShape.role,
      content: dbShape.content,
      toolInvocations: dbShape.toolInvocations,
      createdAt: new Date(),
    }
    const restored = dbMessageToUi(dbMsg)

    expect(restored.id).toBe(original.id)
    expect(restored.role).toBe(original.role)
    expect(restored.parts).toHaveLength(1)
    expect(restored.parts[0]).toEqual(original.parts[0])
  })

  it('preserves tool invocations through UIMessage -> DB -> UIMessage', () => {
    const toolPart = makeToolInvocationPart({
      toolInvocationId: 'tool-rt',
      toolName: 'getDealMetrics',
      args: { fundId: 'fund-1' },
      result: { irr: 0.25, tvpi: 1.8 },
    })

    const original: UIMessage = {
      id: 'rt-2',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Let me pull the metrics.' },
        toolPart,
      ],
    }

    const dbShape = uiMessageToDb(original)
    const dbMsg: DbMessage = {
      id: original.id,
      role: dbShape.role,
      content: dbShape.content,
      toolInvocations: dbShape.toolInvocations,
      createdAt: new Date(),
    }
    const restored = dbMessageToUi(dbMsg)

    expect(restored.id).toBe(original.id)
    expect(restored.role).toBe(original.role)
    expect(restored.parts).toHaveLength(2)

    // Text part preserved
    expect(restored.parts[0]).toEqual({ type: 'text', text: 'Let me pull the metrics.' })

    // Tool invocation part preserved
    const restoredTool = restored.parts[1] as Record<string, unknown>
    expect(restoredTool.type).toBe('tool-invocation')
    expect(restoredTool.toolName).toBe('getDealMetrics')
    expect(restoredTool.result).toEqual({ irr: 0.25, tvpi: 1.8 })
  })
})
