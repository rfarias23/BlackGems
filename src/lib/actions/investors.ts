'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { InvestorType, InvestorStatus } from '@prisma/client'
import { formatMoney } from '@/lib/shared/formatters'
import { softDelete, notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { PaginationParams, PaginatedResult, parsePaginationParams, paginatedResult } from '@/lib/shared/pagination'

// Display mappings
const INVESTOR_TYPE_DISPLAY: Record<string, string> = {
    INDIVIDUAL: 'Individual',
    JOINT: 'Joint Account',
    TRUST: 'Trust',
    IRA: 'IRA',
    FAMILY_OFFICE: 'Family Office',
    FOUNDATION: 'Foundation',
    ENDOWMENT: 'Endowment',
    PENSION: 'Pension Fund',
    FUND_OF_FUNDS: 'Fund of Funds',
    CORPORATE: 'Corporate',
    SOVEREIGN_WEALTH: 'Sovereign Wealth',
    INSURANCE: 'Insurance Company',
    BANK: 'Bank',
    OTHER: 'Other',
}

const INVESTOR_STATUS_DISPLAY: Record<string, string> = {
    PROSPECT: 'Prospect',
    CONTACTED: 'Contacted',
    INTERESTED: 'Interested',
    DUE_DILIGENCE: 'Due Diligence',
    COMMITTED: 'Committed',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    DECLINED: 'Declined',
}

const DISPLAY_TO_TYPE: Record<string, string> = {
    'Individual': 'INDIVIDUAL',
    'Joint Account': 'JOINT',
    'Trust': 'TRUST',
    'IRA': 'IRA',
    'Family Office': 'FAMILY_OFFICE',
    'Foundation': 'FOUNDATION',
    'Endowment': 'ENDOWMENT',
    'Pension Fund': 'PENSION',
    'Fund of Funds': 'FUND_OF_FUNDS',
    'Corporate': 'CORPORATE',
    'Sovereign Wealth': 'SOVEREIGN_WEALTH',
    'Insurance Company': 'INSURANCE',
    'Bank': 'BANK',
    'Other': 'OTHER',
}

const DISPLAY_TO_STATUS: Record<string, string> = {
    'Prospect': 'PROSPECT',
    'Contacted': 'CONTACTED',
    'Interested': 'INTERESTED',
    'Due Diligence': 'DUE_DILIGENCE',
    'Committed': 'COMMITTED',
    'Active': 'ACTIVE',
    'Inactive': 'INACTIVE',
    'Declined': 'DECLINED',
}

// Validation schema
const createInvestorSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.string(),
    status: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    notes: z.string().optional(),
})

// Types
export interface InvestorListItem {
    id: string
    name: string
    type: string
    status: string
    email: string | null
    contactName: string | null
    totalCommitted: string
    createdAt: Date
}

export interface InvestorDetail {
    id: string
    name: string
    type: string
    status: string
    legalName: string | null
    taxId: string | null
    jurisdiction: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string
    postalCode: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    contactTitle: string | null
    accreditedStatus: string | null
    kycStatus: string
    kycCompletedAt: Date | null
    amlStatus: string
    amlCompletedAt: Date | null
    investmentCapacity: string | null
    notes: string | null
    source: string | null
    createdAt: Date
    updatedAt: Date
    commitments: {
        id: string
        fundName: string
        committedAmount: string
        calledAmount: string
        paidAmount: string
        status: string
    }[]
}

// Get investors with pagination and search
export async function getInvestors(params?: PaginationParams): Promise<PaginatedResult<InvestorListItem>> {
    const session = await auth()
    if (!session?.user?.id) {
        return paginatedResult([], 0, 1, 25)
    }

    const { page, pageSize, skip, search } = parsePaginationParams(params)

    const where = {
        ...notDeleted,
        ...(search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { contactName: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
    }

    const [investors, total] = await Promise.all([
        prisma.investor.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                commitments: {
                    select: {
                        committedAmount: true,
                    },
                },
            },
        }),
        prisma.investor.count({ where }),
    ])

    const data = investors.map((investor) => {
        const totalCommitted = investor.commitments.reduce(
            (sum, c) => sum + Number(c.committedAmount),
            0
        )
        return {
            id: investor.id,
            name: investor.name,
            type: INVESTOR_TYPE_DISPLAY[investor.type] || investor.type,
            status: INVESTOR_STATUS_DISPLAY[investor.status] || investor.status,
            email: investor.email,
            contactName: investor.contactName,
            totalCommitted: formatMoney(totalCommitted),
            createdAt: investor.createdAt,
        }
    })

    return paginatedResult(data, total, page, pageSize)
}

// Get single investor
export async function getInvestor(id: string): Promise<InvestorDetail | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const investor = await prisma.investor.findFirst({
        where: { id, ...notDeleted },
        include: {
            commitments: {
                include: {
                    fund: {
                        select: { name: true },
                    },
                },
            },
        },
    })

    if (!investor) {
        return null
    }

    return {
        id: investor.id,
        name: investor.name,
        type: INVESTOR_TYPE_DISPLAY[investor.type] || investor.type,
        status: INVESTOR_STATUS_DISPLAY[investor.status] || investor.status,
        legalName: investor.legalName,
        taxId: investor.taxId,
        jurisdiction: investor.jurisdiction,
        email: investor.email,
        phone: investor.phone,
        address: investor.address,
        city: investor.city,
        state: investor.state,
        country: investor.country,
        postalCode: investor.postalCode,
        contactName: investor.contactName,
        contactEmail: investor.contactEmail,
        contactPhone: investor.contactPhone,
        contactTitle: investor.contactTitle,
        accreditedStatus: investor.accreditedStatus,
        kycStatus: investor.kycStatus,
        kycCompletedAt: investor.kycCompletedAt,
        amlStatus: investor.amlStatus,
        amlCompletedAt: investor.amlCompletedAt,
        investmentCapacity: formatMoney(investor.investmentCapacity),
        notes: investor.notes,
        source: investor.source,
        createdAt: investor.createdAt,
        updatedAt: investor.updatedAt,
        commitments: investor.commitments.map((c) => ({
            id: c.id,
            fundName: c.fund.name,
            committedAmount: formatMoney(c.committedAmount),
            calledAmount: formatMoney(c.calledAmount),
            paidAmount: formatMoney(c.paidAmount),
            status: c.status,
        })),
    }
}

// Create investor
export async function createInvestor(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        status: formData.get('status') as string || 'Prospect',
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
        contactName: formData.get('contactName') as string || undefined,
        contactEmail: formData.get('contactEmail') as string || undefined,
        city: formData.get('city') as string || undefined,
        state: formData.get('state') as string || undefined,
        country: formData.get('country') as string || 'USA',
        notes: formData.get('notes') as string || undefined,
    }

    const validated = createInvestorSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data
    const dbType = DISPLAY_TO_TYPE[data.type] || 'INDIVIDUAL'
    const dbStatus = DISPLAY_TO_STATUS[data.status || 'Prospect'] || 'PROSPECT'

    try {
        const investor = await prisma.investor.create({
            data: {
                name: data.name,
                type: dbType as InvestorType,
                status: dbStatus as InvestorStatus,
                email: data.email || null,
                phone: data.phone || null,
                contactName: data.contactName || null,
                contactEmail: data.contactEmail || null,
                city: data.city || null,
                state: data.state || null,
                country: data.country || 'USA',
                notes: data.notes || null,
            },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'Investor',
            entityId: investor.id,
        })

        revalidatePath('/investors')
        redirect(`/investors/${investor.id}`)
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error creating investor:', error)
        return { error: 'Failed to create investor' }
    }
}

// Update investor
export async function updateInvestor(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    const name = formData.get('name') as string | null
    if (name) updateData.name = name

    const type = formData.get('type') as string | null
    if (type) updateData.type = DISPLAY_TO_TYPE[type] || type

    const status = formData.get('status') as string | null
    if (status) updateData.status = DISPLAY_TO_STATUS[status] || status

    const email = formData.get('email') as string | null
    if (email !== null) updateData.email = email || null

    const phone = formData.get('phone') as string | null
    if (phone !== null) updateData.phone = phone || null

    const contactName = formData.get('contactName') as string | null
    if (contactName !== null) updateData.contactName = contactName || null

    const contactEmail = formData.get('contactEmail') as string | null
    if (contactEmail !== null) updateData.contactEmail = contactEmail || null

    const contactPhone = formData.get('contactPhone') as string | null
    if (contactPhone !== null) updateData.contactPhone = contactPhone || null

    const contactTitle = formData.get('contactTitle') as string | null
    if (contactTitle !== null) updateData.contactTitle = contactTitle || null

    const legalName = formData.get('legalName') as string | null
    if (legalName !== null) updateData.legalName = legalName || null

    const jurisdiction = formData.get('jurisdiction') as string | null
    if (jurisdiction !== null) updateData.jurisdiction = jurisdiction || null

    const investmentCapacity = formData.get('investmentCapacity') as string | null
    if (investmentCapacity !== null) {
        const parsed = parseFloat(investmentCapacity.replace(/[$,]/g, ''))
        updateData.investmentCapacity = isNaN(parsed) ? null : parsed
    }

    const city = formData.get('city') as string | null
    if (city !== null) updateData.city = city || null

    const state = formData.get('state') as string | null
    if (state !== null) updateData.state = state || null

    const country = formData.get('country') as string | null
    if (country !== null) updateData.country = country || 'USA'

    const notes = formData.get('notes') as string | null
    if (notes !== null) updateData.notes = notes || null

    const source = formData.get('source') as string | null
    if (source !== null) updateData.source = source || null

    // Compliance fields
    const kycStatus = formData.get('kycStatus') as string | null
    if (kycStatus) updateData.kycStatus = kycStatus

    const amlStatus = formData.get('amlStatus') as string | null
    if (amlStatus) updateData.amlStatus = amlStatus

    const accreditedStatus = formData.get('accreditedStatus') as string | null
    if (accreditedStatus !== null) updateData.accreditedStatus = accreditedStatus || null

    const kycCompletedAt = formData.get('kycCompletedAt') as string | null
    if (kycCompletedAt !== null) {
        updateData.kycCompletedAt = kycCompletedAt ? new Date(kycCompletedAt) : null
    }

    const amlCompletedAt = formData.get('amlCompletedAt') as string | null
    if (amlCompletedAt !== null) {
        updateData.amlCompletedAt = amlCompletedAt ? new Date(amlCompletedAt) : null
    }

    try {
        await prisma.investor.update({
            where: { id },
            data: updateData,
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'Investor',
            entityId: id,
            changes: updateData,
        })

        revalidatePath('/investors')
        revalidatePath(`/investors/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating investor:', error)
        return { error: 'Failed to update investor' }
    }
}

// ============================================================================
// INVESTOR COMMUNICATIONS
// ============================================================================

const sendCommunicationSchema = z.object({
    subject: z.string().min(1, 'Subject is required'),
    message: z.string().min(1, 'Message is required'),
})

export async function sendInvestorCommunication(investorId: string, data: {
    subject: string
    message: string
}) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const parsed = sendCommunicationSchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const investor = await prisma.investor.findFirst({
        where: { id: investorId, ...notDeleted },
        select: { id: true, name: true, contactEmail: true, email: true },
    })

    if (!investor) {
        return { error: 'Investor not found' }
    }

    const recipientEmail = investor.contactEmail || investor.email
    if (!recipientEmail) {
        return { error: 'Investor has no email address on file' }
    }

    try {
        // Send email via Resend
        const { sendInvestorEmail } = await import('@/lib/email')
        const emailResult = await sendInvestorEmail({
            to: recipientEmail,
            subject: parsed.data.subject,
            investorName: investor.name,
            message: parsed.data.message,
        })

        if (!emailResult.success) {
            return { error: emailResult.error || 'Failed to send email' }
        }

        // Log the communication in audit trail
        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'InvestorCommunication',
            entityId: investorId,
            changes: {
                subject: { old: '', new: parsed.data.subject },
                recipient: { old: '', new: recipientEmail },
                type: { old: '', new: 'EMAIL' },
            },
        })

        revalidatePath(`/investors/${investorId}`)
        return { success: true }
    } catch (error) {
        console.error('Error sending communication:', error)
        return { error: 'Failed to send communication' }
    }
}

export interface CommunicationLogEntry {
    id: string
    action: string
    subject: string | null
    recipient: string | null
    type: string | null
    userName: string | null
    createdAt: Date
}

export async function getInvestorCommunications(investorId: string): Promise<CommunicationLogEntry[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    const logs = await prisma.auditLog.findMany({
        where: {
            entityType: 'InvestorCommunication',
            entityId: investorId,
        },
        include: {
            user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    })

    return logs.map(log => {
        const changes = log.changes as Record<string, { old: string; new: string }> | null
        return {
            id: log.id,
            action: log.action,
            subject: changes?.subject?.new || null,
            recipient: changes?.recipient?.new || null,
            type: changes?.type?.new || null,
            userName: log.user?.name || null,
            createdAt: log.createdAt,
        }
    })
}

// Get all investors with email addresses for CSV export
export async function getInvestorsForExport(): Promise<{
    name: string
    type: string
    status: string
    email: string
    contactName: string
    contactEmail: string
    totalCommitted: string
    totalCalled: string
    totalPaid: string
    createdAt: string
}[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    const investors = await prisma.investor.findMany({
        where: { ...notDeleted },
        include: {
            commitments: true,
        },
        orderBy: { name: 'asc' },
    })

    return investors.map(inv => {
        const totalCommitted = inv.commitments.reduce((sum, c) => sum + Number(c.committedAmount), 0)
        const totalCalled = inv.commitments.reduce((sum, c) => sum + Number(c.calledAmount), 0)
        const totalPaid = inv.commitments.reduce((sum, c) => sum + Number(c.paidAmount), 0)

        return {
            name: inv.name,
            type: INVESTOR_TYPE_DISPLAY[inv.type] || inv.type,
            status: INVESTOR_STATUS_DISPLAY[inv.status] || inv.status,
            email: inv.email || '',
            contactName: inv.contactName || '',
            contactEmail: inv.contactEmail || '',
            totalCommitted: formatMoney(totalCommitted),
            totalCalled: formatMoney(totalCalled),
            totalPaid: formatMoney(totalPaid),
            createdAt: inv.createdAt.toISOString().split('T')[0],
        }
    })
}

// Soft-delete investor
export async function deleteInvestor(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    // Verify investor exists
    const investor = await prisma.investor.findFirst({
        where: { id, ...notDeleted },
    })
    if (!investor) {
        return { error: 'Investor not found' }
    }

    try {
        await softDelete('investor', id)

        await logAudit({
            userId: session.user.id!,
            action: 'DELETE',
            entityType: 'Investor',
            entityId: id,
        })

        revalidatePath('/investors')
        redirect('/investors')
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error deleting investor:', error)
        return { error: 'Failed to delete investor' }
    }
}

