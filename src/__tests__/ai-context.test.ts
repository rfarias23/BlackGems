import { describe, it, expect } from 'vitest'
import { assembleUserContext } from '../lib/ai/context/user-context'
import { buildSystemPrompt } from '../lib/ai/system-prompt'
import type { FundContext } from '../lib/ai/context/fund-context'
import type { UserContext } from '../lib/ai/context/user-context'

// ============================================================================
// Test data
// ============================================================================

const mockFundContext: FundContext = {
  fund: {
    id: 'fund-1',
    name: 'Alpha Fund I',
    currency: 'USD',
    status: 'FUNDRAISING',
    targetSize: 10000000,
    type: 'SEARCH_FUND',
  },
  dealCounts: [
    { stage: 'SOURCING', _count: 5 },
    { stage: 'DUE_DILIGENCE', _count: 2 },
  ],
  investorSummary: {
    totalCommitted: 5000000,
    totalPaid: 2000000,
    investorCount: 8,
  },
  recentCapitalCalls: [
    {
      id: 'cc-1',
      callDate: new Date('2025-01-15'),
      totalAmount: 500000,
      status: 'FUNDED',
    },
  ],
  portfolioSummary: [
    {
      name: 'TechCo',
      status: 'ACTIVE',
      equityInvested: 1000000,
      moic: 1.5,
    },
  ],
}

const mockUserContext: UserContext = {
  name: 'Rodolfo',
  role: 'FUND_ADMIN',
  id: 'user-1',
}

// ============================================================================
// assembleUserContext
// ============================================================================

describe('assembleUserContext', () => {
  it('returns name from session', () => {
    const result = assembleUserContext({
      user: { id: 'user-1', name: 'Rodolfo', role: 'FUND_ADMIN' },
    })
    expect(result.name).toBe('Rodolfo')
  })

  it('returns "there" when name is null or undefined', () => {
    const withNull = assembleUserContext({
      user: { id: 'user-1', name: null },
    })
    expect(withNull.name).toBe('there')

    const withUndefined = assembleUserContext({
      user: { id: 'user-1' },
    })
    expect(withUndefined.name).toBe('there')
  })

  it('returns FUND_ADMIN when role is not provided', () => {
    const result = assembleUserContext({
      user: { id: 'user-1', name: 'Rodolfo' },
    })
    expect(result.role).toBe('FUND_ADMIN')
  })

  it('returns empty string when id is not provided', () => {
    const result = assembleUserContext({
      user: { name: 'Rodolfo' },
    })
    expect(result.id).toBe('')
  })
})

// ============================================================================
// buildSystemPrompt
// ============================================================================

describe('buildSystemPrompt', () => {
  it('produces a prompt under 3000 tokens with typical fund context', () => {
    const prompt = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', false)
    // Heuristic: ~4 chars per token, so 3000 tokens ~ 12000 chars
    expect(prompt.length).toBeLessThan(12000)
  })

  it('includes [FIRST MESSAGE] section with user name when isFirstTime is true', () => {
    const prompt = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', true)
    expect(prompt).toContain('[FIRST MESSAGE]')
    expect(prompt).toContain('Rodolfo')
  })

  it('includes [CONTINUATION] section when isFirstTime is false', () => {
    const prompt = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', false)
    expect(prompt).toContain('[CONTINUATION]')
  })

  it('includes currency symbol for USD', () => {
    const prompt = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', false)
    expect(prompt).toContain('$')
  })

  it('includes currency symbol for EUR', () => {
    const eurContext: FundContext = {
      ...mockFundContext,
      fund: { ...mockFundContext.fund!, currency: 'EUR' },
    }
    const prompt = buildSystemPrompt(eurContext, mockUserContext, 'EUR', false)
    expect(prompt).toContain('\u20AC')
  })

  it('includes currency symbol for GBP', () => {
    const gbpContext: FundContext = {
      ...mockFundContext,
      fund: { ...mockFundContext.fund!, currency: 'GBP' },
    }
    const prompt = buildSystemPrompt(gbpContext, mockUserContext, 'GBP', false)
    expect(prompt).toContain('\u00A3')
  })

  it('includes the fund name in the prompt', () => {
    const prompt = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', false)
    expect(prompt).toContain('Alpha Fund I')
  })

  it('produces "No fund data available" when fund is null', () => {
    const nullFundContext: FundContext = {
      fund: null,
      dealCounts: [],
      investorSummary: { totalCommitted: 0, totalPaid: 0, investorCount: 0 },
      recentCapitalCalls: [],
      portfolioSummary: [],
    }
    const prompt = buildSystemPrompt(nullFundContext, mockUserContext, 'USD', false)
    expect(prompt).toContain('No fund data available')
  })

  it('includes all 5 tool names in the prompt', () => {
    const prompt = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', false)
    const toolNames = [
      'getPipelineSummary',
      'getDealDetails',
      'getFundFinancials',
      'getInvestorDetails',
      'getPortfolioMetrics',
    ]
    for (const tool of toolNames) {
      expect(prompt).toContain(tool)
    }
  })
})
