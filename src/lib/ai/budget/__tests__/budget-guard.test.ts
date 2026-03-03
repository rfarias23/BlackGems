import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkBudget } from '../budget-guard'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

/**
 * Budget guard tests. Per Marcus Correction 2, budget aggregation is
 * per-userId (not per-fundId) to prevent users from bypassing budget
 * limits by switching between funds in the same organization.
 */
describe('checkBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows when no AI interactions exist', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
    const result = await checkBudget('user_1', 50)
    expect(result.allowed).toBe(true)
    expect(result.usedUSD).toBe(0)
  })

  it('allows when under budget', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { changes: { costUSD: { new: 0.05 } } },
      { changes: { costUSD: { new: 0.10 } } },
    ] as never[])

    const result = await checkBudget('user_1', 50)
    expect(result.allowed).toBe(true)
    expect(result.usedUSD).toBeCloseTo(0.15)
  })

  it('blocks when over budget', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { changes: { costUSD: { new: 30.0 } } },
      { changes: { costUSD: { new: 25.0 } } },
    ] as never[])

    const result = await checkBudget('user_1', 50)
    expect(result.allowed).toBe(false)
    expect(result.usedUSD).toBeCloseTo(55.0)
  })

  it('handles malformed changes gracefully', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { changes: null },
      { changes: { costUSD: { new: 0.05 } } },
      { changes: { costUSD: null } },
    ] as never[])

    const result = await checkBudget('user_1', 50)
    expect(result.allowed).toBe(true)
    expect(result.usedUSD).toBeCloseTo(0.05)
  })

  it('queries by userId not fundId', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
    await checkBudget('user_42', 50)

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user_42',
        }),
      })
    )
  })
})
