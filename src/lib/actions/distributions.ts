'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { DistributionType } from '@prisma/client'
import { logAudit } from '@/lib/shared/audit'
import { softDelete, notDeleted } from '@/lib/shared/soft-delete'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { VALID_DIST_TRANSITIONS } from '@/lib/shared/workflow-transitions'
import { formatMoney, parseMoney } from '@/lib/shared/formatters'
import { notifyFundMembers } from '@/lib/actions/notifications'
import { PaginationParams, PaginatedResult, parsePaginationParams, paginatedResult } from '@/lib/shared/pagination'

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


// Get distributions with pagination and search
export async function getDistributions(params?: PaginationParams): Promise<PaginatedResult<DistributionListItem>> {
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
                { notes: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
    }

    const [distributions, total] = await Promise.all([
        prisma.distribution.findMany({
            where,
            orderBy: { distributionDate: 'desc' },
            skip,
            take: pageSize,
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
        }),
        prisma.distribution.count({ where }),
    ])

    const data = distributions.map((dist) => {
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

    return paginatedResult(data, total, page, pageSize)
}

// Get single distribution
export async function getDistribution(id: string): Promise<DistributionDetail | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const dist = await prisma.distribution.findFirst({
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
    if (!session?.user?.id) {
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
        await requireFundAccess(session.user.id!, data.fundId)
    } catch {
        return { error: 'Access denied' }
    }

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

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'Distribution',
            entityId: distribution.id,
        })

        // Notify fund members of new distribution
        const formattedAmount = `$${parseMoney(data.totalAmount).toLocaleString()}`
        await notifyFundMembers({
            fundId: data.fundId,
            type: 'DISTRIBUTION_MADE',
            title: `Distribution #${distributionNumber} Created`,
            message: `A new distribution of ${formattedAmount} has been created`,
            link: `/capital/distributions/${distribution.id}`,
            excludeUserId: session.user.id!,
        })

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
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const dbStatus = DISPLAY_TO_STATUS[status] || status

    try {
        const existingDist = await prisma.distribution.findUnique({ where: { id } })
        if (!existingDist) {
            return { error: 'Distribution not found' }
        }

        try {
            await requireFundAccess(session.user.id!, existingDist.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        // Validate status transition
        const allowed = VALID_DIST_TRANSITIONS[existingDist.status] || []
        if (!allowed.includes(dbStatus)) {
            return { error: `Cannot transition from ${DIST_STATUS_DISPLAY[existingDist.status]} to ${DIST_STATUS_DISPLAY[dbStatus] || dbStatus}` }
        }

        const updateData: Record<string, unknown> = {
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

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'Distribution',
            entityId: id,
            changes: { status: { old: existingDist.status, new: dbStatus } },
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
    if (!session?.user?.id) {
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

        try {
            await requireFundAccess(session.user.id!, item.distribution.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        // Update the distribution item
        await prisma.distributionItem.update({
            where: { id: itemId },
            data: {
                status: 'PAID',
                paidDate: new Date(),
            },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'DistributionItem',
            entityId: itemId,
            changes: { status: { old: item.status, new: 'PAID' } },
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
            const oldDistributedAmount = Number(commitment.distributedAmount)
            const newDistributedAmount = oldDistributedAmount + Number(item.netAmount)

            await prisma.commitment.update({
                where: { id: commitment.id },
                data: {
                    distributedAmount: newDistributedAmount,
                },
            })

            await logAudit({
                userId: session.user.id!,
                action: 'UPDATE',
                entityType: 'Commitment',
                entityId: commitment.id,
                changes: {
                    distributedAmount: { old: oldDistributedAmount, new: newDistributedAmount },
                },
            })
        }

        // Check if all items are paid to update distribution status
        const allItems = await prisma.distributionItem.findMany({
            where: { distributionId: item.distributionId },
        })

        const allPaid = allItems.every((i) => i.status === 'PAID')
        const oldDistStatus = item.distribution.status

        if (allPaid) {
            await prisma.distribution.update({
                where: { id: item.distributionId },
                data: {
                    status: 'COMPLETED',
                    paidDate: new Date(),
                },
            })
            if (oldDistStatus !== 'COMPLETED') {
                await logAudit({
                    userId: session.user.id!,
                    action: 'UPDATE',
                    entityType: 'Distribution',
                    entityId: item.distributionId,
                    changes: { status: { old: oldDistStatus, new: 'COMPLETED' } },
                })
            }
        } else {
            // Mark as processing if any payment has been made
            await prisma.distribution.update({
                where: { id: item.distributionId },
                data: { status: 'PROCESSING' },
            })
            if (oldDistStatus !== 'PROCESSING') {
                await logAudit({
                    userId: session.user.id!,
                    action: 'UPDATE',
                    entityType: 'Distribution',
                    entityId: item.distributionId,
                    changes: { status: { old: oldDistStatus, new: 'PROCESSING' } },
                })
            }
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
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    try {
        // Only allow deleting draft distributions
        const dist = await prisma.distribution.findFirst({
            where: { id, ...notDeleted },
        })

        if (!dist) {
            return { error: 'Distribution not found' }
        }

        try {
            await requireFundAccess(session.user.id!, dist.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        if (dist.status !== 'DRAFT') {
            return { error: 'Can only delete draft distributions' }
        }

        await softDelete('distribution', id)

        await logAudit({
            userId: session.user.id!,
            action: 'DELETE',
            entityType: 'Distribution',
            entityId: id,
        })

        revalidatePath('/capital')
        redirect('/capital')
    } catch (error) {
        console.error('Error deleting distribution:', error)
        return { error: 'Failed to delete distribution' }
    }
}

// PDF data for distribution notice
export interface DistributionPDFData {
    fundName: string
    distributionNumber: number
    distributionDate: string
    totalAmount: string
    returnOfCapital: string
    realizedGains: string
    dividends: string
    interest: string
    items: Array<{
        investorName: string
        grossAmount: string
        netAmount: string
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

export async function getDistributionPDFData(id: string): Promise<DistributionPDFData | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const dist = await prisma.distribution.findFirst({
        where: { id, ...notDeleted },
        include: {
            fund: { select: { name: true } },
            items: {
                include: {
                    investor: {
                        include: {
                            commitments: {
                                where: { status: { in: ['ACTIVE', 'FUNDED'] } },
                                select: { committedAmount: true, fundId: true },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!dist) return null

    const totalCommitted = dist.items.reduce((sum, item) => {
        const commitment = item.investor.commitments.find(c => c.fundId === dist.fundId)
        return sum + (commitment ? Number(commitment.committedAmount) : 0)
    }, 0)

    return {
        fundName: dist.fund.name,
        distributionNumber: dist.distributionNumber,
        distributionDate: fmtDate(dist.distributionDate),
        totalAmount: formatMoney(dist.totalAmount),
        returnOfCapital: dist.returnOfCapital ? formatMoney(dist.returnOfCapital) : '$0',
        realizedGains: dist.realizedGains ? formatMoney(dist.realizedGains) : '$0',
        dividends: dist.dividends ? formatMoney(dist.dividends) : '$0',
        interest: dist.interest ? formatMoney(dist.interest) : '$0',
        items: dist.items.map((item) => {
            const commitment = item.investor.commitments.find(c => c.fundId === dist.fundId)
            const committed = commitment ? Number(commitment.committedAmount) : 0
            const pct = totalCommitted > 0 ? (committed / totalCommitted * 100).toFixed(1) : '0.0'
            return {
                investorName: item.investor.name,
                grossAmount: formatMoney(item.grossAmount),
                netAmount: formatMoney(item.netAmount),
                ownershipPct: `${pct}%`,
                status: ITEM_STATUS_DISPLAY[item.status] || item.status,
            }
        }),
    }
}

// Summary stats for distributions dashboard
export interface DistributionSummary {
    totalDistributed: number
    totalPaid: number
    totalPending: number
    draftCount: number
    processingCount: number
    completedCount: number
}

export async function getDistributionSummary(): Promise<DistributionSummary> {
    const session = await auth()
    if (!session?.user?.id) {
        return { totalDistributed: 0, totalPaid: 0, totalPending: 0, draftCount: 0, processingCount: 0, completedCount: 0 }
    }

    const distributions = await prisma.distribution.findMany({
        where: notDeleted,
        select: {
            status: true,
            totalAmount: true,
            items: {
                select: { netAmount: true, status: true },
            },
        },
    })

    let totalDistributed = 0
    let totalPaid = 0
    let draftCount = 0
    let processingCount = 0
    let completedCount = 0

    for (const dist of distributions) {
        const amount = Number(dist.totalAmount)
        const paid = dist.items
            .filter((item) => item.status === 'PAID')
            .reduce((sum, item) => sum + Number(item.netAmount), 0)
        totalDistributed += amount
        totalPaid += paid

        switch (dist.status) {
            case 'DRAFT':
                draftCount++
                break
            case 'APPROVED':
            case 'PROCESSING':
                processingCount++
                break
            case 'COMPLETED':
                completedCount++
                break
        }
    }

    return {
        totalDistributed,
        totalPaid,
        totalPending: totalDistributed - totalPaid,
        draftCount,
        processingCount,
        completedCount,
    }
}

// Get available funds for distributions
export async function getFundsForDistribution(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) {
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
