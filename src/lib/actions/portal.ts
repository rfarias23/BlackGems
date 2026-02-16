'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { logAudit } from '@/lib/shared/audit'
import { computeChanges } from '@/lib/shared/audit'
import { notDeleted } from '@/lib/shared/soft-delete'
import {
    getLPCapitalStatement,
    getFundPerformanceReport,
    getPortfolioSummaryReport,
} from '@/lib/actions/reports'

function toNumber(d: Decimal | null | undefined): number {
    if (!d) return 0
    return Number(d)
}

export async function getPortalDashboard() {
    const session = await auth()
    if (!session?.user?.investorId) return null

    const investorId = session.user.investorId

    // Fetch investor with all financial relations
    const investor = await prisma.investor.findUnique({
        where: { id: investorId },
        select: {
            id: true,
            name: true,
            type: true,
            status: true,
            commitments: {
                select: {
                    id: true,
                    committedAmount: true,
                    calledAmount: true,
                    paidAmount: true,
                    distributedAmount: true,
                    status: true,
                    fund: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            type: true,
                        },
                    },
                },
            },
            capitalCalls: {
                select: {
                    id: true,
                    callAmount: true,
                    paidAmount: true,
                    status: true,
                    paidDate: true,
                    capitalCall: {
                        select: {
                            callNumber: true,
                            callDate: true,
                            dueDate: true,
                            purpose: true,
                            status: true,
                            fund: {
                                select: { name: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
            distributions: {
                select: {
                    id: true,
                    grossAmount: true,
                    netAmount: true,
                    status: true,
                    paidDate: true,
                    distribution: {
                        select: {
                            distributionNumber: true,
                            distributionDate: true,
                            type: true,
                            source: true,
                            fund: {
                                select: { name: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    })

    if (!investor) return null

    // Aggregate totals across all fund commitments
    let totalCommitted = 0
    let totalCalled = 0
    let totalPaid = 0
    let totalDistributed = 0

    for (const c of investor.commitments) {
        totalCommitted += toNumber(c.committedAmount)
        totalCalled += toNumber(c.calledAmount)
        totalPaid += toNumber(c.paidAmount)
        totalDistributed += toNumber(c.distributedAmount)
    }

    const unfunded = totalCommitted - totalCalled
    const calledPct = totalCommitted > 0 ? (totalCalled / totalCommitted) * 100 : 0

    // Recent transactions: merge capital calls + distributions, sorted by date
    const recentTransactions = [
        ...investor.capitalCalls.map((item) => ({
            id: item.id,
            type: 'CAPITAL_CALL' as const,
            date: item.capitalCall.callDate,
            amount: toNumber(item.callAmount),
            paidAmount: toNumber(item.paidAmount),
            status: item.status,
            description: item.capitalCall.purpose || `Capital Call #${item.capitalCall.callNumber}`,
            fund: item.capitalCall.fund.name,
        })),
        ...investor.distributions.map((item) => ({
            id: item.id,
            type: 'DISTRIBUTION' as const,
            date: item.distribution.distributionDate,
            amount: toNumber(item.netAmount),
            paidAmount: toNumber(item.netAmount),
            status: item.status,
            description: item.distribution.source || `Distribution #${item.distribution.distributionNumber}`,
            fund: item.distribution.fund.name,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Fund breakdown
    const funds = investor.commitments.map((c) => ({
        id: c.fund.id,
        name: c.fund.name,
        status: c.fund.status,
        type: c.fund.type,
        committed: toNumber(c.committedAmount),
        called: toNumber(c.calledAmount),
        paid: toNumber(c.paidAmount),
        distributed: toNumber(c.distributedAmount),
        unfunded: toNumber(c.committedAmount) - toNumber(c.calledAmount),
        commitmentStatus: c.status,
    }))

    return {
        investor: {
            id: investor.id,
            name: investor.name,
            type: investor.type,
            status: investor.status,
        },
        summary: {
            totalCommitted,
            totalCalled,
            totalPaid,
            totalDistributed,
            unfunded,
            calledPct: Math.round(calledPct * 10) / 10,
            netValue: totalPaid - totalDistributed, // Capital at work
        },
        funds,
        recentTransactions: recentTransactions.slice(0, 10),
    }
}

export async function getPortalReports() {
    const session = await auth()
    if (!session?.user?.investorId) return null

    const [capitalStatement, fundPerformance, portfolioSummary] = await Promise.all([
        getLPCapitalStatement(session.user.investorId),
        getFundPerformanceReport(),
        getPortfolioSummaryReport(),
    ])

    return { capitalStatement, fundPerformance, portfolioSummary }
}

export async function getPortalDocuments() {
    const session = await auth()
    if (!session?.user?.investorId) return []

    try {
        // Get investor-specific documents
        const investorDocs = await prisma.document.findMany({
            where: {
                investorId: session.user.investorId,
                deletedAt: null,
                visibleToLPs: true,
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                category: true,
                createdAt: true,
            },
        })

        // Get fund-level documents (shared with all LPs in the fund)
        const commitments = await prisma.commitment.findMany({
            where: { investorId: session.user.investorId, ...notDeleted },
            select: { fundId: true },
        })
        const fundIds = commitments.map(c => c.fundId)

        const fundDocs = fundIds.length > 0 ? await prisma.document.findMany({
            where: {
                fundId: { in: fundIds },
                investorId: null, // Fund-level, not investor-specific
                deletedAt: null,
                visibleToLPs: true,
                category: {
                    in: ['FUND_FORMATION', 'INVESTOR_COMMS', 'TAX', 'FINANCIAL_STATEMENTS', 'OPERATING_REPORTS', 'OTHER'],
                },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                category: true,
                createdAt: true,
            },
        }) : []

        // Merge and dedupe by id
        const allDocs = [...investorDocs, ...fundDocs]
        const seen = new Set<string>()
        return allDocs.filter(doc => {
            if (seen.has(doc.id)) return false
            seen.add(doc.id)
            return true
        })
    } catch (error) {
        console.error('[getPortalDocuments] Error:', error)
        return []
    }
}

// ============================================================================
// LP PROFILE UPDATE
// ============================================================================

const updateProfileSchema = z.object({
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    contactTitle: z.string().optional(),
})

export async function updatePortalProfile(data: {
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    contactTitle?: string
}) {
    const session = await auth()
    if (!session?.user?.id || !session.user.investorId) {
        return { error: 'Unauthorized' }
    }

    const parsed = updateProfileSchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    try {
        const existing = await prisma.investor.findUnique({
            where: { id: session.user.investorId },
            select: { contactName: true, contactEmail: true, contactPhone: true, contactTitle: true },
        })

        if (!existing) {
            return { error: 'Investor not found' }
        }

        const updateData = {
            contactName: parsed.data.contactName || null,
            contactEmail: parsed.data.contactEmail || null,
            contactPhone: parsed.data.contactPhone || null,
            contactTitle: parsed.data.contactTitle || null,
        }

        await prisma.investor.update({
            where: { id: session.user.investorId },
            data: updateData,
        })

        const changes = computeChanges(existing, updateData)

        await logAudit({
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'Investor',
            entityId: session.user.investorId,
            changes,
        })

        revalidatePath('/portal/profile')
        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return { error: 'Failed to update profile' }
    }
}

// ============================================================================
// CAPITAL CALL ACKNOWLEDGMENT
// ============================================================================

export async function acknowledgeCapitalCall(itemId: string) {
    const session = await auth()
    if (!session?.user?.id || !session.user.investorId) {
        return { error: 'Unauthorized' }
    }

    try {
        const item = await prisma.capitalCallItem.findUnique({
            where: { id: itemId },
            include: { capitalCall: true },
        })

        if (!item) {
            return { error: 'Capital call item not found' }
        }

        // Verify this item belongs to the logged-in investor
        if (item.investorId !== session.user.investorId) {
            return { error: 'Access denied' }
        }

        // Only allow acknowledging PENDING items
        if (item.status !== 'PENDING') {
            return { error: 'This capital call has already been acknowledged' }
        }

        await prisma.capitalCallItem.update({
            where: { id: itemId },
            data: { status: 'NOTIFIED' },
        })

        await logAudit({
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'CapitalCallItem',
            entityId: itemId,
            changes: { status: { old: 'PENDING', new: 'NOTIFIED' } },
        })

        revalidatePath('/portal/capital')
        return { success: true }
    } catch (error) {
        console.error('Error acknowledging capital call:', error)
        return { error: 'Failed to acknowledge capital call' }
    }
}
