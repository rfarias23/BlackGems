'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Display mappings
const STATUS_DISPLAY: Record<string, string> = {
    HOLDING: 'Holding',
    PREPARING_EXIT: 'Preparing Exit',
    UNDER_LOI: 'Under LOI',
    PARTIAL_EXIT: 'Partial Exit',
    EXITED: 'Exited',
    WRITTEN_OFF: 'Written Off',
}

const DISPLAY_TO_STATUS: Record<string, string> = {
    'Holding': 'HOLDING',
    'Preparing Exit': 'PREPARING_EXIT',
    'Under LOI': 'UNDER_LOI',
    'Partial Exit': 'PARTIAL_EXIT',
    'Exited': 'EXITED',
    'Written Off': 'WRITTEN_OFF',
}

const EXIT_TYPE_DISPLAY: Record<string, string> = {
    STRATEGIC_SALE: 'Strategic Sale',
    FINANCIAL_SALE: 'Financial Sale',
    IPO: 'IPO',
    RECAPITALIZATION: 'Recapitalization',
    MANAGEMENT_BUYOUT: 'Management Buyout',
    MERGER: 'Merger',
    LIQUIDATION: 'Liquidation',
    WRITE_OFF: 'Write Off',
}

// Validation schema
const createPortfolioCompanySchema = z.object({
    fundId: z.string().min(1, 'Fund is required'),
    name: z.string().min(1, 'Company name is required'),
    description: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    headquarters: z.string().optional(),
    acquisitionDate: z.string().min(1, 'Acquisition date is required'),
    entryValuation: z.string().min(1, 'Entry valuation is required'),
    entryRevenue: z.string().optional(),
    entryEbitda: z.string().optional(),
    equityInvested: z.string().min(1, 'Equity invested is required'),
    debtFinancing: z.string().optional(),
    ownershipPct: z.string().min(1, 'Ownership percentage is required'),
    ceoName: z.string().optional(),
    ceoEmail: z.string().optional(),
    investmentThesis: z.string().optional(),
})

// Types
export interface PortfolioCompanyListItem {
    id: string
    name: string
    industry: string | null
    fundName: string
    acquisitionDate: Date
    entryValuation: string
    currentValuation: string | null
    equityInvested: string
    ownershipPct: string
    moic: string | null
    irr: string | null
    status: string
}

export interface PortfolioCompanyDetail {
    id: string
    name: string
    legalName: string | null
    description: string | null
    website: string | null
    industry: string | null
    subIndustry: string | null
    businessModel: string | null
    headquarters: string | null
    city: string | null
    state: string | null
    country: string
    fundId: string
    fundName: string
    dealId: string | null
    acquisitionDate: Date
    exitDate: Date | null
    holdingPeriodMonths: number
    entryValuation: string
    entryRevenue: string | null
    entryEbitda: string | null
    entryMultiple: string | null
    equityInvested: string
    debtFinancing: string | null
    totalInvestment: string
    ownershipPct: string
    status: string
    exitValuation: string | null
    exitType: string | null
    exitBuyer: string | null
    realizedValue: string | null
    unrealizedValue: string | null
    totalValue: string | null
    moic: string | null
    irr: string | null
    ceoName: string | null
    ceoEmail: string | null
    ceoPhone: string | null
    boardSeats: number | null
    investmentThesis: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    latestMetrics: {
        periodDate: Date
        revenue: string | null
        revenueGrowth: string | null
        ebitda: string | null
        ebitdaMargin: string | null
        employeeCount: number | null
        currentValuation: string | null
    } | null
}

// Helper to format decimal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMoney(value: any): string {
    if (!value) return '$0'
    return `$${Number(value).toLocaleString()}`
}

// Helper to format percentage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPercent(value: any): string {
    if (!value) return '0%'
    return `${(Number(value) * 100).toFixed(1)}%`
}

// Helper to format multiple
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMultiple(value: any): string {
    if (!value) return '-'
    return `${Number(value).toFixed(2)}x`
}

// Helper to parse money string
function parseMoney(value: string): number {
    if (!value) return 0
    return parseFloat(value.replace(/[$,]/g, '')) || 0
}

// Helper to parse percent (e.g., "85" -> 0.85)
function parsePercent(value: string): number {
    if (!value) return 0
    const num = parseFloat(value.replace(/%/g, ''))
    return num > 1 ? num / 100 : num
}

// Calculate holding period in months
function calculateHoldingPeriod(acquisitionDate: Date, exitDate?: Date | null): number {
    const endDate = exitDate || new Date()
    const months = (endDate.getFullYear() - acquisitionDate.getFullYear()) * 12 +
        (endDate.getMonth() - acquisitionDate.getMonth())
    return Math.max(1, months)
}

// Get all portfolio companies
export async function getPortfolioCompanies(): Promise<PortfolioCompanyListItem[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    const companies = await prisma.portfolioCompany.findMany({
        orderBy: { acquisitionDate: 'desc' },
        include: {
            fund: {
                select: { name: true },
            },
            metrics: {
                orderBy: { periodDate: 'desc' },
                take: 1,
                select: {
                    currentValuation: true,
                },
            },
        },
    })

    return companies.map((company) => ({
        id: company.id,
        name: company.name,
        industry: company.industry,
        fundName: company.fund.name,
        acquisitionDate: company.acquisitionDate,
        entryValuation: formatMoney(company.entryValuation),
        currentValuation: company.metrics[0]?.currentValuation
            ? formatMoney(company.metrics[0].currentValuation)
            : company.unrealizedValue
                ? formatMoney(company.unrealizedValue)
                : null,
        equityInvested: formatMoney(company.equityInvested),
        ownershipPct: formatPercent(company.ownershipPct),
        moic: company.moic ? formatMultiple(company.moic) : null,
        irr: company.irr ? formatPercent(company.irr) : null,
        status: STATUS_DISPLAY[company.status] || company.status,
    }))
}

// Get single portfolio company
export async function getPortfolioCompany(id: string): Promise<PortfolioCompanyDetail | null> {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const company = await prisma.portfolioCompany.findUnique({
        where: { id },
        include: {
            fund: {
                select: { name: true },
            },
            metrics: {
                orderBy: { periodDate: 'desc' },
                take: 1,
            },
        },
    })

    if (!company) {
        return null
    }

    const holdingPeriodMonths = calculateHoldingPeriod(company.acquisitionDate, company.exitDate)
    const latestMetric = company.metrics[0]

    return {
        id: company.id,
        name: company.name,
        legalName: company.legalName,
        description: company.description,
        website: company.website,
        industry: company.industry,
        subIndustry: company.subIndustry,
        businessModel: company.businessModel,
        headquarters: company.headquarters,
        city: company.city,
        state: company.state,
        country: company.country,
        fundId: company.fundId,
        fundName: company.fund.name,
        dealId: company.dealId,
        acquisitionDate: company.acquisitionDate,
        exitDate: company.exitDate,
        holdingPeriodMonths,
        entryValuation: formatMoney(company.entryValuation),
        entryRevenue: company.entryRevenue ? formatMoney(company.entryRevenue) : null,
        entryEbitda: company.entryEbitda ? formatMoney(company.entryEbitda) : null,
        entryMultiple: company.entryMultiple ? formatMultiple(company.entryMultiple) : null,
        equityInvested: formatMoney(company.equityInvested),
        debtFinancing: company.debtFinancing ? formatMoney(company.debtFinancing) : null,
        totalInvestment: formatMoney(company.totalInvestment),
        ownershipPct: formatPercent(company.ownershipPct),
        status: STATUS_DISPLAY[company.status] || company.status,
        exitValuation: company.exitValuation ? formatMoney(company.exitValuation) : null,
        exitType: company.exitType ? EXIT_TYPE_DISPLAY[company.exitType] || company.exitType : null,
        exitBuyer: company.exitBuyer,
        realizedValue: company.realizedValue ? formatMoney(company.realizedValue) : null,
        unrealizedValue: company.unrealizedValue ? formatMoney(company.unrealizedValue) : null,
        totalValue: company.totalValue ? formatMoney(company.totalValue) : null,
        moic: company.moic ? formatMultiple(company.moic) : null,
        irr: company.irr ? formatPercent(company.irr) : null,
        ceoName: company.ceoName,
        ceoEmail: company.ceoEmail,
        ceoPhone: company.ceoPhone,
        boardSeats: company.boardSeats,
        investmentThesis: company.investmentThesis,
        notes: company.notes,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        latestMetrics: latestMetric
            ? {
                periodDate: latestMetric.periodDate,
                revenue: latestMetric.revenue ? formatMoney(latestMetric.revenue) : null,
                revenueGrowth: latestMetric.revenueGrowth ? formatPercent(latestMetric.revenueGrowth) : null,
                ebitda: latestMetric.ebitda ? formatMoney(latestMetric.ebitda) : null,
                ebitdaMargin: latestMetric.ebitdaMargin ? formatPercent(latestMetric.ebitdaMargin) : null,
                employeeCount: latestMetric.employeeCount,
                currentValuation: latestMetric.currentValuation ? formatMoney(latestMetric.currentValuation) : null,
            }
            : null,
    }
}

// Create portfolio company
export async function createPortfolioCompany(formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        fundId: formData.get('fundId') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        industry: formData.get('industry') as string || undefined,
        website: formData.get('website') as string || undefined,
        headquarters: formData.get('headquarters') as string || undefined,
        acquisitionDate: formData.get('acquisitionDate') as string,
        entryValuation: formData.get('entryValuation') as string,
        entryRevenue: formData.get('entryRevenue') as string || undefined,
        entryEbitda: formData.get('entryEbitda') as string || undefined,
        equityInvested: formData.get('equityInvested') as string,
        debtFinancing: formData.get('debtFinancing') as string || undefined,
        ownershipPct: formData.get('ownershipPct') as string,
        ceoName: formData.get('ceoName') as string || undefined,
        ceoEmail: formData.get('ceoEmail') as string || undefined,
        investmentThesis: formData.get('investmentThesis') as string || undefined,
    }

    const validated = createPortfolioCompanySchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data

    try {
        const equityInvested = parseMoney(data.equityInvested)
        const debtFinancing = data.debtFinancing ? parseMoney(data.debtFinancing) : 0
        const totalInvestment = equityInvested + debtFinancing
        const entryValuation = parseMoney(data.entryValuation)
        const entryEbitda = data.entryEbitda ? parseMoney(data.entryEbitda) : null
        const entryMultiple = entryEbitda && entryEbitda > 0 ? entryValuation / entryEbitda : null

        const company = await prisma.portfolioCompany.create({
            data: {
                fundId: data.fundId,
                name: data.name,
                description: data.description || null,
                industry: data.industry || null,
                website: data.website || null,
                headquarters: data.headquarters || null,
                acquisitionDate: new Date(data.acquisitionDate),
                entryValuation,
                entryRevenue: data.entryRevenue ? parseMoney(data.entryRevenue) : null,
                entryEbitda,
                entryMultiple,
                equityInvested,
                debtFinancing: debtFinancing || null,
                totalInvestment,
                ownershipPct: parsePercent(data.ownershipPct),
                ceoName: data.ceoName || null,
                ceoEmail: data.ceoEmail || null,
                investmentThesis: data.investmentThesis || null,
                status: 'HOLDING',
                unrealizedValue: entryValuation * parsePercent(data.ownershipPct),
                totalValue: entryValuation * parsePercent(data.ownershipPct),
                moic: 1.0, // Initial MOIC is 1.0x
            },
        })

        revalidatePath('/portfolio')
        redirect(`/portfolio/${company.id}`)
    } catch (error) {
        console.error('Error creating portfolio company:', error)
        return { error: 'Failed to create portfolio company' }
    }
}

// Update portfolio company status
export async function updatePortfolioCompanyStatus(id: string, status: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const dbStatus = DISPLAY_TO_STATUS[status] || status

    try {
        await prisma.portfolioCompany.update({
            where: { id },
            data: { status: dbStatus as any },
        })

        revalidatePath('/portfolio')
        revalidatePath(`/portfolio/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating portfolio company status:', error)
        return { error: 'Failed to update status' }
    }
}

// Update portfolio company valuation
export async function updatePortfolioValuation(
    id: string,
    currentValuation: number,
    notes?: string
) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    try {
        const company = await prisma.portfolioCompany.findUnique({
            where: { id },
        })

        if (!company) {
            return { error: 'Company not found' }
        }

        // Calculate new MOIC
        const equityValue = currentValuation * Number(company.ownershipPct)
        const moic = equityValue / Number(company.equityInvested)

        // Update company
        await prisma.portfolioCompany.update({
            where: { id },
            data: {
                unrealizedValue: equityValue,
                totalValue: equityValue + Number(company.realizedValue || 0),
                moic,
            },
        })

        // Create a metric entry for this valuation update
        await prisma.portfolioMetric.create({
            data: {
                companyId: id,
                periodDate: new Date(),
                periodType: 'QUARTERLY',
                currentValuation,
                notes,
            },
        })

        revalidatePath('/portfolio')
        revalidatePath(`/portfolio/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating valuation:', error)
        return { error: 'Failed to update valuation' }
    }
}

// Record metrics for a portfolio company
export async function recordPortfolioMetrics(formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const companyId = formData.get('companyId') as string
    const periodDate = formData.get('periodDate') as string
    const periodType = formData.get('periodType') as string || 'QUARTERLY'

    try {
        await prisma.portfolioMetric.create({
            data: {
                companyId,
                periodDate: new Date(periodDate),
                periodType: periodType as any,
                revenue: formData.get('revenue') ? parseMoney(formData.get('revenue') as string) : null,
                ebitda: formData.get('ebitda') ? parseMoney(formData.get('ebitda') as string) : null,
                netIncome: formData.get('netIncome') ? parseMoney(formData.get('netIncome') as string) : null,
                employeeCount: formData.get('employeeCount') ? parseInt(formData.get('employeeCount') as string) : null,
                currentValuation: formData.get('currentValuation') ? parseMoney(formData.get('currentValuation') as string) : null,
                highlights: formData.get('highlights') as string || null,
                concerns: formData.get('concerns') as string || null,
                notes: formData.get('notes') as string || null,
            },
        })

        // Update company valuation if provided
        const currentValuation = formData.get('currentValuation')
        if (currentValuation) {
            await updatePortfolioValuation(companyId, parseMoney(currentValuation as string))
        }

        revalidatePath('/portfolio')
        revalidatePath(`/portfolio/${companyId}`)
        return { success: true }
    } catch (error) {
        console.error('Error recording metrics:', error)
        return { error: 'Failed to record metrics' }
    }
}

// Get metrics history for a company
export async function getPortfolioMetrics(companyId: string) {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    const metrics = await prisma.portfolioMetric.findMany({
        where: { companyId },
        orderBy: { periodDate: 'desc' },
    })

    return metrics.map((m) => ({
        id: m.id,
        periodDate: m.periodDate,
        periodType: m.periodType,
        revenue: m.revenue ? formatMoney(m.revenue) : null,
        revenueGrowth: m.revenueGrowth ? formatPercent(m.revenueGrowth) : null,
        ebitda: m.ebitda ? formatMoney(m.ebitda) : null,
        ebitdaMargin: m.ebitdaMargin ? formatPercent(m.ebitdaMargin) : null,
        employeeCount: m.employeeCount,
        currentValuation: m.currentValuation ? formatMoney(m.currentValuation) : null,
        highlights: m.highlights,
        concerns: m.concerns,
        notes: m.notes,
    }))
}

// Delete portfolio company
export async function deletePortfolioCompany(id: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    try {
        await prisma.portfolioCompany.delete({
            where: { id },
        })

        revalidatePath('/portfolio')
        redirect('/portfolio')
    } catch (error) {
        console.error('Error deleting portfolio company:', error)
        return { error: 'Failed to delete portfolio company' }
    }
}

// Get available funds for portfolio companies
export async function getFundsForPortfolio(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    const funds = await prisma.fund.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    })

    return funds
}

// Get portfolio summary stats
export async function getPortfolioSummary() {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const companies = await prisma.portfolioCompany.findMany({
        where: {
            status: { not: 'WRITTEN_OFF' },
        },
    })

    const totalInvested = companies.reduce((sum, c) => sum + Number(c.equityInvested), 0)
    const totalValue = companies.reduce((sum, c) => sum + Number(c.totalValue || 0), 0)
    const realizedValue = companies.reduce((sum, c) => sum + Number(c.realizedValue || 0), 0)
    const unrealizedValue = companies.reduce((sum, c) => sum + Number(c.unrealizedValue || 0), 0)

    const activeCount = companies.filter((c) => c.status === 'HOLDING').length
    const exitedCount = companies.filter((c) => c.status === 'EXITED').length

    const portfolioMoic = totalInvested > 0 ? totalValue / totalInvested : 0

    return {
        totalCompanies: companies.length,
        activeCompanies: activeCount,
        exitedCompanies: exitedCount,
        totalInvested: formatMoney(totalInvested),
        totalValue: formatMoney(totalValue),
        realizedValue: formatMoney(realizedValue),
        unrealizedValue: formatMoney(unrealizedValue),
        portfolioMoic: formatMultiple(portfolioMoic),
    }
}
