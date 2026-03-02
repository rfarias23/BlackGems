import { describe, it, expect } from 'vitest'
import { createDefaultRegistry } from '../create-default-registry'

/**
 * Parity test: verifies the new ITool-based registry produces the same tool
 * names, descriptions, and SDK shape as the old createReadTools().
 *
 * We cannot import createReadTools here because it requires a live Prisma
 * connection. Instead we verify against the known tool metadata from the
 * old implementation (captured as constants).
 */

// --- Snapshot of old createReadTools metadata ---
const OLD_TOOL_METADATA = [
  {
    name: 'getPipelineSummary',
    description: 'Get the current deal pipeline with counts by stage, total pipeline value, and active deal count.',
    category: 'deals',
  },
  {
    name: 'getDealDetails',
    description: 'Get detailed information about a specific deal by name or ID. Use this when the user asks about a particular deal.',
    category: 'deals',
  },
  {
    name: 'getFundFinancials',
    description: 'Get the fund financial summary including total committed capital, called capital, distributed capital, and performance metrics.',
    category: 'capital',
  },
  {
    name: 'getInvestorDetails',
    description: 'Get details about a specific investor/LP including their commitment, paid-in amount, and contact information.',
    category: 'investors',
  },
  {
    name: 'getPortfolioMetrics',
    description: 'Get portfolio company metrics including revenue, EBITDA, margins, and performance data.',
    category: 'portfolio',
  },
] as const

describe('tool-parity: new ITool registry matches old createReadTools', () => {
  const registry = createDefaultRegistry()

  it('has exactly 5 tools', () => {
    expect(registry.getAll()).toHaveLength(5)
  })

  it('all old tool names are present', () => {
    const names = registry.getAll().map((t) => t.metadata.name)
    for (const old of OLD_TOOL_METADATA) {
      expect(names).toContain(old.name)
    }
  })

  it('descriptions match exactly', () => {
    for (const old of OLD_TOOL_METADATA) {
      const tool = registry.get(old.name)
      expect(tool).toBeDefined()
      expect(tool!.metadata.description).toBe(old.description)
    }
  })

  it('categories are assigned correctly', () => {
    for (const old of OLD_TOOL_METADATA) {
      const tool = registry.get(old.name)
      expect(tool!.metadata.category).toBe(old.category)
    }
  })

  it('toSDKTools produces all 5 tools with expected shape', () => {
    const ctx = { fundId: 'test-fund', currency: 'USD' as const, userId: 'test-user' }
    const sdkTools = registry.toSDKTools(ctx)

    for (const old of OLD_TOOL_METADATA) {
      expect(sdkTools).toHaveProperty(old.name)
      expect(sdkTools[old.name]).toHaveProperty('description')
      expect(sdkTools[old.name]).toHaveProperty('parameters')
      expect(sdkTools[old.name]).toHaveProperty('execute')
    }
  })

  it('generatePromptSection includes all tool names and descriptions', () => {
    const section = registry.generatePromptSection()
    for (const old of OLD_TOOL_METADATA) {
      expect(section).toContain(old.name)
      expect(section).toContain(old.description)
    }
  })
})
