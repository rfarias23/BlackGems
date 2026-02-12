'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { DealStage, DealStatus } from '@prisma/client'
import { formatCurrency, formatPercentage, parseMoney, parsePercent } from '@/lib/shared/formatters'
import { softDelete, notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { canTransitionDealStage } from '@/lib/shared/stage-transitions'
import { notifyFundMembers } from '@/lib/actions/notifications'
import { PaginationParams, PaginatedResult, parsePaginationParams, paginatedResult } from '@/lib/shared/pagination'

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

// Get deals for a fund with pagination and search
export async function getDeals(params?: PaginationParams): Promise<PaginatedResult<DealListItem>> {
    const session = await auth()
    if (!session?.user?.id) {
        return paginatedResult([], 0, 1, 25)
    }

    // Get the first fund (for MVP, we'll support single fund)
    const fund = await prisma.fund.findFirst()
    if (!fund) {
        return paginatedResult([], 0, 1, 25)
    }

    const { page, pageSize, skip, search } = parsePaginationParams(params)

    const where = {
        fundId: fund.id,
        ...notDeleted,
        ...(search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { companyName: { contains: search, mode: 'insensitive' as const } },
                { industry: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
    }

    const [deals, total] = await Promise.all([
        prisma.deal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            select: {
                id: true,
                name: true,
                companyName: true,
                stage: true,
                industry: true,
                askingPrice: true,
                createdAt: true,
            },
        }),
        prisma.deal.count({ where }),
    ])

    const data = deals.map((deal) => ({
        id: deal.id,
        name: deal.name,
        companyName: deal.companyName,
        stage: STAGE_TO_DISPLAY[deal.stage] || deal.stage,
        industry: deal.industry,
        askingPrice: formatCurrency(deal.askingPrice),
        createdAt: deal.createdAt,
    }))

    return paginatedResult(data, total, page, pageSize)
}

// Get a single deal by ID
export async function getDeal(id: string): Promise<DealDetail | null> {
    const session = await auth()
    if (!session?.user?.id) {
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
        await requireFundAccess(session.user.id, deal.fundId)
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
    if (!session?.user?.id) {
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
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    // Load the existing deal to verify access and capture old state
    const existingDeal = await prisma.deal.findFirst({
        where: { id, ...notDeleted },
        select: { fundId: true, stage: true, name: true, industry: true, askingPrice: true, revenue: true, ebitda: true, description: true },
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

    const revenue = formData.get('revenue') as string | null
    if (revenue) {
        const cleanRevenue = revenue.replace(/[$,]/g, '')
        const parsedRevenue = parseFloat(cleanRevenue)
        if (!isNaN(parsedRevenue)) {
            updateData.revenue = parsedRevenue
        }
    }

    const ebitda = formData.get('ebitda') as string | null
    if (ebitda) {
        const cleanEbitda = ebitda.replace(/[$,]/g, '')
        const parsedEbitda = parseFloat(cleanEbitda)
        if (!isNaN(parsedEbitda)) {
            updateData.ebitda = parsedEbitda
        }
    }

    // Auto-calculate derived metrics using updated values or existing DB values
    const finalRevenue = updateData.revenue ?? (existingDeal.revenue ? Number(existingDeal.revenue) : null)
    const finalEbitda = updateData.ebitda ?? (existingDeal.ebitda ? Number(existingDeal.ebitda) : null)
    const finalAskingPrice = updateData.askingPrice ?? (existingDeal.askingPrice ? Number(existingDeal.askingPrice) : null)

    if (finalRevenue && finalEbitda && finalRevenue > 0) {
        updateData.ebitdaMargin = finalEbitda / finalRevenue
    }

    if (finalAskingPrice) {
        if (finalRevenue && finalRevenue > 0) {
            updateData.revenueMultiple = finalAskingPrice / finalRevenue
        }
        if (finalEbitda && finalEbitda > 0) {
            updateData.ebitdaMultiple = finalAskingPrice / finalEbitda
        }
    }

    const description = formData.get('description') as string | null
    if (description !== null) {
        updateData.description = description || null
    }

    const yearFounded = formData.get('yearFounded') as string | null
    if (yearFounded) {
        const parsed = parseInt(yearFounded, 10)
        if (!isNaN(parsed)) {
            updateData.yearFounded = parsed
        }
    }

    const employeeCount = formData.get('employeeCount') as string | null
    if (employeeCount) {
        const parsed = parseInt(employeeCount, 10)
        if (!isNaN(parsed)) {
            updateData.employeeCount = parsed
        }
    }

    const city = formData.get('city') as string | null
    if (city !== null) {
        updateData.city = city || null
    }

    const state = formData.get('state') as string | null
    if (state !== null) {
        updateData.state = state || null
    }

    const country = formData.get('country') as string | null
    if (country) {
        updateData.country = country
    }

    // Date fields
    const dateFields = [
        'firstContactDate', 'ndaSignedDate', 'cimReceivedDate',
        'managementMeetingDate', 'loiSubmittedDate', 'expectedCloseDate',
    ] as const
    for (const field of dateFields) {
        const value = formData.get(field) as string | null
        if (value) {
            updateData[field] = new Date(value)
        }
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
    if (!session?.user?.id) {
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
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const dbStage = DISPLAY_TO_STAGE[stage]
    if (!dbStage) {
        return { error: 'Invalid stage' }
    }

    // Load current deal to validate transition
    const deal = await prisma.deal.findFirst({
        where: { id, ...notDeleted },
        select: { stage: true, fundId: true, companyName: true },
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

        // Notify fund members of stage change
        await notifyFundMembers({
            fundId: deal.fundId,
            type: 'DEAL_STAGE_CHANGE',
            title: `Deal moved to ${stage}`,
            message: `${deal.companyName} has been moved to ${stage}`,
            link: `/deals/${id}`,
            excludeUserId: session.user.id!,
        })

        revalidatePath('/deals')
        revalidatePath(`/deals/${id}`)
        return { success: true, newStage: STAGE_TO_DISPLAY[dbStage] || stage }
    } catch (error) {
        console.error('Error updating deal stage:', error)
        return { error: 'Failed to update stage' }
    }
}

// ============================================================================
// DEAL-TO-PORTFOLIO CONVERSION
// ============================================================================

/** Check if a deal already has a linked portfolio company */
export async function getDealPortfolioLink(dealId: string): Promise<{ portfolioId: string } | null> {
    const link = await prisma.portfolioCompany.findUnique({
        where: { dealId },
        select: { id: true },
    })
    return link ? { portfolioId: link.id } : null
}

/** Get raw deal data for conversion (unformatted numbers) */
export async function getDealRawData(dealId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
    })
    if (!deal) return null

    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return null
    }

    return {
        id: deal.id,
        fundId: deal.fundId,
        companyName: deal.companyName,
        description: deal.description,
        industry: deal.industry,
        subIndustry: deal.subIndustry,
        website: deal.website,
        city: deal.city,
        state: deal.state,
        country: deal.country,
        askingPrice: deal.askingPrice ? Number(deal.askingPrice) : null,
        revenue: deal.revenue ? Number(deal.revenue) : null,
        ebitda: deal.ebitda ? Number(deal.ebitda) : null,
        investmentThesis: deal.investmentThesis,
        actualCloseDate: deal.actualCloseDate,
        stage: deal.stage,
    }
}

const convertDealSchema = z.object({
    equityInvested: z.string().min(1, 'Equity invested is required'),
    ownershipPct: z.string().min(1, 'Ownership percentage is required'),
    debtFinancing: z.string().optional(),
    entryValuation: z.string().min(1, 'Entry valuation is required'),
    acquisitionDate: z.string().min(1, 'Acquisition date is required'),
})

/** Convert a CLOSED_WON deal to a portfolio company */
export async function convertDealToPortfolio(dealId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    // Load the deal with full data
    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
    })
    if (!deal) {
        return { error: 'Deal not found' }
    }

    // Verify stage is CLOSED_WON
    if (deal.stage !== DealStage.CLOSED_WON && deal.stage !== DealStage.CLOSED) {
        return { error: 'Only Closed Won deals can be converted to portfolio companies' }
    }

    // Verify no existing portfolio company
    const existing = await prisma.portfolioCompany.findUnique({
        where: { dealId },
    })
    if (existing) {
        return { error: 'This deal already has a linked portfolio company' }
    }

    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    const rawData = {
        equityInvested: formData.get('equityInvested') as string,
        ownershipPct: formData.get('ownershipPct') as string,
        debtFinancing: formData.get('debtFinancing') as string || undefined,
        entryValuation: formData.get('entryValuation') as string,
        acquisitionDate: formData.get('acquisitionDate') as string,
    }

    const validated = convertDealSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data

    try {
        const equityInvested = parseMoney(data.equityInvested)
        const debtFinancing = data.debtFinancing ? parseMoney(data.debtFinancing) : 0
        const totalInvestment = equityInvested + debtFinancing
        const entryValuation = parseMoney(data.entryValuation)
        const ownershipPct = parsePercent(data.ownershipPct)
        const entryEbitda = deal.ebitda ? Number(deal.ebitda) : null
        const entryMultiple = entryEbitda && entryEbitda > 0 ? entryValuation / entryEbitda : null

        const company = await prisma.portfolioCompany.create({
            data: {
                fundId: deal.fundId,
                dealId: deal.id,
                name: deal.companyName,
                description: deal.description || null,
                industry: deal.industry || null,
                subIndustry: deal.subIndustry || null,
                website: deal.website || null,
                city: deal.city || null,
                state: deal.state || null,
                country: deal.country || 'USA',
                acquisitionDate: new Date(data.acquisitionDate),
                entryValuation,
                entryRevenue: deal.revenue ? Number(deal.revenue) : null,
                entryEbitda,
                entryMultiple,
                equityInvested,
                debtFinancing: debtFinancing || null,
                totalInvestment,
                ownershipPct,
                investmentThesis: deal.investmentThesis || null,
                status: 'HOLDING',
                unrealizedValue: entryValuation * ownershipPct,
                totalValue: entryValuation * ownershipPct,
                moic: 1.0,
            },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'PortfolioCompany',
            entityId: company.id,
            changes: { convertedFromDeal: { old: null, new: dealId } },
        })

        revalidatePath('/deals')
        revalidatePath(`/deals/${dealId}`)
        revalidatePath('/portfolio')
        return { success: true, portfolioId: company.id }
    } catch (error) {
        console.error('Error converting deal to portfolio:', error)
        return { error: 'Failed to convert deal to portfolio company' }
    }
}

// ============================================================================
// DEAL CONTACTS
// ============================================================================

const CONTACT_MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']

/** Create a new contact for a deal */
export async function createDealContact(dealId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
    if (!CONTACT_MANAGE_ROLES.includes(userRole)) {
        return { error: 'Insufficient permissions' }
    }

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
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

    const name = (formData.get('name') as string)?.trim()
    if (!name || name.length < 2) {
        return { error: 'Name must be at least 2 characters' }
    }

    const role = formData.get('role') as string
    if (!role) {
        return { error: 'Role is required' }
    }

    try {
        const contact = await prisma.dealContact.create({
            data: {
                dealId,
                name,
                title: (formData.get('title') as string)?.trim() || null,
                email: (formData.get('email') as string)?.trim() || null,
                phone: (formData.get('phone') as string)?.trim() || null,
                role: role as import('@prisma/client').DealContactRole,
                isPrimary: formData.get('isPrimary') === 'true',
                notes: (formData.get('notes') as string)?.trim() || null,
            },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'DealContact',
            entityId: contact.id,
        })

        revalidatePath(`/deals/${dealId}`)
        return { success: true }
    } catch (error) {
        console.error('Error creating deal contact:', error)
        return { error: 'Failed to create contact' }
    }
}

/** Delete a deal contact */
export async function deleteDealContact(contactId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
    if (!CONTACT_MANAGE_ROLES.includes(userRole)) {
        return { error: 'Insufficient permissions' }
    }

    const contact = await prisma.dealContact.findUnique({
        where: { id: contactId },
        include: { deal: { select: { fundId: true, id: true } } },
    })
    if (!contact) {
        return { error: 'Contact not found' }
    }

    try {
        await requireFundAccess(session.user.id!, contact.deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    try {
        await prisma.dealContact.delete({ where: { id: contactId } })

        await logAudit({
            userId: session.user.id!,
            action: 'DELETE',
            entityType: 'DealContact',
            entityId: contactId,
        })

        revalidatePath(`/deals/${contact.deal.id}`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting deal contact:', error)
        return { error: 'Failed to delete contact' }
    }
}
