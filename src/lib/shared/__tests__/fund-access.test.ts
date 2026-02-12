import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        fundMember: { findUnique: vi.fn() },
        fund: { findFirst: vi.fn() },
    },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}))

// Must import after mock setup
import { prisma } from '@/lib/prisma'
import { requireFundAccess, requireAuth } from '../fund-access'
import { auth } from '@/lib/auth'

const mockPrisma = prisma as unknown as {
    user: { findUnique: ReturnType<typeof vi.fn> }
    fundMember: { findUnique: ReturnType<typeof vi.fn> }
    fund: { findFirst: ReturnType<typeof vi.fn> }
}
const mockAuth = auth as ReturnType<typeof vi.fn>

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
