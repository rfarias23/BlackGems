import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must mock every external dependency of deals.ts so the module loads
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
    prisma: {
        fund: { findFirst: vi.fn() },
        deal: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
        fundMember: { findFirst: vi.fn() },
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
    requireFundAccess: vi.fn(),
    getActiveFundWithCurrency: vi.fn(),
}))

vi.mock('@/lib/shared/audit', () => ({
    logAudit: vi.fn(),
    computeChanges: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

vi.mock('@/lib/actions/notifications', () => ({
    notifyFundMembers: vi.fn(),
}))

vi.mock('@/lib/shared/stage-transitions', () => ({
    canTransitionDealStage: vi.fn(),
}))

vi.mock('@/lib/shared/pagination', () => ({
    parsePaginationParams: vi.fn().mockReturnValue({ page: 1, pageSize: 25, skip: 0, search: '' }),
    paginatedResult: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Real imports (after mocks are declared)
// ---------------------------------------------------------------------------

import { getDealPipelineAnalytics } from '../deals'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'

// Typed references to the mock functions for convenience
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetActiveFundWithCurrency = getActiveFundWithCurrency as ReturnType<typeof vi.fn>
const mockDealFindMany = prisma.deal.findMany as ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock deal object matching the select clause used by getDealPipelineAnalytics */
function makeDeal(overrides: {
    stage: string
    askingPrice?: number | null
    createdAt?: Date
    actualCloseDate?: Date | null
}) {
    return {
        id: crypto.randomUUID(),
        stage: overrides.stage,
        askingPrice: overrides.askingPrice ?? null,
        createdAt: overrides.createdAt ?? new Date('2025-01-01'),
        actualCloseDate: overrides.actualCloseDate ?? null,
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getDealPipelineAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ------------------------------------------------------------------
    // 1. Returns null when user is not authenticated
    // ------------------------------------------------------------------
    it('returns null when user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null)

        const result = await getDealPipelineAnalytics()

        expect(result).toBeNull()
        // Should not query prisma at all
        expect(mockGetActiveFundWithCurrency).not.toHaveBeenCalled()
        expect(mockDealFindMany).not.toHaveBeenCalled()
    })

    // ------------------------------------------------------------------
    // 2. Returns null when no fund exists
    // ------------------------------------------------------------------
    it('returns null when no fund exists', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
        mockGetActiveFundWithCurrency.mockRejectedValue(new Error('No fund found'))

        const result = await getDealPipelineAnalytics()

        expect(result).toBeNull()
        expect(mockDealFindMany).not.toHaveBeenCalled()
    })

    // ------------------------------------------------------------------
    // 3. Returns null when no deals exist
    // ------------------------------------------------------------------
    it('returns null when no deals exist', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
        mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: 'fund-1', currency: 'USD' })
        mockDealFindMany.mockResolvedValue([])

        const result = await getDealPipelineAnalytics()

        expect(result).toBeNull()
    })

    // ------------------------------------------------------------------
    // 4. Aggregates deals by display stage correctly
    //    INITIAL_REVIEW + PRELIMINARY_ANALYSIS both map to 'Initial Review'
    //    DUE_DILIGENCE maps to 'Due Diligence'
    // ------------------------------------------------------------------
    it('aggregates deals by display stage correctly', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
        mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: 'fund-1', currency: 'USD' })

        const deals = [
            makeDeal({ stage: 'INITIAL_REVIEW', askingPrice: 500000 }),
            makeDeal({ stage: 'PRELIMINARY_ANALYSIS', askingPrice: 700000 }),
            makeDeal({ stage: 'DUE_DILIGENCE', askingPrice: 1000000 }),
        ]
        mockDealFindMany.mockResolvedValue(deals)

        const result = await getDealPipelineAnalytics()

        expect(result).not.toBeNull()

        // Find stage buckets
        const initialReview = result!.stages.find((s) => s.stage === 'Initial Review')
        const dueDiligence = result!.stages.find((s) => s.stage === 'Due Diligence')

        expect(initialReview).toBeDefined()
        expect(initialReview!.count).toBe(2)
        expect(initialReview!.totalValue).toBe(1200000) // 500k + 700k

        expect(dueDiligence).toBeDefined()
        expect(dueDiligence!.count).toBe(1)
        expect(dueDiligence!.totalValue).toBe(1000000)

        // All three are active pipeline stages
        expect(result!.totalActiveDeals).toBe(3)
    })

    // ------------------------------------------------------------------
    // 5. Computes win rate from terminal stages
    //    1 CLOSED_WON + 2 terminal losses (CLOSED_LOST + PASSED) + 1 active
    //    winRate = 1 / (1+2) = 33.3%
    // ------------------------------------------------------------------
    it('computes win rate from terminal stages', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
        mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: 'fund-1', currency: 'USD' })

        const deals = [
            makeDeal({ stage: 'CLOSED_WON', askingPrice: 2000000, actualCloseDate: new Date('2025-06-01') }),
            makeDeal({ stage: 'CLOSED_LOST', askingPrice: 500000, actualCloseDate: new Date('2025-05-01') }),
            makeDeal({ stage: 'PASSED', askingPrice: 300000, actualCloseDate: new Date('2025-04-01') }),
            makeDeal({ stage: 'IDENTIFIED', askingPrice: 1000000 }),
        ]
        mockDealFindMany.mockResolvedValue(deals)

        const result = await getDealPipelineAnalytics()

        expect(result).not.toBeNull()
        expect(result!.closedWon).toBe(1)
        expect(result!.closedLost).toBe(2)
        expect(result!.winRate).toBe('33.3%')

        // Only IDENTIFIED is an active pipeline stage
        expect(result!.totalActiveDeals).toBe(1)

        // conversionRate = closedWon / totalDeals = 1/4 = 25.0%
        expect(result!.conversionRate).toBe('25.0%')
    })

    // ------------------------------------------------------------------
    // 6. Returns totalValue as raw number (not formatted)
    // ------------------------------------------------------------------
    it('returns totalValue as raw number in stage metrics', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
        mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: 'fund-1', currency: 'USD' })

        const deals = [
            makeDeal({ stage: 'IDENTIFIED', askingPrice: 1500000 }),
            makeDeal({ stage: 'IDENTIFIED', askingPrice: 2500000 }),
        ]
        mockDealFindMany.mockResolvedValue(deals)

        const result = await getDealPipelineAnalytics()

        expect(result).not.toBeNull()

        const identified = result!.stages.find((s) => s.stage === 'Identified')
        expect(identified).toBeDefined()

        // totalValue must be a raw number, not a formatted string
        expect(typeof identified!.totalValue).toBe('number')
        expect(identified!.totalValue).toBe(4000000)

        // totalPipelineValue on the top-level result IS formatted
        expect(result!.totalPipelineValue).toBe('$4,000,000')
    })
})
