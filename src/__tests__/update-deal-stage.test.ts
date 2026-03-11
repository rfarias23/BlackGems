import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deal: { findMany: vi.fn(), findFirst: vi.fn() },
    agentAction: { create: vi.fn() },
  },
}))

import { updateDealStageTool } from '../lib/ai/tools/deals/update-deal-stage'
import { prisma } from '@/lib/prisma'

const mockCtx = { fundId: 'f1', currency: 'USD' as const, userId: 'u1', conversationId: 'c1' }

describe('update-deal-stage tool', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('has correct metadata', () => {
    expect(updateDealStageTool.metadata.name).toBe('updateDealStage')
    expect(updateDealStageTool.metadata.category).toBe('deals')
  })

  it('creates a proposal with resolved deal and stage', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { id: 'd1', companyName: 'TechServ LLC', stage: 'INITIAL_REVIEW' },
    ] as never)
    vi.mocked(prisma.agentAction.create).mockResolvedValue({ id: 'aa1' } as never)

    const result = await updateDealStageTool.execute(
      { dealName: 'TechServ', newStage: 'IOI', note: 'Good call' },
      mockCtx
    )

    expect(result).toMatchObject({
      needsApproval: true,
      actionId: 'aa1',
      tool: 'update-deal-stage',
    })
    expect((result as { summary: string }).summary).toContain('TechServ LLC')
  })

  it('returns error if deal not found', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([] as never)

    const result = await updateDealStageTool.execute(
      { dealName: 'Nonexistent', newStage: 'IOI' },
      mockCtx
    )

    expect(result).toMatchObject({ error: expect.stringContaining('not find') })
  })

  it('returns error if stage alias is invalid', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { id: 'd1', companyName: 'TechServ LLC', stage: 'INITIAL_REVIEW' },
    ] as never)

    const result = await updateDealStageTool.execute(
      { dealName: 'TechServ', newStage: 'banana_stage' },
      mockCtx
    )

    expect(result).toMatchObject({ error: expect.stringContaining('stage') })
  })
})
