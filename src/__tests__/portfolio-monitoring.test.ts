import { describe, it, expect } from 'vitest'
import {
    computePeriodOverPeriodChange,
    aggregatePortfolioMetrics,
    computeValuationChanges,
} from '@/lib/shared/portfolio-monitoring-utils'
import fs from 'fs'
import path from 'path'

// ============================================================================
// Pure utility function tests
// ============================================================================

describe('computePeriodOverPeriodChange', () => {
    it('computes positive percentage change correctly', () => {
        // From 100 to 120 = +20%
        expect(computePeriodOverPeriodChange(120, 100)).toBe(20)
    })

    it('computes negative percentage change correctly', () => {
        // From 100 to 80 = -20%
        expect(computePeriodOverPeriodChange(80, 100)).toBe(-20)
    })

    it('returns null when prior is zero', () => {
        expect(computePeriodOverPeriodChange(100, 0)).toBeNull()
    })

    it('returns null when prior is null', () => {
        expect(computePeriodOverPeriodChange(100, null)).toBeNull()
    })

    it('returns null when current is null', () => {
        expect(computePeriodOverPeriodChange(null, 100)).toBeNull()
    })

    it('returns 0 when values are identical', () => {
        expect(computePeriodOverPeriodChange(500, 500)).toBe(0)
    })

    it('handles large percentage increases', () => {
        // From 10 to 110 = +1000%
        expect(computePeriodOverPeriodChange(110, 10)).toBe(1000)
    })

    it('handles negative prior values using absolute value', () => {
        // From -100 to -50: change = (-50 - (-100)) / |-100| * 100 = 50%
        expect(computePeriodOverPeriodChange(-50, -100)).toBe(50)
    })

    it('handles fractional changes', () => {
        // From 200 to 210 = +5%
        expect(computePeriodOverPeriodChange(210, 200)).toBeCloseTo(5, 10)
    })
})

describe('aggregatePortfolioMetrics', () => {
    const makeCompany = (overrides: Partial<{
        equityInvested: number
        totalValue: number | null
        realizedValue: number | null
        unrealizedValue: number | null
        moic: number | null
        status: string
    }> = {}) => ({
        equityInvested: 1000000,
        totalValue: 1500000,
        realizedValue: 0,
        unrealizedValue: 1500000,
        moic: 1.5,
        status: 'HOLDING',
        ...overrides,
    })

    it('returns fund-level portfolio summary', () => {
        const companies = [
            makeCompany({ equityInvested: 2000000, totalValue: 3000000 }),
            makeCompany({ equityInvested: 1000000, totalValue: 1200000 }),
        ]
        const result = aggregatePortfolioMetrics(companies)

        expect(result.totalCompanies).toBe(2)
        expect(result.activeCompanies).toBe(2)
        expect(result.totalInvested).toBe(3000000)
        expect(result.totalCurrentValue).toBe(4200000)
        expect(result.portfolioMoic).toBeCloseTo(1.4, 2)
    })

    it('excludes EXITED companies from active metrics', () => {
        const companies = [
            makeCompany({ equityInvested: 2000000, totalValue: 4000000, status: 'HOLDING' }),
            makeCompany({ equityInvested: 1000000, totalValue: 2000000, status: 'EXITED' }),
        ]
        const result = aggregatePortfolioMetrics(companies)

        expect(result.totalCompanies).toBe(2)
        expect(result.activeCompanies).toBe(1)
        expect(result.totalInvested).toBe(2000000)
        expect(result.totalCurrentValue).toBe(4000000)
        expect(result.portfolioMoic).toBe(2)
    })

    it('excludes WRITTEN_OFF companies from active metrics', () => {
        const companies = [
            makeCompany({ equityInvested: 1000000, totalValue: 1500000, status: 'HOLDING' }),
            makeCompany({ equityInvested: 500000, totalValue: 0, status: 'WRITTEN_OFF' }),
        ]
        const result = aggregatePortfolioMetrics(companies)

        expect(result.activeCompanies).toBe(1)
        expect(result.totalInvested).toBe(1000000)
    })

    it('handles empty portfolio', () => {
        const result = aggregatePortfolioMetrics([])

        expect(result.totalCompanies).toBe(0)
        expect(result.activeCompanies).toBe(0)
        expect(result.totalInvested).toBe(0)
        expect(result.portfolioMoic).toBe(0)
    })

    it('handles null totalValue gracefully', () => {
        const companies = [
            makeCompany({ equityInvested: 1000000, totalValue: null }),
        ]
        const result = aggregatePortfolioMetrics(companies)

        expect(result.totalInvested).toBe(1000000)
        expect(result.totalCurrentValue).toBe(0)
        expect(result.portfolioMoic).toBe(0)
    })

    it('calculates period-over-period changes', () => {
        // Testing through aggregatePortfolioMetrics that MOIC is (totalValue / totalInvested)
        const companies = [
            makeCompany({ equityInvested: 500000, totalValue: 750000 }),
            makeCompany({ equityInvested: 500000, totalValue: 600000 }),
        ]
        const result = aggregatePortfolioMetrics(companies)

        // MOIC = 1350000 / 1000000 = 1.35
        expect(result.portfolioMoic).toBeCloseTo(1.35, 2)
    })

    it('accumulates realized and unrealized values separately', () => {
        const companies = [
            makeCompany({
                equityInvested: 1000000,
                totalValue: 2000000,
                realizedValue: 500000,
                unrealizedValue: 1500000,
            }),
            makeCompany({
                equityInvested: 2000000,
                totalValue: 3000000,
                realizedValue: 1000000,
                unrealizedValue: 2000000,
            }),
        ]
        const result = aggregatePortfolioMetrics(companies)

        expect(result.totalRealizedValue).toBe(1500000)
        expect(result.totalUnrealizedValue).toBe(3500000)
    })
})

describe('computeValuationChanges', () => {
    it('first valuation has null change', () => {
        const result = computeValuationChanges([
            { value: 5000000, date: new Date('2024-01-01') },
        ])

        expect(result).toHaveLength(1)
        expect(result[0].value).toBe(5000000)
        expect(result[0].changePercent).toBeNull()
    })

    it('computes sequential percentage changes', () => {
        const result = computeValuationChanges([
            { value: 5000000, date: new Date('2024-01-01') },
            { value: 6000000, date: new Date('2024-06-01') },
            { value: 5400000, date: new Date('2025-01-01') },
        ])

        expect(result).toHaveLength(3)
        expect(result[0].changePercent).toBeNull()
        expect(result[1].changePercent).toBe(20) // 5M -> 6M = +20%
        expect(result[2].changePercent).toBeCloseTo(-10, 2) // 6M -> 5.4M = -10%
    })

    it('handles empty array', () => {
        const result = computeValuationChanges([])
        expect(result).toHaveLength(0)
    })

    it('handles two identical valuations', () => {
        const result = computeValuationChanges([
            { value: 1000000, date: new Date('2024-01-01') },
            { value: 1000000, date: new Date('2024-06-01') },
        ])

        expect(result[1].changePercent).toBe(0)
    })
})

// ============================================================================
// Server action structural tests
// ============================================================================

describe('portfolio monitoring server actions', () => {
    const actionsPath = path.join(
        process.cwd(),
        'src/lib/actions/portfolio-monitoring.ts'
    )

    it('file exists and is a server action module', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        expect(src).toMatch(/^'use server'/)
    })

    it('getPortfolioKPITrends has auth + fund access + Zod validation', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        expect(src).toContain('export async function getPortfolioKPITrends')
        expect(src).toContain("!session?.user?.id")
        expect(src).toContain('requireFundAccess')
        expect(src).toContain('metricNameSchema.safeParse')
    })

    it('getPortfolioMonitoringSummary has auth + fund access', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        expect(src).toContain('export async function getPortfolioMonitoringSummary')
        expect(src).toContain("!session?.user?.id")
        expect(src).toContain('requireFundAccess')
    })

    it('createValuation has auth + fund access + Zod + audit logging', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        expect(src).toContain('export async function createValuation')
        expect(src).toContain("!session?.user?.id")
        expect(src).toContain('requireFundAccess')
        expect(src).toContain('createValuationSchema.safeParse')
        expect(src).toContain('logAudit')
        expect(src).toContain("action: 'CREATE'")
        expect(src).toContain("entityType: 'Valuation'")
        expect(src).toContain('revalidatePath')
    })

    it('getValuationHistory has auth + fund access', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        expect(src).toContain('export async function getValuationHistory')
        expect(src).toContain("!session?.user?.id")
        expect(src).toContain('requireFundAccess')
    })

    it('uses notDeleted filter for soft-delete compliance', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        // notDeleted should appear in company lookups
        expect(src).toContain('...notDeleted')
    })

    it('converts Prisma Decimal values with Number()', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        expect(src).toContain('Number(')
    })

    it('uses .issues[0]?.message for Zod errors (not .errors)', () => {
        const src = fs.readFileSync(actionsPath, 'utf-8')
        expect(src).toContain('.issues[0]?.message')
        expect(src).not.toContain('.errors[0]')
    })
})
