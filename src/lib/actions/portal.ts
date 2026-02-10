'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'

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

export async function getPortalDocuments() {
    const session = await auth()
    if (!session?.user?.investorId) return []

    const documents = await prisma.document.findMany({
        where: {
            investorId: session.user.investorId,
            deletedAt: null,
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

    return documents
}
