'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { DistributionType } from '@prisma/client'

// Display mappings
const DIST_STATUS_DISPLAY: Record<string, string> = {
    DRAFT: 'Draft',
    APPROVED: 'Approved',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

const DISPLAY_TO_STATUS: Record<string, string> = {
    'Draft': 'DRAFT',
    'Approved': 'APPROVED',
    'Processing': 'PROCESSING',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED',
}

const DIST_TYPE_DISPLAY: Record<string, string> = {
    RETURN_OF_CAPITAL: 'Return of Capital',
    PROFIT_DISTRIBUTION: 'Profit Distribution',
    RECALLABLE: 'Recallable Distribution',
    FINAL: 'Final Distribution',
    SPECIAL: 'Special Distribution',
}

const DISPLAY_TO_TYPE: Record<string, string> = {
    'Return of Capital': 'RETURN_OF_CAPITAL',
    'Profit Distribution': 'PROFIT_DISTRIBUTION',
    'Recallable Distribution': 'RECALLABLE',
    'Final Distribution': 'FINAL',
    'Special Distribution': 'SPECIAL',
}

const ITEM_STATUS_DISPLAY: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    PAID: 'Paid',
    FAILED: 'Failed',
}

// Validation schema
const createDistributionSchema = z.object({
    fundId: z.string().min(1, 'Fund is required'),
    distributionDate: z.string().min(1, 'Distribution date is required'),
    type: z.string().min(1, 'Distribution type is required'),
    totalAmount: z.string().min(1, 'Total amount is required'),
    returnOfCapital: z.string().optional(),
    realizedGains: z.string().optional(),
    dividends: z.string().optional(),
    interest: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
})

// Types
export interface DistributionListItem {
    id: string
    distributionNumber: number
    fundName: string
    distributionDate: Date
    totalAmount: string
    paidAmount: string
    type: string
    status: string
    itemCount: number
}

export interface DistributionDetail {
    id: string
    distributionNumber: number
    fundId: string
    fundName: string
    distributionDate: Date
    totalAmount: string
    returnOfCapital: string | null
    realizedGains: string | null
    dividends: string | null
    interest: string | null
    type: string
    source: string | null
    status: string
    approvedDate: Date | null
    paidDate: Date | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    items: {
        id: string
        investorId: string
        investorName: string
        grossAmount: string
        withholdingTax: string
        netAmount: string
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

// Get all distributions
export async function getDistributions(): Promise<DistributionListItem[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    const distributions = await prisma.distribution.findMany({
        orderBy: { distributionDate: 'desc' },
        include: {
            fund: {
                select: { name: true },
            },
            items: {
                select: {
                    netAmount: true,
                    status: true,
                },
            },
        },
    })

    return distributions.map((dist) => {
        const totalPaid = dist.items
            .filter((item) => item.status === 'PAID')
            .reduce((sum, item) => sum + Number(item.netAmount), 0)
        return {
            id: dist.id,
            distributionNumber: dist.distributionNumber,
            fundName: dist.fund.name,
            distributionDate: dist.distributionDate,
            totalAmount: formatMoney(dist.totalAmount),
            paidAmount: formatMoney(totalPaid),
            type: DIST_TYPE_DISPLAY[dist.type] || dist.type,
            status: DIST_STATUS_DISPLAY[dist.status] || dist.status,
            itemCount: dist.items.length,
        }
    })
}

// Get single distribution
export async function getDistribution(id: string): Promise<DistributionDetail | null> {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const dist = await prisma.distribution.findUnique({
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

    if (!dist) {
        return null
    }

    return {
        id: dist.id,
        distributionNumber: dist.distributionNumber,
        fundId: dist.fundId,
        fundName: dist.fund.name,
        distributionDate: dist.distributionDate,
        totalAmount: formatMoney(dist.totalAmount),
        returnOfCapital: dist.returnOfCapital ? formatMoney(dist.returnOfCapital) : null,
        realizedGains: dist.realizedGains ? formatMoney(dist.realizedGains) : null,
        dividends: dist.dividends ? formatMoney(dist.dividends) : null,
        interest: dist.interest ? formatMoney(dist.interest) : null,
        type: DIST_TYPE_DISPLAY[dist.type] || dist.type,
        source: dist.source,
        status: DIST_STATUS_DISPLAY[dist.status] || dist.status,
        approvedDate: dist.approvedDate,
        paidDate: dist.paidDate,
        notes: dist.notes,
        createdAt: dist.createdAt,
        updatedAt: dist.updatedAt,
        items: dist.items.map((item) => ({
            id: item.id,
            investorId: item.investorId,
            investorName: item.investor.name,
            grossAmount: formatMoney(item.grossAmount),
            withholdingTax: formatMoney(item.withholdingTax),
            netAmount: formatMoney(item.netAmount),
            status: ITEM_STATUS_DISPLAY[item.status] || item.status,
            paidDate: item.paidDate,
        })),
    }
}

// Create distribution
export async function createDistribution(formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        fundId: formData.get('fundId') as string,
        distributionDate: formData.get('distributionDate') as string,
        type: formData.get('type') as string,
        totalAmount: formData.get('totalAmount') as string,
        returnOfCapital: formData.get('returnOfCapital') as string || undefined,
        realizedGains: formData.get('realizedGains') as string || undefined,
        dividends: formData.get('dividends') as string || undefined,
        interest: formData.get('interest') as string || undefined,
        source: formData.get('source') as string || undefined,
        notes: formData.get('notes') as string || undefined,
    }

    const validated = createDistributionSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data
    const dbType = DISPLAY_TO_TYPE[data.type] || 'PROFIT_DISTRIBUTION'

    try {
        // Get the next distribution number for this fund
        const lastDist = await prisma.distribution.findFirst({
            where: { fundId: data.fundId },
            orderBy: { distributionNumber: 'desc' },
        })
        const distributionNumber = (lastDist?.distributionNumber || 0) + 1

        // Create the distribution
        const distribution = await prisma.distribution.create({
            data: {
                fundId: data.fundId,
                distributionNumber,
                distributionDate: new Date(data.distributionDate),
                totalAmount: parseMoney(data.totalAmount),
                returnOfCapital: data.returnOfCapital ? parseMoney(data.returnOfCapital) : null,
                realizedGains: data.realizedGains ? parseMoney(data.realizedGains) : null,
                dividends: data.dividends ? parseMoney(data.dividends) : null,
                interest: data.interest ? parseMoney(data.interest) : null,
                type: dbType as DistributionType,
                source: data.source || null,
                notes: data.notes || null,
                status: 'DRAFT',
            },
        })

        // Get all active commitments for this fund and create distribution items
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: data.fundId,
                status: { in: ['ACTIVE', 'FUNDED'] },
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

        // Create distribution items for each investor pro-rata
        const totalAmount = parseMoney(data.totalAmount)
        for (const commitment of commitments) {
            const proRata = Number(commitment.committedAmount) / totalCommitted
            const grossAmount = totalAmount * proRata
            // Simple withholding calculation (can be customized per investor)
            const withholdingTax = 0 // Default no withholding, can be customized
            const netAmount = grossAmount - withholdingTax

            await prisma.distributionItem.create({
                data: {
                    distributionId: distribution.id,
                    investorId: commitment.investorId,
                    grossAmount,
                    withholdingTax,
                    netAmount,
                    status: 'PENDING',
                },
            })
        }

        revalidatePath('/capital')
        redirect(`/capital/distributions/${distribution.id}`)
    } catch (error) {
        console.error('Error creating distribution:', error)
        return { error: 'Failed to create distribution' }
    }
}

// Update distribution status
export async function updateDistributionStatus(id: string, status: string) {
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

        if (dbStatus === 'APPROVED') {
            updateData.approvedDate = new Date()
        } else if (dbStatus === 'COMPLETED') {
            updateData.paidDate = new Date()
        }

        await prisma.distribution.update({
            where: { id },
            data: updateData,
        })

        revalidatePath('/capital')
        revalidatePath(`/capital/distributions/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating distribution status:', error)
        return { error: 'Failed to update status' }
    }
}

// Process payment for a distribution item
export async function processDistributionItem(itemId: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    try {
        const item = await prisma.distributionItem.findUnique({
            where: { id: itemId },
            include: {
                distribution: true,
            },
        })

        if (!item) {
            return { error: 'Distribution item not found' }
        }

        // Update the distribution item
        await prisma.distributionItem.update({
            where: { id: itemId },
            data: {
                status: 'PAID',
                paidDate: new Date(),
            },
        })

        // Update the commitment's distributed amount
        const commitment = await prisma.commitment.findUnique({
            where: {
                investorId_fundId: {
                    investorId: item.investorId,
                    fundId: item.distribution.fundId,
                },
            },
        })

        if (commitment) {
            await prisma.commitment.update({
                where: { id: commitment.id },
                data: {
                    distributedAmount: Number(commitment.distributedAmount) + Number(item.netAmount),
                },
            })
        }

        // Check if all items are paid to update distribution status
        const allItems = await prisma.distributionItem.findMany({
            where: { distributionId: item.distributionId },
        })

        const allPaid = allItems.every((i) => i.status === 'PAID')

        if (allPaid) {
            await prisma.distribution.update({
                where: { id: item.distributionId },
                data: {
                    status: 'COMPLETED',
                    paidDate: new Date(),
                },
            })
        } else {
            // Mark as processing if any payment has been made
            await prisma.distribution.update({
                where: { id: item.distributionId },
                data: { status: 'PROCESSING' },
            })
        }

        revalidatePath('/capital')
        revalidatePath(`/capital/distributions/${item.distributionId}`)
        return { success: true }
    } catch (error) {
        console.error('Error processing distribution:', error)
        return { error: 'Failed to process distribution' }
    }
}

// Delete distribution
export async function deleteDistribution(id: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    try {
        // Only allow deleting draft distributions
        const dist = await prisma.distribution.findUnique({
            where: { id },
        })

        if (!dist) {
            return { error: 'Distribution not found' }
        }

        if (dist.status !== 'DRAFT') {
            return { error: 'Can only delete draft distributions' }
        }

        await prisma.distribution.delete({
            where: { id },
        })

        revalidatePath('/capital')
        redirect('/capital')
    } catch (error) {
        console.error('Error deleting distribution:', error)
        return { error: 'Failed to delete distribution' }
    }
}

// Get available funds for distributions
export async function getFundsForDistribution(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    // Get funds that have active commitments (what matters for distributions)
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

    const uniqueFunds = funds

    return uniqueFunds
}
