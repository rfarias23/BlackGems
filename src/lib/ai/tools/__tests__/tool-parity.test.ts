import { describe, it, expect } from 'vitest'
import { createDefaultRegistry } from '../create-default-registry'

/**
 * Parity test: verifies the ITool-based registry produces the expected tool
 * names, descriptions, and SDK shape for all registered tools.
 */

const EXPECTED_TOOL_METADATA = [
  // Phase 1
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
  // Phase 1.5 Batch 1
  {
    name: 'getCapitalCallSummary',
    description: 'Get a summary of all capital calls for the fund including total called, collected, outstanding amounts, and status breakdown by call.',
    category: 'capital',
  },
  {
    name: 'getCapitalCallDetails',
    description: 'Get detailed information about a specific capital call including per-investor payment status, amounts, and collection progress.',
    category: 'capital',
  },
  {
    name: 'getOverdueCallItems',
    description: 'Get all overdue capital call line items \u2014 specific LPs who have missed payment deadlines. Returns per-investor detail grouped by call, including amounts owed, days overdue, and contact info for follow-up. Only includes calls that have been sent to LPs.',
    category: 'capital',
  },
  {
    name: 'getDistributionSummary',
    description: 'Get a summary of all distributions for the fund including total distributed, breakdown by distribution type and status, component totals (return of capital, realized gains, dividends, interest), and recent distribution history.',
    category: 'capital',
  },
  {
    name: 'getDistributionDetails',
    description: 'Get detailed information about a specific distribution including per-investor payment amounts, withholding tax, net amounts, and payment status.',
    category: 'capital',
  },
  // Phase 1.5 Batch 2
  {
    name: 'getDDOverview',
    description: 'Get the due diligence status across all active deals in the fund. Shows completion progress, red flags, and category breakdown for deals in DUE_DILIGENCE, FINAL_NEGOTIATION, and CLOSING stages.',
    category: 'deals',
  },
  {
    name: 'getDealDDItems',
    description: 'Get all due diligence items for a specific deal, grouped by category. Includes status, priority, findings, and red flags for each item. Use this when the user asks about DD status for a particular deal.',
    category: 'deals',
  },
  {
    name: 'getDealContacts',
    description: 'Get all contacts associated with a specific deal including names, roles, titles, and contact information. Use this when the user asks about who is involved in a deal or needs someone\'s contact details.',
    category: 'deals',
  },
  // Phase 2: Write tools (approval-gated)
  {
    name: 'updateDealStage',
    description: 'Move a deal to a new pipeline stage, optionally add a note and follow-up task. Requires user approval before executing.',
    category: 'deals',
  },
  {
    name: 'logMeetingNote',
    description: 'Log a meeting or call: extracts summary, action items, optional follow-up email draft, and optional stage change suggestion. Requires user approval before executing.',
    category: 'deals',
  },
  {
    name: 'draftLPUpdate',
    description: 'Draft a quarterly LP update letter from live fund data. First call assembles fund context. Second call (with sections populated) creates the draft for approval.',
    category: 'operations',
  },
] as const

describe('tool-parity: registry contains all expected tools', () => {
  const registry = createDefaultRegistry()

  it('has exactly 16 tools', () => {
    expect(registry.getAll()).toHaveLength(16)
  })

  it('all expected tool names are present', () => {
    const names = registry.getAll().map((t) => t.metadata.name)
    for (const expected of EXPECTED_TOOL_METADATA) {
      expect(names).toContain(expected.name)
    }
  })

  it('descriptions match exactly', () => {
    for (const expected of EXPECTED_TOOL_METADATA) {
      const tool = registry.get(expected.name)
      expect(tool).toBeDefined()
      expect(tool!.metadata.description).toBe(expected.description)
    }
  })

  it('categories are assigned correctly', () => {
    for (const expected of EXPECTED_TOOL_METADATA) {
      const tool = registry.get(expected.name)
      expect(tool!.metadata.category).toBe(expected.category)
    }
  })

  it('capital category has 6 tools (1 existing + 5 new)', () => {
    expect(registry.getByCategory('capital')).toHaveLength(6)
  })

  it('deals category has 7 tools (5 read + 2 write)', () => {
    expect(registry.getByCategory('deals')).toHaveLength(7)
  })

  it('operations category has 1 tool', () => {
    expect(registry.getByCategory('operations')).toHaveLength(1)
  })

  it('toSDKTools produces all 16 tools with expected shape', () => {
    const ctx = { fundId: 'test-fund', currency: 'USD' as const, userId: 'test-user', conversationId: 'test-conv' }
    const sdkTools = registry.toSDKTools(ctx)

    for (const expected of EXPECTED_TOOL_METADATA) {
      expect(sdkTools).toHaveProperty(expected.name)
      expect(sdkTools[expected.name]).toHaveProperty('description')
      expect(sdkTools[expected.name]).toHaveProperty('inputSchema')
      expect(sdkTools[expected.name]).toHaveProperty('execute')
    }
  })

  it('generatePromptSection includes all tool names and descriptions', () => {
    const section = registry.generatePromptSection()
    for (const expected of EXPECTED_TOOL_METADATA) {
      expect(section).toContain(expected.name)
      expect(section).toContain(expected.description)
    }
  })
})
