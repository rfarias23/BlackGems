'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatMultiple } from '@/lib/shared/formatters'
import type { CurrencyCode } from '@/lib/shared/formatters'
import {
    computePeriodOverPeriodChange,
    aggregatePortfolioMetrics,
    computeValuationChanges,
} from '@/lib/shared/portfolio-monitoring-utils'

// ============================================================================
// Allowed metric names on PortfolioMetric (Decimal and Int fields only)
// ============================================================================

const ALLOWED_METRIC_NAMES = [
    'revenue',
    'revenueGrowth',
    'grossProfit',
    'grossMargin',
    'ebitda',
    'ebitdaMargin',
    'netIncome',
    'operatingCashFlow',
    'freeCashFlow',
    'cashBalance',
    'totalDebt',
    'netDebt',
    'employeeCount',
    'customerCount',
    'currentValuation',
    'evEbitda',
] as const

type AllowedMetricName = typeof ALLOWED_METRIC_NAMES[number]

// ============================================================================
// Zod schemas
// ============================================================================

const metricNameSchema = z.enum(
    ALLOWED_METRIC_NAMES as unknown as [string, ...string[]]
)

const createValuationSchema = z.object({
    date: z.string().min(1, 'Date is required'),
    value: z.number().positive('Value must be positive'),
    equityValue: z.number().positive('Equity value must be positive').optional(),
    methodology: z.string().min(1, 'Methodology is required'),
    revenueMultiple: z.number().positive().optional(),
    ebitdaMultiple: z.number().positive().optional(),
    isOfficial: z.boolean(),
    notes: z.string().optional(),
})

export type ValuationInput = z.infer<typeof createValuationSchema>

// ============================================================================
// KPI trend data point type
// ============================================================================

export interface KPITrendPoint {
    date: Date
    value: number
    change: number | null
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Returns KPI trend data for a specific metric of a portfolio company over time.
 * Queries PortfolioMetric records ordered by periodDate ASC and computes
 * period-over-period percentage changes.
 */
export async function getPortfolioKPITrends(
    companyId: string,
    metricName: string
): Promise<{ data: KPITrendPoint[] } | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    // Validate metric name
    const metricParsed = metricNameSchema.safeParse(metricName)
    if (!metricParsed.success) {
        return { error: `Invalid metric name: ${metricName}` }
    }
    const validMetric = metricParsed.data as AllowedMetricName

    try {
        // Get company to check fund access
        const company = await prisma.portfolioCompany.findFirst({
            where: { id: companyId, ...notDeleted },
            select: { fundId: true },
        })
        if (!company) {
            return { error: 'Company not found' }
        }

        try {
            await requireFundAccess(session.user.id, company.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        // Query metrics ordered by date ascending for trend
        const metrics = await prisma.portfolioMetric.findMany({
            where: { companyId },
            orderBy: { periodDate: 'asc' },
            select: {
                periodDate: true,
                [validMetric]: true,
            },
        })

        // Filter out records where the metric is null and build trend data
        const trendPoints: KPITrendPoint[] = []
        let priorValue: number | null = null

        for (const metric of metrics) {
            const rawValue = metric[validMetric as keyof typeof metric]
            if (rawValue === null || rawValue === undefined) {
                continue
            }

            const numericValue = Number(rawValue)
            const change = computePeriodOverPeriodChange(numericValue, priorValue)

            trendPoints.push({
                date: metric.periodDate,
                value: numericValue,
                change,
            })

            priorValue = numericValue
        }

        return { data: trendPoints }
    } catch (error) {
        console.error('Error fetching KPI trends:', error)
        return { error: 'Failed to fetch KPI trends' }
    }
}

/**
 * Returns a fund-level portfolio summary with aggregated metrics.
 * Computes total invested, total value, MOIC across all active portfolio companies.
 */
export async function getPortfolioMonitoringSummary(fundId: string): Promise<
    | {
          totalCompanies: number
          activeCompanies: number
          totalInvested: string
          totalCurrentValue: string
          totalRealizedValue: string
          totalUnrealizedValue: string
          portfolioMoic: string
      }
    | { error: string }
> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    try {
        await requireFundAccess(session.user.id, fundId)
    } catch {
        return { error: 'Access denied' }
    }

    try {
        const fund = await prisma.fund.findUnique({
            where: { id: fundId },
            select: { currency: true },
        })
        const currency = (fund?.currency ?? 'USD') as CurrencyCode

        const companies = await prisma.portfolioCompany.findMany({
            where: {
                fundId,
                ...notDeleted,
            },
            select: {
                equityInvested: true,
                totalValue: true,
                realizedValue: true,
                unrealizedValue: true,
                moic: true,
                status: true,
            },
        })

        const normalized = companies.map((c) => ({
            equityInvested: Number(c.equityInvested),
            totalValue: c.totalValue ? Number(c.totalValue) : null,
            realizedValue: c.realizedValue ? Number(c.realizedValue) : null,
            unrealizedValue: c.unrealizedValue ? Number(c.unrealizedValue) : null,
            moic: c.moic ? Number(c.moic) : null,
            status: c.status,
        }))

        const aggregated = aggregatePortfolioMetrics(normalized)

        return {
            totalCompanies: aggregated.totalCompanies,
            activeCompanies: aggregated.activeCompanies,
            totalInvested: formatMoney(aggregated.totalInvested, currency),
            totalCurrentValue: formatMoney(aggregated.totalCurrentValue, currency),
            totalRealizedValue: formatMoney(aggregated.totalRealizedValue, currency),
            totalUnrealizedValue: formatMoney(aggregated.totalUnrealizedValue, currency),
            portfolioMoic: formatMultiple(aggregated.portfolioMoic),
        }
    } catch (error) {
        console.error('Error fetching portfolio summary:', error)
        return { error: 'Failed to fetch portfolio summary' }
    }
}

/**
 * Creates a formal valuation record for a portfolio company.
 * Records the valuation methodology, multiples, and value.
 */
export async function createValuation(
    companyId: string,
    data: ValuationInput
): Promise<{ success: true; id: string } | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    // Validate input
    const parsed = createValuationSchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
    }

    try {
        // Get company to check fund access
        const company = await prisma.portfolioCompany.findFirst({
            where: { id: companyId, ...notDeleted },
            select: { fundId: true },
        })
        if (!company) {
            return { error: 'Company not found' }
        }

        try {
            await requireFundAccess(session.user.id, company.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        const valuation = await prisma.valuation.create({
            data: {
                companyId,
                date: new Date(parsed.data.date),
                value: parsed.data.value,
                equityValue: parsed.data.equityValue ?? null,
                methodology: parsed.data.methodology,
                revenueMultiple: parsed.data.revenueMultiple ?? null,
                ebitdaMultiple: parsed.data.ebitdaMultiple ?? null,
                isOfficial: parsed.data.isOfficial,
                notes: parsed.data.notes ?? null,
            },
        })

        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'Valuation',
            entityId: valuation.id,
        })

        revalidatePath(`/portfolio/${companyId}`)
        return { success: true, id: valuation.id }
    } catch (error) {
        console.error('Error creating valuation:', error)
        return { error: 'Failed to create valuation' }
    }
}

/**
 * Returns the valuation history for a portfolio company, ordered by date descending.
 * Each entry includes the percentage change from the prior valuation.
 */
export async function getValuationHistory(
    companyId: string
): Promise<
    | {
          data: Array<{
              id: string
              date: Date
              value: string
              equityValue: string | null
              methodology: string
              revenueMultiple: string | null
              ebitdaMultiple: string | null
              isOfficial: boolean
              notes: string | null
              changePercent: number | null
          }>
      }
    | { error: string }
> {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    try {
        // Get company to check fund access
        const company = await prisma.portfolioCompany.findFirst({
            where: { id: companyId, ...notDeleted },
            select: { fundId: true },
        })
        if (!company) {
            return { error: 'Company not found' }
        }

        try {
            await requireFundAccess(session.user.id, company.fundId)
        } catch {
            return { error: 'Access denied' }
        }

        const fund = await prisma.fund.findUnique({
            where: { id: company.fundId },
            select: { currency: true },
        })
        const currency = (fund?.currency ?? 'USD') as CurrencyCode

        const valuations = await prisma.valuation.findMany({
            where: { companyId },
            orderBy: { date: 'asc' },
        })

        // Compute changes in chronological order, then reverse for display
        const withChanges = computeValuationChanges(
            valuations.map((v) => ({
                value: Number(v.value),
                date: v.date,
            }))
        )

        // Build result in DESC order for display (most recent first)
        const reversedValuations = [...valuations].reverse()
        const reversedChanges = [...withChanges].reverse()

        const data = reversedValuations.map((v, i) => ({
            id: v.id,
            date: v.date,
            value: formatMoney(v.value, currency),
            equityValue: v.equityValue ? formatMoney(v.equityValue, currency) : null,
            methodology: v.methodology,
            revenueMultiple: v.revenueMultiple
                ? formatMultiple(v.revenueMultiple)
                : null,
            ebitdaMultiple: v.ebitdaMultiple
                ? formatMultiple(v.ebitdaMultiple)
                : null,
            isOfficial: v.isOfficial,
            notes: v.notes,
            changePercent: reversedChanges[i]?.changePercent ?? null,
        }))

        return { data }
    } catch (error) {
        console.error('Error fetching valuation history:', error)
        return { error: 'Failed to fetch valuation history' }
    }
}
