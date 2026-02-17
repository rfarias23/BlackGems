'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { logAudit } from '@/lib/shared/audit'
import { softDelete, notDeleted } from '@/lib/shared/soft-delete'
import { requireFundAccess, getActiveFundWithCurrency } from '@/lib/shared/fund-access'
import { VALID_CALL_TRANSITIONS } from '@/lib/shared/workflow-transitions'
import { notifyFundMembers } from '@/lib/actions/notifications'
import { formatMoney, parseMoney } from '@/lib/shared/formatters'
import { PaginationParams, PaginatedResult, parsePaginationParams, paginatedResult } from '@/lib/shared/pagination'

// Display mappings
const CALL_STATUS_DISPLAY: Record<string, string> = {
    DRAFT: 'Draft',
    APPROVED: 'Approved',
    SENT: 'Sent',
    PARTIALLY_FUNDED: 'Partially Funded',
    FULLY_FUNDED: 'Fully Funded',
    CANCELLED: 'Cancelled',
}

const DISPLAY_TO_STATUS: Record<string, string> = {
    'Draft': 'DRAFT',
    'Approved': 'APPROVED',
    'Sent': 'SENT',
    'Partially Funded': 'PARTIALLY_FUNDED',
    'Fully Funded': 'FULLY_FUNDED',
    'Cancelled': 'CANCELLED',
}

const ITEM_STATUS_DISPLAY: Record<string, string> = {
    PENDING: 'Pending',
    NOTIFIED: 'Notified',
    PARTIAL: 'Partial',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
    DEFAULTED: 'Defaulted',
}

// Validation schema
const createCapitalCallSchema = z.object({
    fundId: z.string().min(1, 'Fund is required'),
    callDate: z.string().min(1, 'Call date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    totalAmount: z.string().min(1, 'Total amount is required'),
    forInvestment: z.string().optional(),
    forFees: z.string().optional(),
    forExpenses: z.string().optional(),
    purpose: z.string().optional(),
    dealReference: z.string().optional(),
})

// Types
export interface CapitalCallListItem {
    id: string
    callNumber: number
    fundName: string
    callDate: Date
    dueDate: Date
    totalAmount: string
    paidAmount: string
    status: string
    itemCount: number
}

export interface CapitalCallDetail {
    id: string
    callNumber: number
    fundId: string
    fundName: string
    callDate: Date
    dueDate: Date
    totalAmount: string
    forInvestment: string | null
    forFees: string | null
    forExpenses: string | null
    purpose: string | null
    dealReference: string | null
    status: string
    noticeDate: Date | null
    completedDate: Date | null
    createdAt: Date
    updatedAt: Date
    items: {
        id: string
        investorId: string
        investorName: string
        callAmount: string
        paidAmount: string
        status: string
        paidDate: Date | null
    }[]
}


// Get capital calls with pagination and search
export async function getCapitalCalls(params?: PaginationParams): Promise<PaginatedResult<CapitalCallListItem>> {
    const session = await auth()
    if (!session?.user?.id) {
        return paginatedResult([], 0, 1, 25)
    }

    const { page, pageSize, skip, search } = parsePaginationParams(params)

    const where = {
        ...notDeleted,
        ...(search ? {
            OR: [
                { fund: { name: { contains: search, mode: 'insensitive' as const } } },
                { purpose: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
    }

    const [calls, total] = await Promise.all([
        prisma.capitalCall.findMany({
            where,
            orderBy: { callDate: 'desc' },
            skip,
            take: pageSize,
            include: {
                fund: {
                    select: { name: true },
                },
                items: {
                    select: {
                        paidAmount: true,
                    },
                },
            },
        }),
        prisma.capitalCall.count({ where }),
    ])

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return paginatedResult([], 0, page, pageSize)
    const { currency } = fundResult

    const data = calls.map((call) => {
        const totalPaid = call.items.reduce(
            (sum, item) => sum + Number(item.paidAmount),
            0
        )
        return {
            id: call.id,
            callNumber: call.callNumber,
            fundName: call.fund.name,
            callDate: call.callDate,
            dueDate: call.dueDate,
            totalAmount: formatMoney(call.totalAmount, currency),
            paidAmount: formatMoney(totalPaid, currency),
            status: CALL_STATUS_DISPLAY[call.status] || call.status,
            itemCount: call.items.length,
        }
    })

    return paginatedResult(data, total, page, pageSize)
}

// Get single capital call
export async function getCapitalCall(id: string): Promise<CapitalCallDetail | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const call = await prisma.capitalCall.findFirst({
        where: { id, ...notDeleted },
        include: {
            fund: {
                select: { name: true },
            },
            items: {
                include: {
                    investor: {
                        select: { name: true },
                    },
                },
            },
        },
    })

    if (!call) {
        return null
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return null
    const { currency } = fundResult

    return {
        id: call.id,
        callNumber: call.callNumber,
        fundId: call.fundId,
        fundName: call.fund.name,
        callDate: call.callDate,
        dueDate: call.dueDate,
        totalAmount: formatMoney(call.totalAmount, currency),
        forInvestment: call.forInvestment ? formatMoney(call.forInvestment, currency) : null,
        forFees: call.forFees ? formatMoney(call.forFees, currency) : null,
        forExpenses: call.forExpenses ? formatMoney(call.forExpenses, currency) : null,
        purpose: call.purpose,
        dealReference: call.dealReference,
        status: CALL_STATUS_DISPLAY[call.status] || call.status,
        noticeDate: call.noticeDate,
        completedDate: call.completedDate,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
        items: call.items.map((item) => ({
            id: item.id,
            investorId: item.investorId,
            investorName: item.investor.name,
            callAmount: formatMoney(item.callAmount, currency),
            paidAmount: formatMoney(item.paidAmount, currency),
            status: ITEM_STATUS_DISPLAY[item.status] || item.status,
            paidDate: item.paidDate,
        })),
    }
}

// Create capital call
export async function createCapitalCall(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        fundId: formData.get('fundId') as string,
        callDate: formData.get('callDate') as string,
        dueDate: formData.get('dueDate') as string,
        totalAmount: formData.get('totalAmount') as string,
        forInvestment: formData.get('forInvestment') as string || undefined,
        forFees: formData.get('forFees') as string || undefined,
        forExpenses: formData.get('forExpenses') as string || undefined,
        purpose: formData.get('purpose') as string || undefined,
        dealReference: formData.get('dealReference') as string || undefined,
    }

    const validated = createCapitalCallSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data

    try {
        await requireFundAccess(session.user.id!, data.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    try {
        // Get the next call number for this fund
        const lastCall = await prisma.capitalCall.findFirst({
            where: { fundId: data.fundId },
            orderBy: { callNumber: 'desc' },
        })
        const callNumber = (lastCall?.callNumber || 0) + 1

        // Create the capital call
        const capitalCall = await prisma.capitalCall.create({
            data: {
                fundId: data.fundId,
                callNumber,
                callDate: new Date(data.callDate),
                dueDate: new Date(data.dueDate),
                totalAmount: parseMoney(data.totalAmount),
                forInvestment: data.forInvestment ? parseMoney(data.forInvestment) : null,
                forFees: data.forFees ? parseMoney(data.forFees) : null,
                forExpenses: data.forExpenses ? parseMoney(data.forExpenses) : null,
                purpose: data.purpose || null,
                dealReference: data.dealReference || null,
                status: 'DRAFT',
            },
        })

        // Get all active commitments for this fund and create call items
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: data.fundId,
                status: { in: ['ACTIVE', 'FUNDED', 'SIGNED'] },
                ...notDeleted,
            },
            include: {
                investor: true,
            },
        })

        // Calculate total committed for pro-rata
        const totalCommitted = commitments.reduce(
            (sum, c) => sum + Number(c.committedAmount),
            0
        )

        // Create call items for each investor pro-rata
        const totalAmount = parseMoney(data.totalAmount)
        for (const commitment of commitments) {
            const proRata = Number(commitment.committedAmount) / totalCommitted
            const callAmount = totalAmount * proRata

            await prisma.capitalCallItem.create({
                data: {
                    capitalCallId: capitalCall.id,
                    investorId: commitment.investorId,
                    callAmount,
                    paidAmount: 0,
                    status: 'PENDING',
                },
            })
        }

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'CapitalCall',
            entityId: capitalCall.id,
        })

        // Notify fund members of new capital call
        const fundResult = await getActiveFundWithCurrency(session.user.id!)
        const formattedAmount = formatMoney(parseMoney(data.totalAmount), fundResult?.currency ?? 'USD')
        await notifyFundMembers({
            fundId: data.fundId,
            type: 'CAPITAL_CALL_DUE',
            title: `Capital Call #${callNumber} Created`,
            message: `A new capital call for ${formattedAmount} is due ${new Date(data.dueDate).toLocaleDateString()}`,
            link: `/capital/calls/${capitalCall.id}`,
            excludeUserId: session.user.id!,
        })

        revalidatePath('/capital')
        redirect(`/capital/calls/${capitalCall.id}`)
    } catch (error) {
        console.error('Error creating capital call:', error)
        return { error: 'Failed to create capital call' }
    }
}

// Update capital call status
export async function updateCapitalCallStatus(id: string, status: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const dbStatus = DISPLAY_TO_STATUS[status] || status

    try {
        const existingCall = await prisma.capitalCall.findUnique({ where: { id } })
        if (!existingCall) {
            return { error: 'Capital call not found' }
        }

        try {
            await requireFundAccess(session.user.id!, existingCall.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        // Validate status transition
        const allowed = VALID_CALL_TRANSITIONS[existingCall.status] || []
        if (!allowed.includes(dbStatus)) {
            return { error: `Cannot transition from ${CALL_STATUS_DISPLAY[existingCall.status]} to ${CALL_STATUS_DISPLAY[dbStatus] || dbStatus}` }
        }

        const updateData: Record<string, unknown> = {
            status: dbStatus,
        }

        if (dbStatus === 'SENT') {
            updateData.noticeDate = new Date()
        } else if (dbStatus === 'FULLY_FUNDED') {
            updateData.completedDate = new Date()
        }

        await prisma.capitalCall.update({
            where: { id },
            data: updateData,
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'CapitalCall',
            entityId: id,
            changes: { status: { old: existingCall.status, new: dbStatus } },
        })

        revalidatePath('/capital')
        revalidatePath(`/capital/calls/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating capital call status:', error)
        return { error: 'Failed to update status' }
    }
}

// Record payment for a capital call item
export async function recordCallItemPayment(
    itemId: string,
    amount: number,
    markAsPaid: boolean = false
) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    try {
        const item = await prisma.capitalCallItem.findUnique({
            where: { id: itemId },
            include: {
                capitalCall: true,
                investor: {
                    include: {
                        commitments: {
                            where: { fundId: undefined }, // Will be filtered below
                        },
                    },
                },
            },
        })

        if (!item) {
            return { error: 'Capital call item not found' }
        }

        try {
            await requireFundAccess(session.user.id!, item.capitalCall.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        const newPaidAmount = Number(item.paidAmount) + amount
        const callAmount = Number(item.callAmount)

        let newStatus = item.status
        if (markAsPaid || newPaidAmount >= callAmount) {
            newStatus = 'PAID'
        } else if (newPaidAmount > 0) {
            newStatus = 'PARTIAL'
        }

        // Update the call item
        await prisma.capitalCallItem.update({
            where: { id: itemId },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus,
                paidDate: newStatus === 'PAID' ? new Date() : null,
            },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'CapitalCallItem',
            entityId: itemId,
            changes: { paidAmount: { old: Number(item.paidAmount), new: newPaidAmount }, status: { old: item.status, new: newStatus } },
        })

        // Update the commitment's called and paid amounts
        const commitment = await prisma.commitment.findFirst({
            where: {
                investorId: item.investorId,
                fundId: item.capitalCall.fundId,
                ...notDeleted,
            },
        })

        if (commitment) {
            const oldCalledAmount = Number(commitment.calledAmount)
            const oldPaidAmount = Number(commitment.paidAmount)
            const newCalledAmount = oldCalledAmount + (newStatus === 'PAID' ? Number(item.callAmount) : 0)
            const newCommitPaidAmount = oldPaidAmount + amount

            await prisma.commitment.update({
                where: { id: commitment.id },
                data: {
                    calledAmount: newCalledAmount,
                    paidAmount: newCommitPaidAmount,
                },
            })

            await logAudit({
                userId: session.user.id!,
                action: 'UPDATE',
                entityType: 'Commitment',
                entityId: commitment.id,
                changes: {
                    calledAmount: { old: oldCalledAmount, new: newCalledAmount },
                    paidAmount: { old: oldPaidAmount, new: newCommitPaidAmount },
                },
            })
        }

        // Check if all items are paid to update capital call status
        const allItems = await prisma.capitalCallItem.findMany({
            where: { capitalCallId: item.capitalCallId },
        })

        const allPaid = allItems.every((i) => i.status === 'PAID')
        const somePaid = allItems.some((i) => i.status === 'PAID' || i.status === 'PARTIAL')
        const oldCallStatus = item.capitalCall.status

        if (allPaid) {
            await prisma.capitalCall.update({
                where: { id: item.capitalCallId },
                data: {
                    status: 'FULLY_FUNDED',
                    completedDate: new Date(),
                },
            })
            if (oldCallStatus !== 'FULLY_FUNDED') {
                await logAudit({
                    userId: session.user.id!,
                    action: 'UPDATE',
                    entityType: 'CapitalCall',
                    entityId: item.capitalCallId,
                    changes: { status: { old: oldCallStatus, new: 'FULLY_FUNDED' } },
                })
            }
        } else if (somePaid) {
            await prisma.capitalCall.update({
                where: { id: item.capitalCallId },
                data: { status: 'PARTIALLY_FUNDED' },
            })
            if (oldCallStatus !== 'PARTIALLY_FUNDED') {
                await logAudit({
                    userId: session.user.id!,
                    action: 'UPDATE',
                    entityType: 'CapitalCall',
                    entityId: item.capitalCallId,
                    changes: { status: { old: oldCallStatus, new: 'PARTIALLY_FUNDED' } },
                })
            }
        }

        revalidatePath('/capital')
        revalidatePath(`/capital/calls/${item.capitalCallId}`)
        return { success: true }
    } catch (error) {
        console.error('Error recording payment:', error)
        return { error: 'Failed to record payment' }
    }
}

// Delete capital call
export async function deleteCapitalCall(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    try {
        // Only allow deleting draft calls
        const call = await prisma.capitalCall.findFirst({
            where: { id, ...notDeleted },
        })

        if (!call) {
            return { error: 'Capital call not found' }
        }

        try {
            await requireFundAccess(session.user.id!, call.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        if (call.status !== 'DRAFT') {
            return { error: 'Can only delete draft capital calls' }
        }

        await softDelete('capitalCall', id)

        await logAudit({
            userId: session.user.id!,
            action: 'DELETE',
            entityType: 'CapitalCall',
            entityId: id,
        })

        revalidatePath('/capital')
        redirect('/capital')
    } catch (error) {
        console.error('Error deleting capital call:', error)
        return { error: 'Failed to delete capital call' }
    }
}

// PDF data for capital call notice
export interface CapitalCallPDFData {
    fundName: string
    callNumber: number
    callDate: string
    dueDate: string
    purpose: string
    totalAmount: string
    items: Array<{
        investorName: string
        committedAmount: string
        callAmount: string
        ownershipPct: string
        status: string
    }>
}

function fmtDate(d: Date): string {
    return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export async function getCapitalCallPDFData(id: string): Promise<CapitalCallPDFData | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const call = await prisma.capitalCall.findFirst({
        where: { id, ...notDeleted },
        include: {
            fund: { select: { name: true } },
            items: {
                include: {
                    investor: {
                        include: {
                            commitments: {
                                where: { status: { in: ['ACTIVE', 'FUNDED', 'SIGNED'] } },
                                select: { committedAmount: true, fundId: true },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!call) return null

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return null
    const { currency } = fundResult

    const totalCommitted = call.items.reduce((sum, item) => {
        const commitment = item.investor.commitments.find(c => c.fundId === call.fundId)
        return sum + (commitment ? Number(commitment.committedAmount) : 0)
    }, 0)

    return {
        fundName: call.fund.name,
        callNumber: call.callNumber,
        callDate: fmtDate(call.callDate),
        dueDate: fmtDate(call.dueDate),
        purpose: call.purpose || 'Investment & Operations',
        totalAmount: formatMoney(call.totalAmount, currency),
        items: call.items.map((item) => {
            const commitment = item.investor.commitments.find(c => c.fundId === call.fundId)
            const committed = commitment ? Number(commitment.committedAmount) : 0
            const pct = totalCommitted > 0 ? (committed / totalCommitted * 100).toFixed(1) : '0.0'
            return {
                investorName: item.investor.name,
                committedAmount: formatMoney(committed, currency),
                callAmount: formatMoney(item.callAmount, currency),
                ownershipPct: `${pct}%`,
                status: ITEM_STATUS_DISPLAY[item.status] || item.status,
            }
        }),
    }
}

// Summary stats for capital calls dashboard
export interface CapitalCallSummary {
    totalCalled: number
    totalPaid: number
    totalOutstanding: number
    draftCount: number
    activeCount: number
    fullyFundedCount: number
}

export async function getCapitalCallSummary(): Promise<CapitalCallSummary> {
    const session = await auth()
    if (!session?.user?.id) {
        return { totalCalled: 0, totalPaid: 0, totalOutstanding: 0, draftCount: 0, activeCount: 0, fullyFundedCount: 0 }
    }

    const calls = await prisma.capitalCall.findMany({
        where: notDeleted,
        select: {
            status: true,
            totalAmount: true,
            items: {
                select: { paidAmount: true },
            },
        },
    })

    let totalCalled = 0
    let totalPaid = 0
    let draftCount = 0
    let activeCount = 0
    let fullyFundedCount = 0

    for (const call of calls) {
        const amount = Number(call.totalAmount)
        const paid = call.items.reduce((sum, item) => sum + Number(item.paidAmount), 0)
        totalCalled += amount
        totalPaid += paid

        switch (call.status) {
            case 'DRAFT':
                draftCount++
                break
            case 'APPROVED':
            case 'SENT':
            case 'PARTIALLY_FUNDED':
                activeCount++
                break
            case 'FULLY_FUNDED':
                fullyFundedCount++
                break
        }
    }

    return {
        totalCalled,
        totalPaid,
        totalOutstanding: totalCalled - totalPaid,
        draftCount,
        activeCount,
        fullyFundedCount,
    }
}

// Get available funds for capital calls
export async function getFundsForCapitalCall(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    // Get funds that have active commitments (what matters for capital calls)
    const funds = await prisma.fund.findMany({
        where: {
            commitments: {
                some: {
                    status: { in: ['SIGNED', 'ACTIVE', 'FUNDED'] },
                },
            },
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    })

    return funds
}
