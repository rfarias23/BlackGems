'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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

// Helper to format decimal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMoney(value: any): string {
    if (!value) return '$0'
    return `$${Number(value).toLocaleString()}`
}

// Helper to parse money string
function parseMoney(value: string): number {
    if (!value) return 0
    return parseFloat(value.replace(/[$,]/g, '')) || 0
}

// Get all capital calls
export async function getCapitalCalls(): Promise<CapitalCallListItem[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    const calls = await prisma.capitalCall.findMany({
        orderBy: { callDate: 'desc' },
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
    })

    return calls.map((call) => {
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
            totalAmount: formatMoney(call.totalAmount),
            paidAmount: formatMoney(totalPaid),
            status: CALL_STATUS_DISPLAY[call.status] || call.status,
            itemCount: call.items.length,
        }
    })
}

// Get single capital call
export async function getCapitalCall(id: string): Promise<CapitalCallDetail | null> {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const call = await prisma.capitalCall.findUnique({
        where: { id },
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

    return {
        id: call.id,
        callNumber: call.callNumber,
        fundId: call.fundId,
        fundName: call.fund.name,
        callDate: call.callDate,
        dueDate: call.dueDate,
        totalAmount: formatMoney(call.totalAmount),
        forInvestment: call.forInvestment ? formatMoney(call.forInvestment) : null,
        forFees: call.forFees ? formatMoney(call.forFees) : null,
        forExpenses: call.forExpenses ? formatMoney(call.forExpenses) : null,
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
            callAmount: formatMoney(item.callAmount),
            paidAmount: formatMoney(item.paidAmount),
            status: ITEM_STATUS_DISPLAY[item.status] || item.status,
            paidDate: item.paidDate,
        })),
    }
}

// Create capital call
export async function createCapitalCall(formData: FormData) {
    const session = await auth()
    if (!session?.user) {
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
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const dbStatus = DISPLAY_TO_STATUS[status] || status

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {
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
    if (!session?.user) {
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

        // Update the commitment's called and paid amounts
        const commitment = await prisma.commitment.findUnique({
            where: {
                investorId_fundId: {
                    investorId: item.investorId,
                    fundId: item.capitalCall.fundId,
                },
            },
        })

        if (commitment) {
            await prisma.commitment.update({
                where: { id: commitment.id },
                data: {
                    calledAmount: Number(commitment.calledAmount) + (newStatus === 'PAID' ? Number(item.callAmount) : 0),
                    paidAmount: Number(commitment.paidAmount) + amount,
                },
            })
        }

        // Check if all items are paid to update capital call status
        const allItems = await prisma.capitalCallItem.findMany({
            where: { capitalCallId: item.capitalCallId },
        })

        const allPaid = allItems.every((i) => i.status === 'PAID')
        const somePaid = allItems.some((i) => i.status === 'PAID' || i.status === 'PARTIAL')

        if (allPaid) {
            await prisma.capitalCall.update({
                where: { id: item.capitalCallId },
                data: {
                    status: 'FULLY_FUNDED',
                    completedDate: new Date(),
                },
            })
        } else if (somePaid) {
            await prisma.capitalCall.update({
                where: { id: item.capitalCallId },
                data: { status: 'PARTIALLY_FUNDED' },
            })
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
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    try {
        // Only allow deleting draft calls
        const call = await prisma.capitalCall.findUnique({
            where: { id },
        })

        if (!call) {
            return { error: 'Capital call not found' }
        }

        if (call.status !== 'DRAFT') {
            return { error: 'Can only delete draft capital calls' }
        }

        await prisma.capitalCall.delete({
            where: { id },
        })

        revalidatePath('/capital')
        redirect('/capital')
    } catch (error) {
        console.error('Error deleting capital call:', error)
        return { error: 'Failed to delete capital call' }
    }
}

// Get available funds for capital calls
export async function getFundsForCapitalCall(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user) {
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
