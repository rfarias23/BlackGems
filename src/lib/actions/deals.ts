'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { DealStage, DealStatus } from '@prisma/client'
import { formatCurrency, formatPercentage } from '@/lib/shared/formatters'
import { softDelete, notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { canTransitionDealStage } from '@/lib/shared/stage-transitions'

// Stage mapping between DB enum and UI display values
const STAGE_TO_DISPLAY: Record<DealStage, string> = {
    IDENTIFIED: 'Identified',
    INITIAL_REVIEW: 'Initial Review',
    PRELIMINARY_ANALYSIS: 'Initial Review',
    MANAGEMENT_MEETING: 'Initial Review',
    NDA_SIGNED: 'NDA Signed',
    NDA_CIM: 'NDA Signed',
    IOI_SUBMITTED: 'IOI Submitted',
    SITE_VISIT: 'Due Diligence',
    LOI_PREPARATION: 'LOI Negotiation',
    LOI_NEGOTIATION: 'LOI Negotiation',
    DUE_DILIGENCE: 'Due Diligence',
    FINAL_NEGOTIATION: 'Closing',
    CLOSING: 'Closing',
    CLOSED_WON: 'Closed Won',
    CLOSED_LOST: 'Closed Lost',
    CLOSED: 'Closed Won',
    PASSED: 'Closed Lost',
    ON_HOLD: 'On Hold',
}

const DISPLAY_TO_STAGE: Record<string, DealStage> = {
    'Identified': DealStage.IDENTIFIED,
    'Initial Review': DealStage.INITIAL_REVIEW,
    'NDA Signed': DealStage.NDA_SIGNED,
    'IOI Submitted': DealStage.IOI_SUBMITTED,
    'LOI Negotiation': DealStage.LOI_NEGOTIATION,
    'Due Diligence': DealStage.DUE_DILIGENCE,
    'Closing': DealStage.CLOSING,
    'Closed Won': DealStage.CLOSED_WON,
    'Closed Lost': DealStage.CLOSED_LOST,
    'On Hold': DealStage.ON_HOLD,
}

// Validation schemas
const createDealSchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters'),
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    stage: z.string(),
    industry: z.string().min(2, 'Sector must be at least 2 characters'),
    askingPrice: z.string().optional(),
    description: z.string().optional(),
    fundId: z.string(),
})

// Types
export interface DealListItem {
    id: string
    name: string
    companyName: string
    stage: string
    industry: string | null
    askingPrice: string | null
    createdAt: Date
}

export interface DealDetail {
    id: string
    name: string
    companyName: string
    stage: string
    status: DealStatus
    industry: string | null
    subIndustry: string | null
    description: string | null
    website: string | null
    askingPrice: string | null
    revenue: string | null
    ebitda: string | null
    grossProfit: string | null
    netIncome: string | null
    ebitdaMargin: string | null
    employeeCount: number | null
    yearFounded: number | null
    city: string | null
    state: string | null
    country: string
    investmentThesis: string | null
    keyRisks: string | null
    valueCreationPlan: string | null
    nextSteps: string | null
    internalNotes: string | null
    firstContactDate: Date | null
    ndaSignedDate: Date | null
    cimReceivedDate: Date | null
    managementMeetingDate: Date | null
    loiSubmittedDate: Date | null
    loiAcceptedDate: Date | null
    expectedCloseDate: Date | null
    actualCloseDate: Date | null
    createdAt: Date
    updatedAt: Date
    contacts: {
        id: string
        name: string
        title: string | null
        email: string | null
        phone: string | null
        role: string
        isPrimary: boolean
    }[]
    activities: {
        id: string
        type: string
        title: string
        description: string | null
        createdAt: Date
        user: { name: string | null }
    }[]
}

// Get all deals for a fund (or first available fund)
export async function getDeals(): Promise<DealListItem[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    // Get the first fund (for MVP, we'll support single fund)
    const fund = await prisma.fund.findFirst()
    if (!fund) {
        return []
    }

    const deals = await prisma.deal.findMany({
        where: { fundId: fund.id, ...notDeleted },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            companyName: true,
            stage: true,
            industry: true,
            askingPrice: true,
            createdAt: true,
        },
    })

    return deals.map((deal) => ({
        id: deal.id,
        name: deal.name,
        companyName: deal.companyName,
        stage: STAGE_TO_DISPLAY[deal.stage] || deal.stage,
        industry: deal.industry,
        askingPrice: formatCurrency(deal.askingPrice),
        createdAt: deal.createdAt,
    }))
}

// Get a single deal by ID
export async function getDeal(id: string): Promise<DealDetail | null> {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const deal = await prisma.deal.findFirst({
        where: { id, ...notDeleted },
        include: {
            contacts: {
                select: {
                    id: true,
                    name: true,
                    title: true,
                    email: true,
                    phone: true,
                    role: true,
                    isPrimary: true,
                },
            },
            activities: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    description: true,
                    createdAt: true,
                    user: { select: { name: true } },
                },
            },
        },
    })

    if (!deal) {
        return null
    }

    // Verify fund access
    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return null
    }

    return {
        id: deal.id,
        name: deal.name,
        companyName: deal.companyName,
        stage: STAGE_TO_DISPLAY[deal.stage] || deal.stage,
        status: deal.status,
        industry: deal.industry,
        subIndustry: deal.subIndustry,
        description: deal.description,
        website: deal.website,
        askingPrice: formatCurrency(deal.askingPrice),
        revenue: formatCurrency(deal.revenue),
        ebitda: formatCurrency(deal.ebitda),
        grossProfit: formatCurrency(deal.grossProfit),
        netIncome: formatCurrency(deal.netIncome),
        ebitdaMargin: formatPercentage(deal.ebitdaMargin),
        employeeCount: deal.employeeCount,
        yearFounded: deal.yearFounded,
        city: deal.city,
        state: deal.state,
        country: deal.country,
        investmentThesis: deal.investmentThesis,
        keyRisks: deal.keyRisks,
        valueCreationPlan: deal.valueCreationPlan,
        nextSteps: deal.nextSteps,
        internalNotes: deal.internalNotes,
        firstContactDate: deal.firstContactDate,
        ndaSignedDate: deal.ndaSignedDate,
        cimReceivedDate: deal.cimReceivedDate,
        managementMeetingDate: deal.managementMeetingDate,
        loiSubmittedDate: deal.loiSubmittedDate,
        loiAcceptedDate: deal.loiAcceptedDate,
        expectedCloseDate: deal.expectedCloseDate,
        actualCloseDate: deal.actualCloseDate,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        contacts: deal.contacts.map((c) => ({
            ...c,
            role: c.role.toString(),
        })),
        activities: deal.activities.map((a) => ({
            ...a,
            type: a.type.toString(),
        })),
    }
}

// Get the default fund ID (for MVP)
export async function getDefaultFundId(): Promise<string | null> {
    const fund = await prisma.fund.findFirst()
    return fund?.id ?? null
}

// Create a new deal
export async function createDeal(formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    // Get default fund
    const fund = await prisma.fund.findFirst()
    if (!fund) {
        return { error: 'No fund found. Please create a fund first.' }
    }

    // Verify fund access
    try {
        await requireFundAccess(session.user.id!, fund.id)
    } catch {
        return { error: 'Access denied' }
    }

    const rawData = {
        name: formData.get('name') as string,
        companyName: formData.get('name') as string, // Use name as company name
        stage: formData.get('stage') as string,
        industry: formData.get('sector') as string,
        askingPrice: formData.get('askPrice') as string | undefined,
        description: formData.get('description') as string | undefined,
        fundId: fund.id,
    }

    const validatedData = createDealSchema.safeParse(rawData)

    if (!validatedData.success) {
        return { error: validatedData.error.issues[0].message }
    }

    const { name, companyName, stage, industry, askingPrice, description, fundId } = validatedData.data

    // Convert display stage to DB enum
    const dbStage = DISPLAY_TO_STAGE[stage] || DealStage.IDENTIFIED

    // Parse asking price (remove $ and commas)
    let parsedPrice: number | null = null
    if (askingPrice) {
        const cleanPrice = askingPrice.replace(/[$,]/g, '')
        parsedPrice = parseFloat(cleanPrice)
        if (isNaN(parsedPrice)) {
            parsedPrice = null
        }
    }

    try {
        const deal = await prisma.deal.create({
            data: {
                name,
                companyName,
                stage: dbStage,
                industry,
                askingPrice: parsedPrice,
                description: description || null,
                fundId,
            },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'Deal',
            entityId: deal.id,
        })

        revalidatePath('/deals')
        redirect(`/deals/${deal.id}`)
    } catch (error) {
        // redirect() throws a special Next.js error — re-throw it
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error creating deal:', error)
        return { error: 'Failed to create deal' }
    }
}

// Update a deal
export async function updateDeal(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    // Load the existing deal to verify access and capture old state
    const existingDeal = await prisma.deal.findFirst({
        where: { id, ...notDeleted },
        select: { fundId: true, stage: true, name: true, industry: true, askingPrice: true, description: true },
    })
    if (!existingDeal) {
        return { error: 'Deal not found' }
    }

    try {
        await requireFundAccess(session.user.id!, existingDeal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    const stage = formData.get('stage') as string | null

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    const name = formData.get('name') as string | null
    if (name) {
        updateData.name = name
        updateData.companyName = name
    }

    if (stage) {
        const targetStage = DISPLAY_TO_STAGE[stage]
        if (targetStage && targetStage !== existingDeal.stage) {
            // Validate stage transition only if stage is actually changing
            if (!canTransitionDealStage(existingDeal.stage, targetStage)) {
                return { error: `Cannot transition from ${STAGE_TO_DISPLAY[existingDeal.stage]} to ${stage}` }
            }
            updateData.stage = targetStage
        }
    }

    const industry = formData.get('sector') as string | null
    if (industry) {
        updateData.industry = industry
    }

    const askPrice = formData.get('askPrice') as string | null
    if (askPrice) {
        const cleanPrice = askPrice.replace(/[$,]/g, '')
        const parsedPrice = parseFloat(cleanPrice)
        if (!isNaN(parsedPrice)) {
            updateData.askingPrice = parsedPrice
        }
    }

    const description = formData.get('description') as string | null
    if (description !== null) {
        updateData.description = description || null
    }

    try {
        await prisma.deal.update({
            where: { id },
            data: updateData,
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'Deal',
            entityId: id,
            changes: updateData,
        })

        revalidatePath('/deals')
        revalidatePath(`/deals/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating deal:', error)
        return { error: 'Failed to update deal' }
    }
}

// Soft-delete a deal
export async function deleteDeal(id: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    // Verify the deal exists and user has fund access
    const deal = await prisma.deal.findFirst({
        where: { id, ...notDeleted },
        select: { fundId: true },
    })
    if (!deal) {
        return { error: 'Deal not found' }
    }

    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    try {
        await softDelete('deal', id)

        await logAudit({
            userId: session.user.id!,
            action: 'DELETE',
            entityType: 'Deal',
            entityId: id,
        })

        revalidatePath('/deals')
        redirect('/deals')
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error deleting deal:', error)
        return { error: 'Failed to delete deal' }
    }
}

// Update deal stage with transition validation
export async function updateDealStage(id: string, stage: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const dbStage = DISPLAY_TO_STAGE[stage]
    if (!dbStage) {
        return { error: 'Invalid stage' }
    }

    // Load current deal to validate transition
    const deal = await prisma.deal.findFirst({
        where: { id, ...notDeleted },
        select: { stage: true, fundId: true },
    })
    if (!deal) {
        return { error: 'Deal not found' }
    }

    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    // Validate stage transition
    if (!canTransitionDealStage(deal.stage, dbStage)) {
        return {
            error: `Cannot transition from ${STAGE_TO_DISPLAY[deal.stage]} to ${stage}`,
        }
    }

    try {
        await prisma.deal.update({
            where: { id },
            data: { stage: dbStage },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'Deal',
            entityId: id,
            changes: { stage: { old: deal.stage, new: dbStage } },
        })

        revalidatePath('/deals')
        revalidatePath(`/deals/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating deal stage:', error)
        return { error: 'Failed to update stage' }
    }
}
