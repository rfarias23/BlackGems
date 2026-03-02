import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { ToolRegistry } from '../registry'
import type { ITool } from '../../core/types'

function makeTool(overrides: Partial<ITool['metadata']> & { name: string }): ITool {
  return {
    metadata: {
      description: `${overrides.name} description`,
      category: overrides.category ?? 'deals',
      ...overrides,
    },
    inputSchema: z.object({}),
    execute: async () => ({ ok: true }),
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  it('registers and retrieves a tool', () => {
    const tool = makeTool({ name: 'getPipeline' })
    registry.register(tool)
    expect(registry.getAll()).toHaveLength(1)
    expect(registry.get('getPipeline')).toBe(tool)
  })

  it('throws on duplicate registration', () => {
    const tool = makeTool({ name: 'getPipeline' })
    registry.register(tool)
    expect(() => registry.register(tool)).toThrow('already registered')
  })

  it('filters by category', () => {
    registry.register(makeTool({ name: 'a', category: 'deals' }))
    registry.register(makeTool({ name: 'b', category: 'capital' }))
    registry.register(makeTool({ name: 'c', category: 'deals' }))

    expect(registry.getByCategory('deals')).toHaveLength(2)
    expect(registry.getByCategory('capital')).toHaveLength(1)
    expect(registry.getByCategory('portfolio')).toHaveLength(0)
  })

  it('generates prompt section from metadata', () => {
    registry.register(makeTool({ name: 'getPipeline' }))
    registry.register(makeTool({ name: 'getDeal' }))

    const section = registry.generatePromptSection()
    expect(section).toContain('getPipeline')
    expect(section).toContain('getDeal')
    expect(section).toContain('getPipeline description')
  })

  it('converts to AI SDK tools format', () => {
    registry.register(makeTool({ name: 'getPipeline' }))

    const ctx = { fundId: 'f1', currency: 'USD' as const, userId: 'u1' }
    const sdkTools = registry.toSDKTools(ctx)

    expect(sdkTools).toHaveProperty('getPipeline')
    expect(sdkTools.getPipeline).toHaveProperty('description')
    expect(sdkTools.getPipeline).toHaveProperty('parameters')
    expect(sdkTools.getPipeline).toHaveProperty('execute')
  })
})
