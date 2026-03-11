import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fund: { findUnique: vi.fn() },
    commitment: { findMany: vi.fn() },
    portfolioCompany: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    investor: { findMany: vi.fn() },
    activity: { findMany: vi.fn() },
    agentAction: { create: vi.fn() },
  },
}))

import { draftLPUpdateTool } from '../lib/ai/tools/reports/draft-lp-update'
import { prisma } from '@/lib/prisma'

const mockCtx = { fundId: 'f1', currency: 'USD' as const, userId: 'u1', conversationId: 'c1' }

describe('draft-lp-update tool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.fund.findUnique).mockResolvedValue({
      id: 'f1', name: 'Test Fund', targetSize: 10000000, currency: 'USD',
    } as never)
    vi.mocked(prisma.commitment.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.portfolioCompany.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.investor.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.activity.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.agentAction.create).mockResolvedValue({ id: 'aa1' } as never)
  })

  it('has correct metadata', () => {
    expect(draftLPUpdateTool.metadata.name).toBe('draftLPUpdate')
    expect(draftLPUpdateTool.metadata.category).toBe('operations')
  })

  it('returns context and instructions when no sections provided (first call)', async () => {
    const result = await draftLPUpdateTool.execute({
      periodType: 'Q1',
      year: 2026,
      tone: 'formal',
      customHighlights: 'TechServ LOI signed',
    }, mockCtx)

    // First call should return context + instructions (not needsApproval)
    const r = result as { context: unknown; instructions: string }
    expect(r.context).toBeDefined()
    expect(r.instructions).toContain('LP update')
  })

  it('creates proposal when sections are provided (second call)', async () => {
    const result = await draftLPUpdateTool.execute({
      periodType: 'Q1',
      year: 2026,
      tone: 'formal',
      sections: [
        { key: 'opening', title: 'Opening Letter', content: 'Dear LPs...', editable: true },
        { key: 'summary', title: 'Fund Summary', content: 'The fund has...', editable: true },
      ],
    }, mockCtx)

    expect(result).toMatchObject({
      needsApproval: true,
      actionId: 'aa1',
      tool: 'draft-lp-update',
    })
  })

  it('returns error if fund not found', async () => {
    vi.mocked(prisma.fund.findUnique).mockResolvedValue(null as never)
    const result = await draftLPUpdateTool.execute({ periodType: 'Q1', year: 2026, tone: 'formal' }, mockCtx)
    expect(result).toMatchObject({ error: expect.stringContaining('Fund') })
  })
})
