import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — mock at module boundaries to avoid deep Prisma call chain issues
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    fundMember: { create: vi.fn() },
    investor: { findFirst: vi.fn(), update: vi.fn() },
    commitment: { findFirst: vi.fn() },
    verificationToken: { findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/shared/fund-access', () => ({
  getActiveFundWithCurrency: vi.fn(),
  requireFundAccess: vi.fn(),
}))

vi.mock('@/lib/shared/permissions', () => ({
  canBecomeFundMember: vi.fn(),
  ALLOWED_FUND_ROLES: {
    SUPER_ADMIN: ['PRINCIPAL'],
    FUND_ADMIN: ['PRINCIPAL'],
    INVESTMENT_MANAGER: ['CO_PRINCIPAL'],
    ANALYST: ['ANALYST'],
    AUDITOR: [],
    LP_PRIMARY: [],
    LP_VIEWER: [],
  },
  DEFAULT_PERMISSIONS: {
    PRINCIPAL: ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'],
    CO_PRINCIPAL: ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS'],
    ANALYST: ['DEALS', 'PORTFOLIO', 'REPORTS'],
  },
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

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('$2a$10$hashed') },
}))

vi.mock('@/lib/email', () => ({
  sendInviteEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency, requireFundAccess } from '@/lib/shared/fund-access'
import { canBecomeFundMember } from '@/lib/shared/permissions'
import { createUser, acceptInvitation } from '../users'

const mockPrisma = prisma as any
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetActiveFundWithCurrency = getActiveFundWithCurrency as ReturnType<typeof vi.fn>
const mockRequireFundAccess = requireFundAccess as ReturnType<typeof vi.fn>
const mockCanBecomeFundMember = canBecomeFundMember as ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// createUser — fund linkage
// ---------------------------------------------------------------------------

describe('createUser — org + fund linkage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates user with organizationId and FundMember in a transaction', async () => {
    // Auth: caller is FUND_ADMIN
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'FUND_ADMIN' },
    })

    // user.findUnique calls:
    // 1. email uniqueness → null (no duplicate)
    // 2. caller org lookup → has org
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // email check
      .mockResolvedValueOnce({ organizationId: 'org-1' }) // caller org

    // INVESTMENT_MANAGER can become a fund member
    mockCanBecomeFundMember.mockReturnValue(true)

    // Fund resolution (mocked at module boundary)
    mockGetActiveFundWithCurrency.mockResolvedValue({
      fundId: 'fund-1',
      currency: 'USD',
    })
    mockRequireFundAccess.mockResolvedValue(undefined)

    // Transaction captures create calls
    const createdRecords: { user?: any; fundMember?: any } = {}
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        user: {
          create: vi.fn().mockImplementation((args: any) => {
            createdRecords.user = args.data
            return { id: 'new-user-1' }
          }),
        },
        fundMember: {
          create: vi.fn().mockImplementation((args: any) => {
            createdRecords.fundMember = args.data
            return { id: 'fm-1' }
          }),
        },
        investor: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      })
    })

    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'test@example.com')
    formData.set('role', 'Investment Manager')
    formData.set('password', 'securepassword123')

    try {
      await createUser(formData)
    } catch (e: any) {
      if (e.message !== 'NEXT_REDIRECT') throw e
    }

    // Verify $transaction was used (atomic operation)
    expect(mockPrisma.$transaction).toHaveBeenCalled()

    // Verify user created with organizationId
    expect(createdRecords.user).toBeDefined()
    expect(createdRecords.user.organizationId).toBe('org-1')
    expect(createdRecords.user.role).toBe('INVESTMENT_MANAGER')

    // Verify FundMember created
    expect(createdRecords.fundMember).toBeDefined()
    expect(createdRecords.fundMember.fundId).toBe('fund-1')
    expect(createdRecords.fundMember.isActive).toBe(true)
  })

  it('returns error when caller has no organizationId', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'FUND_ADMIN' },
    })

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // email check → no duplicate
      .mockResolvedValueOnce({ organizationId: null }) // caller has no org

    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'test@example.com')
    formData.set('role', 'Investment Manager')
    formData.set('password', 'securepassword123')

    const result = await createUser(formData)

    expect(result).toEqual({ error: expect.stringContaining('no organization') })
  })

  it('rejects duplicate email', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'FUND_ADMIN' },
    })

    // Email check returns existing user
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: 'taken@example.com',
    })

    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'taken@example.com')
    formData.set('role', 'Analyst')
    formData.set('password', 'securepassword123')

    const result = await createUser(formData)

    expect(result).toEqual({ error: expect.stringContaining('already exists') })
  })

  it('returns error when no active fund and role requires membership', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'FUND_ADMIN' },
    })

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // email check
      .mockResolvedValueOnce({ organizationId: 'org-1' }) // caller org

    mockCanBecomeFundMember.mockReturnValue(true)

    // No active fund
    mockGetActiveFundWithCurrency.mockResolvedValue(null)

    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'test@example.com')
    formData.set('role', 'Investment Manager')
    formData.set('password', 'securepassword123')

    const result = await createUser(formData)

    expect(result).toEqual({ error: expect.stringContaining('no active fund') })
  })

  it('returns error when caller lacks access to active fund', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'FUND_ADMIN' },
    })

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // email check
      .mockResolvedValueOnce({ organizationId: 'org-1' }) // caller org

    mockCanBecomeFundMember.mockReturnValue(true)

    mockGetActiveFundWithCurrency.mockResolvedValue({
      fundId: 'fund-1',
      currency: 'USD',
    })

    // Security guard rejects — caller doesn't have access to this fund
    mockRequireFundAccess.mockRejectedValue(new Error('Access denied'))

    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'test@example.com')
    formData.set('role', 'Investment Manager')
    formData.set('password', 'securepassword123')

    const result = await createUser(formData)

    expect(result).toEqual({ error: expect.stringContaining('no access to active fund') })
    // Verify requireFundAccess was called with correct args
    expect(mockRequireFundAccess).toHaveBeenCalledWith('admin-1', 'fund-1')
  })
})

// ---------------------------------------------------------------------------
// acceptInvitation — org linkage
// ---------------------------------------------------------------------------

describe('acceptInvitation — org linkage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets organizationId from investor commitment chain', async () => {
    // Valid token
    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      token: 'valid-token',
      identifier: 'invite:lp@example.com:investor-1:LP_PRIMARY',
      expires: new Date(Date.now() + 86400000),
    })

    // No existing user with this email
    mockPrisma.user.findUnique.mockResolvedValue(null)

    // Commitment → fund → org chain
    mockPrisma.commitment.findFirst.mockResolvedValue({
      fund: { organizationId: 'org-1' },
    })

    let createdUserData: any
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        user: {
          create: vi.fn().mockImplementation((args: any) => {
            createdUserData = args.data
            return { id: 'new-lp-1' }
          }),
        },
        investor: { update: vi.fn() },
        verificationToken: { delete: vi.fn() },
      })
    })

    const result = await acceptInvitation('valid-token', 'LP User', 'securepassword123')

    expect(result).toEqual({ success: true, userId: 'new-lp-1' })
    expect(createdUserData.organizationId).toBe('org-1')
    expect(createdUserData.emailVerified).toBeInstanceOf(Date)
  })

  it('rejects expired invitation token', async () => {
    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      token: 'expired-token',
      identifier: 'invite:lp@example.com:investor-1:LP_PRIMARY',
      expires: new Date(Date.now() - 86400000),
    })

    const result = await acceptInvitation('expired-token', 'LP User', 'securepassword123')

    expect(result).toEqual({ error: expect.stringContaining('expired') })
  })

  it('rejects invalid token', async () => {
    mockPrisma.verificationToken.findUnique.mockResolvedValue(null)

    const result = await acceptInvitation('bad-token', 'LP User', 'securepassword123')

    expect(result).toEqual({ error: expect.stringContaining('Invalid') })
  })

  it('rejects if email already registered', async () => {
    mockPrisma.verificationToken.findUnique.mockResolvedValue({
      token: 'valid-token',
      identifier: 'invite:existing@example.com:investor-1:LP_PRIMARY',
      expires: new Date(Date.now() + 86400000),
    })

    // Email already taken
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' })

    const result = await acceptInvitation('valid-token', 'LP User', 'securepassword123')

    expect(result).toEqual({ error: expect.stringContaining('already exists') })
  })
})
