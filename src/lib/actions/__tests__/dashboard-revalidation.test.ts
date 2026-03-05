import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all external dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    investor: { findFirst: vi.fn() },
    commitment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/shared/fund-access', () => ({
  requireFundAccess: vi.fn(),
}))
vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  computeChanges: vi.fn().mockReturnValue({}),
}))
vi.mock('@/lib/shared/soft-delete', () => ({
  notDeleted: { deletedAt: null },
  softDelete: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createCommitment, updateCommitment, deleteCommitment } from '../commitments'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const mockSession = { user: { id: 'user-1' } }

describe('Dashboard revalidation on commitment mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(mockSession as never)
  })

  it('createCommitment revalidates /dashboard', async () => {
    vi.mocked(prisma.investor.findFirst).mockResolvedValue({ id: 'inv-1' } as never)
    vi.mocked(prisma.commitment.findFirst).mockResolvedValue(null as never)
    vi.mocked(prisma.commitment.create).mockResolvedValue({
      id: 'commit-1',
      investorId: 'inv-1',
      fundId: 'fund-1',
    } as never)

    const formData = new FormData()
    formData.set('fundId', 'fund-1')
    formData.set('committedAmount', '1000000')
    formData.set('status', 'PENDING')
    formData.set('notes', '')

    const result = await createCommitment('inv-1', formData)

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/investors/inv-1')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('updateCommitment revalidates /dashboard', async () => {
    vi.mocked(prisma.commitment.findFirst).mockResolvedValue({
      id: 'commit-1',
      investorId: 'inv-1',
      fundId: 'fund-1',
      committedAmount: 1000000,
      calledAmount: 0,
      paidAmount: 0,
      status: 'PENDING',
      notes: null,
    } as never)
    vi.mocked(prisma.commitment.update).mockResolvedValue({} as never)

    const formData = new FormData()
    formData.set('committedAmount', '2000000')

    const result = await updateCommitment('commit-1', formData)

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/investors/inv-1')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('deleteCommitment revalidates /dashboard', async () => {
    vi.mocked(prisma.commitment.findFirst).mockResolvedValue({
      id: 'commit-1',
      investorId: 'inv-1',
      fundId: 'fund-1',
      committedAmount: 500000,
    } as never)

    const result = await deleteCommitment('commit-1')

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/investors/inv-1')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})
