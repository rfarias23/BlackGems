import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must mock every external dependency of the tested modules
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        fund: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
        fundMember: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
        capitalCall: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
        distribution: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
        commitment: { findFirst: vi.fn(), findMany: vi.fn() },
        investor: { findFirst: vi.fn() },
    },
}))

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}))

vi.mock('@/lib/shared/soft-delete', () => ({
    notDeleted: { deletedAt: null },
    softDelete: vi.fn(),
}))

vi.mock('@/lib/shared/fund-access', () => ({
    getActiveFundWithCurrency: vi.fn(),
    requireFundAccess: vi.fn(),
    requireModuleAccess: vi.fn(),
}))

vi.mock('@/lib/shared/audit', () => ({
    logAudit: vi.fn(),
    computeChanges: vi.fn(),
}))

vi.mock('@/lib/shared/active-fund', () => ({
    getActiveFundId: vi.fn(),
    setActiveFundId: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
    })),
    headers: vi.fn(() => new Map()),
}))

vi.mock('@/lib/shared/formatters', () => ({
    formatMoney: vi.fn((v: number) => `$${v}`),
    formatPercent: vi.fn((v: number) => `${v}%`),
    formatMultiple: vi.fn((v: number) => `${v}x`),
    parseMoney: vi.fn((v: string) => parseFloat(v)),
    parsePercent: vi.fn((v: string) => parseFloat(v)),
}))

vi.mock('@/lib/shared/pagination', () => ({
    parsePaginationParams: vi.fn(() => ({ page: 1, pageSize: 25, skip: 0, search: '' })),
    paginatedResult: vi.fn((data: unknown[], total: number, page: number, pageSize: number) => ({
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    })),
}))

vi.mock('@/lib/shared/workflow-transitions', () => ({
    VALID_CALL_TRANSITIONS: {},
    VALID_DIST_TRANSITIONS: {},
}))

vi.mock('@/lib/actions/notifications', () => ({
    notifyFundMembers: vi.fn(),
}))

vi.mock('@/lib/shared/irr', () => ({
    calculateFundIRR: vi.fn(),
    calculateCompanyIRR: vi.fn(),
    calculateLPIRR: vi.fn(),
}))

vi.mock('@/lib/shared/waterfall', () => ({
    calculateWaterfall: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Real imports (after mocks are declared)
// ---------------------------------------------------------------------------

import { getFundsForCommitment } from '../commitments'
import { getFundsForPortfolio } from '../portfolio'
import { getFundsForCapitalCall } from '../capital-calls'
import { getCapitalCalls, getCapitalCall } from '../capital-calls'
import { getFundsForDistribution } from '../distributions'
import { getDistributions, getDistribution } from '../distributions'
import { getFundsForReports } from '../reports'
import { getLPChartData } from '../chart-data'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency, requireFundAccess } from '@/lib/shared/fund-access'
import { getActiveFundId } from '@/lib/shared/active-fund'

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetActiveFundWithCurrency = getActiveFundWithCurrency as ReturnType<typeof vi.fn>
const mockRequireFundAccess = requireFundAccess as ReturnType<typeof vi.fn>
const mockGetActiveFundId = getActiveFundId as ReturnType<typeof vi.fn>

const mockPrisma = prisma as unknown as {
    user: { findUnique: ReturnType<typeof vi.fn> }
    fund: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> }
    fundMember: { findUnique: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
    capitalCall: { findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }
    distribution: { findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }
    commitment: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
    investor: { findFirst: ReturnType<typeof vi.fn> }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Fund Isolation Security — Cross-Fund Access Denial', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── Test 1: getFundsForCommitment returns only authorized funds ──

    it('getFundsForCommitment: regular user sees only funds with active membership', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'INVESTMENT_MANAGER',
            organizationId: 'org-1',
        })
        mockPrisma.fundMember.findMany.mockResolvedValue([
            { fund: { id: 'fund-1', name: 'Fund I', currency: 'USD' } },
        ])

        const funds = await getFundsForCommitment()

        expect(funds).toHaveLength(1)
        expect(funds[0].id).toBe('fund-1')
        // Fund-2 from another org is NOT returned
        expect(mockPrisma.fund.findMany).not.toHaveBeenCalled()
    })

    // ── Test 2: FUND_ADMIN sees only org-scoped funds ──

    it('getFundsForCapitalCall: FUND_ADMIN sees only their organization funds', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'admin-1' } })
        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'FUND_ADMIN',
            organizationId: 'org-1',
        })
        mockPrisma.fund.findMany.mockResolvedValue([
            { id: 'fund-1', name: 'Org1 Fund' },
        ])

        const funds = await getFundsForCapitalCall()

        // Verify the WHERE clause included organizationId
        expect(mockPrisma.fund.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    organizationId: 'org-1',
                }),
            })
        )
    })

    // ── Test 3: getCapitalCall rejects cross-fund access ──

    it('getCapitalCall: returns null when capital call belongs to another fund', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

        // Capital call belongs to fund-2 (different org)
        mockPrisma.capitalCall.findFirst.mockResolvedValue({
            id: 'cc-1',
            fundId: 'fund-2',
            fund: { name: 'Fund 2' },
            items: [],
            callNumber: 1,
            callDate: new Date(),
            dueDate: new Date(),
            totalAmount: 100000,
            status: 'DRAFT',
        })

        // requireFundAccess throws for cross-fund access
        mockRequireFundAccess.mockRejectedValue(new Error('Access denied'))

        const result = await getCapitalCall('cc-1')

        expect(result).toBeNull()
    })

    // ── Test 4: getDistribution rejects cross-fund access ──

    it('getDistribution: returns null when distribution belongs to another fund', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })

        // Distribution belongs to fund-2
        mockPrisma.distribution.findFirst.mockResolvedValue({
            id: 'dist-1',
            fundId: 'fund-2',
            fund: { name: 'Fund 2' },
            items: [],
            distributionNumber: 1,
            distributionDate: new Date(),
            totalAmount: 50000,
            type: 'RETURN_OF_CAPITAL',
            status: 'DRAFT',
        })

        // requireFundAccess throws for cross-fund access
        mockRequireFundAccess.mockRejectedValue(new Error('Access denied'))

        const result = await getDistribution('dist-1')

        expect(result).toBeNull()
    })

    // ── Test 5: getLPChartData rejects investor from another fund ──

    it('getLPChartData: returns null when investor has no commitment in active fund', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
        mockGetActiveFundWithCurrency.mockResolvedValue({
            fundId: 'fund-1',
            currency: 'USD',
        })

        // Investor has NO commitment in fund-1
        mockPrisma.commitment.findFirst.mockResolvedValue(null)

        const result = await getLPChartData('investor-from-other-fund')

        expect(result).toBeNull()
        // Verify it never fetched commitment data
        expect(mockPrisma.commitment.findMany).not.toHaveBeenCalled()
    })

    // ── Test 6: Unauthenticated user gets empty results ──

    it('getCapitalCalls: returns empty for unauthenticated user', async () => {
        mockAuth.mockResolvedValue(null)

        const result = await getCapitalCalls()

        expect(result.data).toHaveLength(0)
        expect(result.total).toBe(0)
    })

    // ── Test 7: User with no active fund gets empty results ──

    it('getDistributions: returns empty when user has no accessible fund', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-orphan' } })
        mockGetActiveFundWithCurrency.mockResolvedValue(null)

        const result = await getDistributions()

        expect(result.data).toHaveLength(0)
    })

    // ── Test 8: getFundsForReports returns empty for user with no memberships ──

    it('getFundsForReports: regular user with no memberships gets empty array', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-no-funds' } })
        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'ANALYST',
            organizationId: 'org-1',
        })
        mockPrisma.fundMember.findMany.mockResolvedValue([])

        const funds = await getFundsForReports()

        expect(funds).toHaveLength(0)
    })
})
