import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agentAction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deal: { findFirst: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn() },
    task: { create: vi.fn() },
    report: { create: vi.fn() },
    communication: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/shared/fund-access', () => ({ requireFundAccess: vi.fn() }))
vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  computeChanges: vi.fn().mockReturnValue({}),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createAgentAction, approveAgentAction, rejectAgentAction } from '../lib/actions/agent-actions'
import { auth } from '@/lib/auth'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { prisma } from '@/lib/prisma'

describe('agent-actions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('createAgentAction', () => {
    it('creates PROPOSED action and returns actionId', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.create).mockResolvedValue({ id: 'aa1' } as never)

      const result = await createAgentAction({
        fundId: 'f1',
        conversationId: 'c1',
        tool: 'update-deal-stage',
        proposedPayload: { dealId: 'd1', newStage: 'UNDER_LOI' },
      })
      expect(result).toEqual({ success: true, actionId: 'aa1' })
    })

    it('rejects unauthorized users', async () => {
      vi.mocked(auth).mockResolvedValue(null as never)
      const result = await createAgentAction({
        fundId: 'f1', conversationId: 'c1', tool: 'test', proposedPayload: {},
      })
      expect(result).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('approveAgentAction', () => {
    it('updates status to APPROVED', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.findUnique).mockResolvedValue({
        id: 'aa1', status: 'PROPOSED', tool: 'update-deal-stage',
        fundId: 'f1', userId: 'u1', proposedPayload: { dealId: 'd1', newStage: 'IOI_SUBMITTED' },
      } as never)
      vi.mocked(prisma.deal.findFirst).mockResolvedValue({
        id: 'd1', stage: 'NDA_CIM', companyName: 'Test Co',
      } as never)
      // $transaction receives a callback — execute it with the prisma mock as the tx arg
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        if (typeof fn === 'function') return fn(prisma as never)
        return undefined as never
      })
      vi.mocked(prisma.deal.update).mockResolvedValue({ id: 'd1' } as never)
      vi.mocked(prisma.activity.create).mockResolvedValue({ id: 'act1' } as never)
      vi.mocked(prisma.agentAction.update).mockResolvedValue({ id: 'aa1' } as never)

      const result = await approveAgentAction('aa1')
      expect(requireFundAccess).toHaveBeenCalledWith('u1', 'f1')
      expect(result).toEqual(expect.objectContaining({ success: true }))
    })

    it('rejects if action not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.findUnique).mockResolvedValue(null as never)

      const result = await approveAgentAction('aa-missing')
      expect(result).toEqual({ error: 'Action not found' })
    })

    it('rejects if action not in PROPOSED status', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.findUnique).mockResolvedValue({
        id: 'aa1', status: 'APPROVED', tool: 'test', fundId: 'f1', userId: 'u1',
      } as never)

      const result = await approveAgentAction('aa1')
      expect(result).toEqual({ error: 'Action is not pending approval' })
    })
  })

  describe('rejectAgentAction', () => {
    it('updates status to REJECTED', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.findUnique).mockResolvedValue({
        id: 'aa1', status: 'PROPOSED', fundId: 'f1', userId: 'u1',
      } as never)
      vi.mocked(prisma.agentAction.update).mockResolvedValue({ id: 'aa1' } as never)

      const result = await rejectAgentAction('aa1')
      expect(requireFundAccess).toHaveBeenCalledWith('u1', 'f1')
      expect(result).toEqual({ success: true })
    })
  })
})
