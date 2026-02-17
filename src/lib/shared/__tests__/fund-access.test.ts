import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    fundMember: { findUnique: vi.fn(), findFirst: vi.fn() },
    fund: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock active-fund
vi.mock('@/lib/shared/active-fund', () => ({
  getActiveFundId: vi.fn(),
  setActiveFundId: vi.fn(),
}))

// Must import after mock setup
import { prisma } from '@/lib/prisma'
import { requireFundAccess, requireAuth, getAuthorizedFundId, getActiveFundWithCurrency } from '../fund-access'
import { auth } from '@/lib/auth'
import { getActiveFundId, setActiveFundId } from '@/lib/shared/active-fund'

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> }
  fundMember: { findUnique: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> }
  fund: { findFirst: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
}
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetActiveFundId = getActiveFundId as ReturnType<typeof vi.fn>
const mockSetActiveFundId = setActiveFundId as ReturnType<typeof vi.fn>

describe('requireFundAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('grants access to SUPER_ADMIN role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })

    const result = await requireFundAccess('user-1', 'fund-1')
    expect(result).toBe(true)
    expect(mockPrisma.fundMember.findUnique).not.toHaveBeenCalled()
  })

  it('grants access to FUND_ADMIN role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'FUND_ADMIN' })

    const result = await requireFundAccess('user-2', 'fund-1')
    expect(result).toBe(true)
    expect(mockPrisma.fundMember.findUnique).not.toHaveBeenCalled()
  })

  it('grants access when user has active FundMember record', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'LP' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({ isActive: true })

    const result = await requireFundAccess('user-3', 'fund-1')
    expect(result).toBe(true)
  })

  it('throws when user has no FundMember record', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'LP' })
    mockPrisma.fundMember.findUnique.mockResolvedValue(null)

    await expect(requireFundAccess('user-4', 'fund-1'))
      .rejects.toThrow('Access denied')
  })

  it('throws when user has inactive FundMember record', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'LP' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({ isActive: false })

    await expect(requireFundAccess('user-5', 'fund-1'))
      .rejects.toThrow('Access denied')
  })

  it('throws when user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.fundMember.findUnique.mockResolvedValue(null)

    await expect(requireFundAccess('nonexistent', 'fund-1'))
      .rejects.toThrow('Access denied')
  })
})

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns session when user is authenticated', async () => {
    const mockSession = { user: { id: 'user-1', email: 'test@test.com' } }
    mockAuth.mockResolvedValue(mockSession)

    const result = await requireAuth()
    expect(result).toEqual(mockSession)
  })

  it('throws when session has no user', async () => {
    mockAuth.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  it('throws when session user has no id', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } })

    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })
})

describe('getAuthorizedFundId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fund from cookie when admin has access', async () => {
    mockGetActiveFundId.mockResolvedValue('fund-cookie')
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })
    mockPrisma.fund.findUnique.mockResolvedValue({ id: 'fund-cookie' })

    const result = await getAuthorizedFundId('admin-1')
    expect(result).toBe('fund-cookie')
    expect(mockSetActiveFundId).not.toHaveBeenCalled()
  })

  it('returns fund from cookie when member has access', async () => {
    mockGetActiveFundId.mockResolvedValue('fund-cookie')
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'LP' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({ isActive: true })

    const result = await getAuthorizedFundId('user-1')
    expect(result).toBe('fund-cookie')
    expect(mockSetActiveFundId).not.toHaveBeenCalled()
  })

  it('falls back to first membership when cookie fund is invalid', async () => {
    mockGetActiveFundId.mockResolvedValue('deleted-fund')
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'LP' })
    mockPrisma.fundMember.findUnique.mockResolvedValue(null) // cookie fund access check fails
    mockPrisma.fundMember.findFirst.mockResolvedValue({ fundId: 'fund-fallback' })

    const result = await getAuthorizedFundId('user-1')
    expect(result).toBe('fund-fallback')
    expect(mockSetActiveFundId).toHaveBeenCalledWith('fund-fallback')
  })

  it('falls back to first fund for admin with no memberships', async () => {
    mockGetActiveFundId.mockResolvedValue(null)
    // isAdminRole is called multiple times in the flow
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })
    mockPrisma.fundMember.findFirst.mockResolvedValue(null) // no memberships
    mockPrisma.fund.findFirst.mockResolvedValue({ id: 'fund-first' })

    const result = await getAuthorizedFundId('admin-1')
    expect(result).toBe('fund-first')
    expect(mockSetActiveFundId).toHaveBeenCalledWith('fund-first')
  })

  it('returns null when no cookie, no memberships, and not admin', async () => {
    mockGetActiveFundId.mockResolvedValue(null)
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'LP' })
    mockPrisma.fundMember.findFirst.mockResolvedValue(null)

    const result = await getAuthorizedFundId('user-1')
    expect(result).toBeNull()
  })

  it('returns null when no funds exist at all', async () => {
    mockGetActiveFundId.mockResolvedValue(null)
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })
    mockPrisma.fundMember.findFirst.mockResolvedValue(null)
    mockPrisma.fund.findFirst.mockResolvedValue(null)

    const result = await getAuthorizedFundId('admin-1')
    expect(result).toBeNull()
  })
})

describe('getActiveFundWithCurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fundId and currency', async () => {
    // Setup getAuthorizedFundId to return via cookie path
    mockGetActiveFundId.mockResolvedValue('fund-1')
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })
    mockPrisma.fund.findUnique
      .mockResolvedValueOnce({ id: 'fund-1' }) // cookie validation
      .mockResolvedValueOnce({ currency: 'EUR' }) // currency lookup

    const result = await getActiveFundWithCurrency('admin-1')
    expect(result).toEqual({ fundId: 'fund-1', currency: 'EUR' })
  })

  it('defaults to USD when fund has no currency', async () => {
    mockGetActiveFundId.mockResolvedValue('fund-1')
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })
    mockPrisma.fund.findUnique
      .mockResolvedValueOnce({ id: 'fund-1' })
      .mockResolvedValueOnce({ currency: null })

    const result = await getActiveFundWithCurrency('admin-1')
    expect(result).toEqual({ fundId: 'fund-1', currency: 'USD' })
  })
})
