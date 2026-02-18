import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must mock every external dependency of investors.ts
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
    prisma: {
        investor: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        commitment: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(),
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
    requireModuleAccess: vi.fn(),
}))

vi.mock('@/lib/shared/audit', () => ({
    logAudit: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Real imports (after mocks are declared)
// ---------------------------------------------------------------------------

import {
    getInvestors,
    getInvestor,
    createInvestor,
    updateInvestor,
    deleteInvestor,
    getInvestorsForExport,
} from '../investors'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency, requireModuleAccess } from '@/lib/shared/fund-access'
import { softDelete } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetActiveFundWithCurrency = getActiveFundWithCurrency as ReturnType<typeof vi.fn>
const mockRequireModuleAccess = requireModuleAccess as ReturnType<typeof vi.fn>
const mockSoftDelete = softDelete as ReturnType<typeof vi.fn>
const mockLogAudit = logAudit as ReturnType<typeof vi.fn>

const mockPrisma = prisma as unknown as {
    investor: {
        findMany: ReturnType<typeof vi.fn>
        findFirst: ReturnType<typeof vi.fn>
        create: ReturnType<typeof vi.fn>
        update: ReturnType<typeof vi.fn>
        count: ReturnType<typeof vi.fn>
    }
    commitment: {
        findFirst: ReturnType<typeof vi.fn>
        create: ReturnType<typeof vi.fn>
    }
    $transaction: ReturnType<typeof vi.fn>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FUND_A = 'fund-a'
const FUND_B = 'fund-b'
const USER_ID = 'user-1'

const mockSession = { user: { id: USER_ID, email: 'test@test.com' } }

function makeInvestor(overrides: {
    id?: string
    name?: string
    type?: string
    status?: string
    commitments?: Array<{
        fundId: string
        committedAmount?: number
        calledAmount?: number
        paidAmount?: number
        fund?: { name: string }
    }>
}) {
    const id = overrides.id ?? 'inv-1'
    return {
        id,
        name: overrides.name ?? 'Test Investor',
        type: overrides.type ?? 'INDIVIDUAL',
        status: overrides.status ?? 'ACTIVE',
        email: 'investor@test.com',
        contactName: 'Jane Doe',
        legalName: null,
        taxId: null,
        jurisdiction: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        country: 'USA',
        postalCode: null,
        contactEmail: null,
        contactPhone: null,
        contactTitle: null,
        accreditedStatus: null,
        kycStatus: 'NOT_STARTED',
        kycCompletedAt: null,
        amlStatus: 'NOT_STARTED',
        amlCompletedAt: null,
        investmentCapacity: null,
        notes: null,
        source: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
        commitments: overrides.commitments ?? [
            {
                fundId: FUND_A,
                committedAmount: 100000,
                calledAmount: 50000,
                paidAmount: 50000,
                fund: { name: 'Fund Alpha' },
            },
        ],
    }
}

function makeFormData(data: Record<string, string>): FormData {
    const fd = new FormData()
    for (const [key, value] of Object.entries(data)) {
        fd.set(key, value)
    }
    return fd
}

function setupAuthenticatedUser() {
    mockAuth.mockResolvedValue(mockSession)
    mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: FUND_A, currency: 'USD' })
    mockRequireModuleAccess.mockResolvedValue(undefined)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Investor Fund Isolation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ======================================================================
    // getInvestors — only returns investors with commitments in active fund
    // ======================================================================
    describe('getInvestors', () => {
        it('returns only investors with commitments in the active fund', async () => {
            setupAuthenticatedUser()

            const investorInFundA = makeInvestor({
                id: 'inv-1',
                name: 'Fund A Investor',
                commitments: [{ fundId: FUND_A, committedAmount: 100000 }],
            })

            mockPrisma.investor.findMany.mockResolvedValue([investorInFundA])
            mockPrisma.investor.count.mockResolvedValue(1)

            const result = await getInvestors()

            expect(result.data).toHaveLength(1)
            expect(result.data[0].name).toBe('Fund A Investor')

            // Verify the where clause includes the fund-scoped commitment filter
            const findManyCall = mockPrisma.investor.findMany.mock.calls[0][0]
            expect(findManyCall.where.commitments).toEqual({
                some: { fundId: FUND_A, deletedAt: null },
            })
        })

        it('returns empty when user has no auth session', async () => {
            mockAuth.mockResolvedValue(null)

            const result = await getInvestors()

            expect(result.data).toHaveLength(0)
            expect(result.total).toBe(0)
            expect(mockPrisma.investor.findMany).not.toHaveBeenCalled()
        })

        it('returns empty when no active fund', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue(null)

            const result = await getInvestors()

            expect(result.data).toHaveLength(0)
            expect(mockPrisma.investor.findMany).not.toHaveBeenCalled()
        })

        it('filters commitments by active fund when summing totals', async () => {
            setupAuthenticatedUser()

            const investor = makeInvestor({
                id: 'inv-multi',
                name: 'Multi-Fund Investor',
                commitments: [
                    { fundId: FUND_A, committedAmount: 200000 },
                ],
            })

            mockPrisma.investor.findMany.mockResolvedValue([investor])
            mockPrisma.investor.count.mockResolvedValue(1)

            const result = await getInvestors()

            expect(result.data).toHaveLength(1)
            expect(result.data[0].totalCommitted).toBe('$200,000')

            // The include clause should also filter commitments by fundId
            const findManyCall = mockPrisma.investor.findMany.mock.calls[0][0]
            expect(findManyCall.include.commitments.where.fundId).toBe(FUND_A)
        })
    })

    // ======================================================================
    // getInvestor — returns null for investor without commitment in fund
    // ======================================================================
    describe('getInvestor', () => {
        it('returns investor detail when commitment exists in active fund', async () => {
            setupAuthenticatedUser()

            const investor = makeInvestor({
                id: 'inv-1',
                commitments: [
                    {
                        fundId: FUND_A,
                        committedAmount: 100000,
                        calledAmount: 50000,
                        paidAmount: 50000,
                        fund: { name: 'Fund Alpha' },
                    },
                ],
            })

            mockPrisma.investor.findFirst.mockResolvedValue(investor)

            const result = await getInvestor('inv-1')

            expect(result).not.toBeNull()
            expect(result!.id).toBe('inv-1')
            expect(result!.commitments).toHaveLength(1)
        })

        it('returns null when investor has no commitment in active fund', async () => {
            setupAuthenticatedUser()

            const investorInOtherFund = makeInvestor({
                id: 'inv-other',
                commitments: [
                    {
                        fundId: FUND_B,
                        committedAmount: 100000,
                        calledAmount: 0,
                        paidAmount: 0,
                        fund: { name: 'Fund Beta' },
                    },
                ],
            })

            mockPrisma.investor.findFirst.mockResolvedValue(investorInOtherFund)

            const result = await getInvestor('inv-other')

            expect(result).toBeNull()
        })

        it('returns null when investor does not exist', async () => {
            setupAuthenticatedUser()
            mockPrisma.investor.findFirst.mockResolvedValue(null)

            const result = await getInvestor('nonexistent')

            expect(result).toBeNull()
        })

        it('returns null when user has no auth session', async () => {
            mockAuth.mockResolvedValue(null)

            const result = await getInvestor('inv-1')

            expect(result).toBeNull()
            expect(mockPrisma.investor.findFirst).not.toHaveBeenCalled()
        })
    })

    // ======================================================================
    // createInvestor — auto-creates PENDING commitment in active fund
    // ======================================================================
    describe('createInvestor', () => {
        it('creates investor with a PENDING commitment in active fund', async () => {
            setupAuthenticatedUser()

            const createdInvestor = { id: 'inv-new', name: 'New Investor' }

            mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                const tx = {
                    investor: {
                        create: vi.fn().mockResolvedValue(createdInvestor),
                    },
                    commitment: {
                        create: vi.fn().mockResolvedValue({ id: 'commit-1' }),
                    },
                }
                return fn(tx)
            })

            const formData = makeFormData({
                name: 'New Investor',
                type: 'Individual',
            })

            await createInvestor(formData)

            // Verify transaction was called
            expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)

            // Extract the transaction callback and verify it creates both investor and commitment
            const txCallback = mockPrisma.$transaction.mock.calls[0][0]
            const mockTx = {
                investor: { create: vi.fn().mockResolvedValue(createdInvestor) },
                commitment: { create: vi.fn().mockResolvedValue({ id: 'commit-2' }) },
            }
            await txCallback(mockTx)

            // Investor creation
            expect(mockTx.investor.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'New Investor',
                    type: 'INDIVIDUAL',
                }),
            })

            // Commitment auto-creation with PENDING status
            expect(mockTx.commitment.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    investorId: createdInvestor.id,
                    fundId: FUND_A,
                    committedAmount: 0,
                    calledAmount: 0,
                    paidAmount: 0,
                    distributedAmount: 0,
                    status: 'PENDING',
                }),
            })
        })

        it('returns error when user is not authenticated', async () => {
            mockAuth.mockResolvedValue(null)

            const formData = makeFormData({ name: 'Test', type: 'Individual' })
            const result = await createInvestor(formData)

            expect(result).toEqual({ error: 'Unauthorized' })
        })

        it('returns error when no active fund', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue(null)

            const formData = makeFormData({ name: 'Test', type: 'Individual' })
            const result = await createInvestor(formData)

            expect(result).toEqual({ error: 'No active fund' })
        })

        it('returns validation error for invalid input', async () => {
            setupAuthenticatedUser()

            const formData = makeFormData({ name: 'A', type: 'Individual' }) // name too short
            const result = await createInvestor(formData)

            expect(result).toEqual({ error: 'Name must be at least 2 characters' })
        })

        it('logs audit after creation', async () => {
            setupAuthenticatedUser()

            const createdInvestor = { id: 'inv-audit', name: 'Audit Investor' }
            mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
                const tx = {
                    investor: { create: vi.fn().mockResolvedValue(createdInvestor) },
                    commitment: { create: vi.fn().mockResolvedValue({ id: 'c-1' }) },
                }
                return fn(tx)
            })

            const formData = makeFormData({ name: 'Audit Investor', type: 'Individual' })
            await createInvestor(formData)

            expect(mockLogAudit).toHaveBeenCalledWith({
                userId: USER_ID,
                action: 'CREATE',
                entityType: 'Investor',
                entityId: 'inv-audit',
                changes: { fundId: { old: null, new: FUND_A } },
            })
        })
    })

    // ======================================================================
    // updateInvestor — rejects if investor has no commitment in active fund
    // ======================================================================
    describe('updateInvestor', () => {
        it('updates investor when commitment exists in active fund', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue({ id: 'commit-1' })
            mockPrisma.investor.update.mockResolvedValue({ id: 'inv-1' })

            const formData = makeFormData({ name: 'Updated Name' })
            const result = await updateInvestor('inv-1', formData)

            expect(result).toEqual({ success: true })
            expect(mockPrisma.investor.update).toHaveBeenCalledWith({
                where: { id: 'inv-1' },
                data: expect.objectContaining({ name: 'Updated Name' }),
            })
        })

        it('rejects update when investor has no commitment in active fund', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue(null)

            const formData = makeFormData({ name: 'Updated Name' })
            const result = await updateInvestor('inv-other', formData)

            expect(result).toEqual({ error: 'Investor not found in this fund' })
            expect(mockPrisma.investor.update).not.toHaveBeenCalled()
        })

        it('verifies commitment lookup uses active fund and soft-delete filter', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue(null)

            const formData = makeFormData({ name: 'Test' })
            await updateInvestor('inv-1', formData)

            expect(mockPrisma.commitment.findFirst).toHaveBeenCalledWith({
                where: {
                    investorId: 'inv-1',
                    fundId: FUND_A,
                    deletedAt: null,
                },
            })
        })

        it('returns error when user is not authenticated', async () => {
            mockAuth.mockResolvedValue(null)

            const formData = makeFormData({ name: 'Test' })
            const result = await updateInvestor('inv-1', formData)

            expect(result).toEqual({ error: 'Unauthorized' })
        })

        it('logs audit after successful update', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue({ id: 'commit-1' })
            mockPrisma.investor.update.mockResolvedValue({ id: 'inv-1' })

            const formData = makeFormData({ name: 'New Name' })
            await updateInvestor('inv-1', formData)

            expect(mockLogAudit).toHaveBeenCalledWith({
                userId: USER_ID,
                action: 'UPDATE',
                entityType: 'Investor',
                entityId: 'inv-1',
                changes: expect.objectContaining({ name: 'New Name' }),
            })
        })
    })

    // ======================================================================
    // deleteInvestor — rejects if investor has no commitment in active fund
    // ======================================================================
    describe('deleteInvestor', () => {
        it('soft-deletes investor when commitment exists in active fund', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue({ id: 'commit-1' })
            mockPrisma.investor.findFirst.mockResolvedValue({ id: 'inv-1', name: 'To Delete' })
            mockSoftDelete.mockResolvedValue(undefined)

            await deleteInvestor('inv-1')

            expect(mockSoftDelete).toHaveBeenCalledWith('investor', 'inv-1')
        })

        it('rejects deletion when investor has no commitment in active fund', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue(null)

            const result = await deleteInvestor('inv-other')

            expect(result).toEqual({ error: 'Investor not found in this fund' })
            expect(mockSoftDelete).not.toHaveBeenCalled()
        })

        it('rejects deletion when investor does not exist', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue({ id: 'commit-1' })
            mockPrisma.investor.findFirst.mockResolvedValue(null)

            const result = await deleteInvestor('nonexistent')

            expect(result).toEqual({ error: 'Investor not found' })
            expect(mockSoftDelete).not.toHaveBeenCalled()
        })

        it('returns error when user is not authenticated', async () => {
            mockAuth.mockResolvedValue(null)

            const result = await deleteInvestor('inv-1')

            expect(result).toEqual({ error: 'Unauthorized' })
        })

        it('logs audit after successful deletion', async () => {
            setupAuthenticatedUser()
            mockPrisma.commitment.findFirst.mockResolvedValue({ id: 'commit-1' })
            mockPrisma.investor.findFirst.mockResolvedValue({ id: 'inv-1' })
            mockSoftDelete.mockResolvedValue(undefined)

            await deleteInvestor('inv-1')

            expect(mockLogAudit).toHaveBeenCalledWith({
                userId: USER_ID,
                action: 'DELETE',
                entityType: 'Investor',
                entityId: 'inv-1',
            })
        })
    })

    // ======================================================================
    // getInvestorsForExport — only exports investors in active fund
    // ======================================================================
    describe('getInvestorsForExport', () => {
        it('only exports investors with commitments in the active fund', async () => {
            setupAuthenticatedUser()

            const investors = [
                makeInvestor({
                    id: 'inv-export-1',
                    name: 'Export Investor 1',
                    commitments: [{ fundId: FUND_A, committedAmount: 500000, calledAmount: 200000, paidAmount: 200000 }],
                }),
                makeInvestor({
                    id: 'inv-export-2',
                    name: 'Export Investor 2',
                    commitments: [{ fundId: FUND_A, committedAmount: 300000, calledAmount: 100000, paidAmount: 100000 }],
                }),
            ]

            mockPrisma.investor.findMany.mockResolvedValue(investors)

            const result = await getInvestorsForExport()

            expect(result).toHaveLength(2)
            expect(result[0].name).toBe('Export Investor 1')
            expect(result[0].totalCommitted).toBe('$500,000')
            expect(result[1].name).toBe('Export Investor 2')
            expect(result[1].totalCommitted).toBe('$300,000')
        })

        it('scopes query by active fund via commitment bridge table', async () => {
            setupAuthenticatedUser()
            mockPrisma.investor.findMany.mockResolvedValue([])

            await getInvestorsForExport()

            const findManyCall = mockPrisma.investor.findMany.mock.calls[0][0]
            expect(findManyCall.where.commitments).toEqual({
                some: { fundId: FUND_A, deletedAt: null },
            })
            expect(findManyCall.include.commitments.where.fundId).toBe(FUND_A)
        })

        it('returns empty when user has no auth session', async () => {
            mockAuth.mockResolvedValue(null)

            const result = await getInvestorsForExport()

            expect(result).toHaveLength(0)
            expect(mockPrisma.investor.findMany).not.toHaveBeenCalled()
        })

        it('returns empty when no active fund', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue(null)

            const result = await getInvestorsForExport()

            expect(result).toHaveLength(0)
            expect(mockPrisma.investor.findMany).not.toHaveBeenCalled()
        })
    })

    // ======================================================================
    // Permission checks — requireModuleAccess blocks without INVESTORS
    // ======================================================================
    describe('Permission enforcement', () => {
        it('getInvestors returns empty when user lacks INVESTORS permission', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: FUND_A, currency: 'USD' })
            mockRequireModuleAccess.mockRejectedValue(new Error('Access denied: no INVESTORS permission'))

            const result = await getInvestors()

            expect(result.data).toHaveLength(0)
            expect(mockPrisma.investor.findMany).not.toHaveBeenCalled()
        })

        it('getInvestor returns null when user lacks INVESTORS permission', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: FUND_A, currency: 'USD' })
            mockRequireModuleAccess.mockRejectedValue(new Error('Access denied: no INVESTORS permission'))

            const result = await getInvestor('inv-1')

            expect(result).toBeNull()
            expect(mockPrisma.investor.findFirst).not.toHaveBeenCalled()
        })

        it('createInvestor returns error when user lacks INVESTORS permission', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: FUND_A, currency: 'USD' })
            mockRequireModuleAccess.mockRejectedValue(new Error('Access denied: no INVESTORS permission'))

            const formData = makeFormData({ name: 'Test Investor', type: 'Individual' })
            const result = await createInvestor(formData)

            expect(result).toEqual({ error: 'Access denied' })
            expect(mockPrisma.$transaction).not.toHaveBeenCalled()
        })

        it('updateInvestor returns error when user lacks INVESTORS permission', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: FUND_A, currency: 'USD' })
            mockRequireModuleAccess.mockRejectedValue(new Error('Access denied: no INVESTORS permission'))

            const formData = makeFormData({ name: 'Updated' })
            const result = await updateInvestor('inv-1', formData)

            expect(result).toEqual({ error: 'Access denied' })
            expect(mockPrisma.commitment.findFirst).not.toHaveBeenCalled()
        })

        it('deleteInvestor returns error when user lacks INVESTORS permission', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: FUND_A, currency: 'USD' })
            mockRequireModuleAccess.mockRejectedValue(new Error('Access denied: no INVESTORS permission'))

            const result = await deleteInvestor('inv-1')

            expect(result).toEqual({ error: 'Access denied' })
            expect(mockPrisma.commitment.findFirst).not.toHaveBeenCalled()
        })

        it('getInvestorsForExport returns empty when user lacks INVESTORS permission', async () => {
            mockAuth.mockResolvedValue(mockSession)
            mockGetActiveFundWithCurrency.mockResolvedValue({ fundId: FUND_A, currency: 'USD' })
            mockRequireModuleAccess.mockRejectedValue(new Error('Access denied: no INVESTORS permission'))

            const result = await getInvestorsForExport()

            expect(result).toHaveLength(0)
            expect(mockPrisma.investor.findMany).not.toHaveBeenCalled()
        })

        it('all investor functions call requireModuleAccess with INVESTORS module', async () => {
            setupAuthenticatedUser()

            // getInvestors
            mockPrisma.investor.findMany.mockResolvedValue([])
            mockPrisma.investor.count.mockResolvedValue(0)
            await getInvestors()
            expect(mockRequireModuleAccess).toHaveBeenCalledWith(USER_ID, FUND_A, 'INVESTORS')

            vi.clearAllMocks()
            setupAuthenticatedUser()

            // getInvestor
            mockPrisma.investor.findFirst.mockResolvedValue(null)
            await getInvestor('inv-1')
            expect(mockRequireModuleAccess).toHaveBeenCalledWith(USER_ID, FUND_A, 'INVESTORS')

            vi.clearAllMocks()
            setupAuthenticatedUser()

            // getInvestorsForExport
            mockPrisma.investor.findMany.mockResolvedValue([])
            await getInvestorsForExport()
            expect(mockRequireModuleAccess).toHaveBeenCalledWith(USER_ID, FUND_A, 'INVESTORS')
        })
    })
})
