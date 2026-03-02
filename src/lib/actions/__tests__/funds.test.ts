import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    fund: { findMany: vi.fn() },
    fundMember: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/shared/fund-access', () => ({
  requireFundAccess: vi.fn(),
}))
vi.mock('@/lib/shared/active-fund', () => ({
  getActiveFundId: vi.fn(),
  setActiveFundId: vi.fn(),
}))
vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { getUserFunds } from '../funds'
import { prisma } from '@/lib/prisma'

const orgFunds = [
  { id: 'fund_1', name: 'Marita III', currency: 'USD', status: 'RAISING' },
]

const allFunds = [
  { id: 'fund_1', name: 'Marita III', currency: 'USD', status: 'RAISING' },
  { id: 'fund_2', name: 'KKR INCA 1', currency: 'USD', status: 'ACTIVE' },
  { id: 'fund_3', name: 'Latam IV', currency: 'USD', status: 'ACTIVE' },
]

describe('getUserFunds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('SUPER_ADMIN sees all funds globally', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'SUPER_ADMIN',
      organizationId: 'org_blackgem',
    } as never)
    vi.mocked(prisma.fund.findMany).mockResolvedValue(allFunds as never)

    const result = await getUserFunds('user_super')
    expect(result).toHaveLength(3)
    expect(prisma.fund.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, currency: true, status: true },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('FUND_ADMIN sees only funds in their organization', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'FUND_ADMIN',
      organizationId: 'org_marita',
    } as never)
    vi.mocked(prisma.fund.findMany).mockResolvedValue(orgFunds as never)

    const result = await getUserFunds('user_marita')
    expect(result).toHaveLength(1)
    expect(prisma.fund.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org_marita' },
      select: { id: true, name: true, currency: true, status: true },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('ANALYST sees only funds via FundMember records', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'ANALYST',
      organizationId: 'org_marita',
    } as never)
    vi.mocked(prisma.fundMember.findMany).mockResolvedValue([
      { fund: orgFunds[0] },
    ] as never)

    const result = await getUserFunds('user_analyst')
    expect(result).toHaveLength(1)
    expect(prisma.fundMember.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_analyst', isActive: true },
      select: { fund: { select: { id: true, name: true, currency: true, status: true } } },
      orderBy: { joinedAt: 'asc' },
    })
  })

  it('FUND_ADMIN with no organizationId gets no funds', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'FUND_ADMIN',
      organizationId: null,
    } as never)
    vi.mocked(prisma.fund.findMany).mockResolvedValue([] as never)

    const result = await getUserFunds('user_orphan')
    expect(result).toHaveLength(0)
  })
})
