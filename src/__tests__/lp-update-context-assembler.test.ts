import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fund: { findUnique: vi.fn() },
    commitment: { findMany: vi.fn() },
    portfolioCompany: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    investor: { findMany: vi.fn() },
    activity: { findMany: vi.fn() },
  },
}))

import { assembleLPUpdateContext } from '../lib/ai/tools/reports/lp-update-context-assembler'
import { prisma } from '@/lib/prisma'

describe('assembleLPUpdateContext', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('assembles context from all sources', async () => {
    vi.mocked(prisma.fund.findUnique).mockResolvedValue({
      id: 'f1', name: 'Test Fund', targetSize: 10000000, currency: 'USD',
    } as never)
    vi.mocked(prisma.commitment.findMany).mockResolvedValue([
      { committedAmount: 5000000, calledAmount: 2000000, distributedAmount: 500000 },
    ] as never)
    vi.mocked(prisma.portfolioCompany.findMany).mockResolvedValue([
      { name: 'PortCo1', equityInvested: 1000000, totalValue: 1500000 },
    ] as never)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { companyName: 'Deal1', stage: 'IOI_SUBMITTED', status: 'ACTIVE' },
    ] as never)
    vi.mocked(prisma.investor.findMany).mockResolvedValue([
      { name: 'LP1', type: 'INDIVIDUAL' },
    ] as never)
    vi.mocked(prisma.activity.findMany).mockResolvedValue([] as never)

    const result = await assembleLPUpdateContext('f1', { type: 'Q1', year: 2026 })

    expect(result).not.toHaveProperty('error')
    const ctx = result as { fundName: string; totalCommitments: number; portfolioCompanies: unknown[]; activeDeals: unknown[]; investorCount: number }
    expect(ctx.fundName).toBe('Test Fund')
    expect(ctx.totalCommitments).toBe(5000000)
    expect(ctx.portfolioCompanies).toHaveLength(1)
    expect(ctx.activeDeals).toHaveLength(1)
    expect(ctx.investorCount).toBe(1)
  })

  it('returns error if fund not found', async () => {
    vi.mocked(prisma.fund.findUnique).mockResolvedValue(null as never)
    const result = await assembleLPUpdateContext('bad-id', { type: 'Q1', year: 2026 })
    expect(result).toMatchObject({ error: 'Fund not found' })
  })
})
