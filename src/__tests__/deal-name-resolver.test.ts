import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deal: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}))

import { resolveDealName } from '../lib/ai/tools/deals/deal-name-resolver'
import { prisma } from '@/lib/prisma'

const mockDeals = [
  { id: 'd1', companyName: 'TechServ LLC', stage: 'INITIAL_REVIEW' },
  { id: 'd2', companyName: 'TechServ Holdings', stage: 'NDA_SIGNED' },
  { id: 'd3', companyName: 'Alpine Bakery', stage: 'IOI_SUBMITTED' },
  { id: 'd4', companyName: 'DataFlow Systems', stage: 'DUE_DILIGENCE' },
]

describe('resolveDealName', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns exact match', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('Alpine Bakery', 'fund1')
    expect(result).toEqual({ dealId: 'd3', dealName: 'Alpine Bakery' })
  })

  it('is case-insensitive', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('alpine bakery', 'fund1')
    expect(result).toEqual({ dealId: 'd3', dealName: 'Alpine Bakery' })
  })

  it('matches partial name (substring)', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('DataFlow', 'fund1')
    expect(result).toEqual({ dealId: 'd4', dealName: 'DataFlow Systems' })
  })

  it('returns ambiguous when multiple matches', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('TechServ', 'fund1')
    expect(result).toEqual({
      ambiguous: true,
      candidates: [
        { id: 'd1', name: 'TechServ LLC' },
        { id: 'd2', name: 'TechServ Holdings' },
      ],
    })
  })

  it('returns notFound when no matches', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('Nonexistent Corp', 'fund1')
    expect(result).toEqual({ notFound: true, query: 'Nonexistent Corp' })
  })

  it('resolves by deal ID passthrough', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    vi.mocked(prisma.deal.findFirst).mockResolvedValue({ id: 'd1', companyName: 'TechServ LLC' } as never)
    const result = await resolveDealName('clxxxxxxxxxxxxxxxxxxxxxxxxx', 'fund1')
    expect(result).toEqual({ dealId: 'd1', dealName: 'TechServ LLC' })
  })
})
