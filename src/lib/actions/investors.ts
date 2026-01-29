'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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
    amlStatus: string
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

// Helper to format decimal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMoney(value: any): string {
    if (!value) return '$0'
    return `$${Number(value).toLocaleString()}`
}

// Get all investors
export async function getInvestors(): Promise<InvestorListItem[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    const investors = await prisma.investor.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            commitments: {
                select: {
                    committedAmount: true,
                },
            },
        },
    })

    return investors.map((investor) => {
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
}

// Get single investor
export async function getInvestor(id: string): Promise<InvestorDetail | null> {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const investor = await prisma.investor.findUnique({
        where: { id },
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
        amlStatus: investor.amlStatus,
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
    if (!session?.user) {
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
                type: dbType as any,
                status: dbStatus as any,
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

        revalidatePath('/investors')
        redirect(`/investors/${investor.id}`)
    } catch (error) {
        console.error('Error creating investor:', error)
        return { error: 'Failed to create investor' }
    }
}

// Update investor
export async function updateInvestor(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user) {
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

    try {
        await prisma.investor.update({
            where: { id },
            data: updateData,
        })

        revalidatePath('/investors')
        revalidatePath(`/investors/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating investor:', error)
        return { error: 'Failed to update investor' }
    }
}

// Delete investor
export async function deleteInvestor(id: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    try {
        await prisma.investor.delete({
            where: { id },
        })

        revalidatePath('/investors')
        redirect('/investors')
    } catch (error) {
        console.error('Error deleting investor:', error)
        return { error: 'Failed to delete investor' }
    }
}

// Get investor type options
export function getInvestorTypeOptions() {
    return Object.entries(INVESTOR_TYPE_DISPLAY).map(([value, label]) => ({
        value: label,
        label,
    }))
}

// Get investor status options
export function getInvestorStatusOptions() {
    return Object.entries(INVESTOR_STATUS_DISPLAY).map(([value, label]) => ({
        value: label,
        label,
    }))
}
