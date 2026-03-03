import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { ITool, ToolContext, ToolMetadata, PromptSection } from '../types'

describe('core/types', () => {
  it('ITool interface accepts a conforming tool object', () => {
    const mockTool: ITool<Record<string, never>, { count: number }> = {
      metadata: {
        name: 'testTool',
        description: 'A test tool',
        category: 'deals',
      },
      inputSchema: z.object({}),
      execute: async () => ({ count: 42 }),
    }

    expect(mockTool.metadata.name).toBe('testTool')
    expect(mockTool.metadata.category).toBe('deals')
  })

  it('ToolContext provides fundId, currency, userId', () => {
    const ctx: ToolContext = {
      fundId: 'fund_123',
      currency: 'USD',
      userId: 'user_456',
    }

    expect(ctx.fundId).toBe('fund_123')
    expect(ctx.currency).toBe('USD')
  })

  it('PromptSection has required fields', () => {
    const section: PromptSection = {
      name: 'identity',
      order: 1,
      required: true,
      content: 'You are Emma.',
    }

    expect(section.name).toBe('identity')
    expect(section.required).toBe(true)
  })
})
