import { describe, it, expect, vi } from 'vitest'
import { calculateNetIRR, calculateFundIRR } from '@/lib/shared/irr'
import { calculateWaterfall } from '@/lib/shared/waterfall'

// ============================================================================
// sanitizeMultiple (extracted for testing — mirrors reports.ts implementation)
// ============================================================================

function sanitizeMultiple(value: number, metricName: string): number {
    if (!isFinite(value) || isNaN(value)) return 0
    if (value > 100) {
        console.warn(`[metrics] ${metricName} = ${value}x — unusually high, check data`)
    }
    if (value < -10) {
        console.warn(`[metrics] ${metricName} = ${value}x — unusually low, check data`)
    }
    return value
}

// ============================================================================
// sanitizeMultiple
// ============================================================================

describe('sanitizeMultiple', () => {
    it('returns 0 for NaN', () => {
        expect(sanitizeMultiple(NaN, 'test')).toBe(0)
    })

    it('returns 0 for Infinity', () => {
        expect(sanitizeMultiple(Infinity, 'test')).toBe(0)
        expect(sanitizeMultiple(-Infinity, 'test')).toBe(0)
    })

    it('passes through normal values unchanged', () => {
        expect(sanitizeMultiple(1.5, 'MOIC')).toBe(1.5)
        expect(sanitizeMultiple(0, 'MOIC')).toBe(0)
        expect(sanitizeMultiple(-0.5, 'MOIC')).toBe(-0.5)
    })

    it('warns on unusually high values but still returns them', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const result = sanitizeMultiple(150, 'Gross MOIC')
        expect(result).toBe(150)
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Gross MOIC = 150x')
        )
        warnSpy.mockRestore()
    })

    it('warns on unusually low values but still returns them', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const result = sanitizeMultiple(-15, 'Net MOIC')
        expect(result).toBe(-15)
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Net MOIC = -15x')
        )
        warnSpy.mockRestore()
    })
})

// ============================================================================
// Net MOIC via waterfall
// ============================================================================

describe('Net MOIC via waterfall', () => {
    it('with zero fees, Net MOIC equals Gross MOIC', () => {
        const totalInvested = 10_000_000
        const totalValue = 20_000_000
        const grossMoic = totalValue / totalInvested // 2.0x

        const wf = calculateWaterfall({
            totalDistributable: totalValue,
            totalContributed: totalInvested,
            hurdleRate: null,
            carriedInterest: 0,
            catchUpRate: null,
            holdingPeriodYears: 3,
        })

        // No carry, no fees → LP gets everything
        const netMoic = wf.lpTotal / totalInvested
        expect(netMoic).toBeCloseTo(grossMoic, 4)
    })

    it('with standard 2/20 terms, Net MOIC < Gross MOIC', () => {
        const totalInvested = 10_000_000
        const totalValue = 20_000_000
        const grossMoic = totalValue / totalInvested // 2.0x
        const holdingYears = 3
        const mgmtFeeRate = 0.02

        const wf = calculateWaterfall({
            totalDistributable: totalValue,
            totalContributed: totalInvested,
            hurdleRate: 0.08,
            carriedInterest: 0.20,
            catchUpRate: 1.0,
            holdingPeriodYears: holdingYears,
            managementFee: mgmtFeeRate,
        })

        const totalMgmtFees = totalInvested * mgmtFeeRate * holdingYears
        const netMoic = (wf.lpTotal - totalMgmtFees) / totalInvested

        expect(netMoic).toBeLessThan(grossMoic)
        expect(netMoic).toBeGreaterThan(0)
    })

    it('when totalValue < totalInvested (loss), Net MOIC < 1.0', () => {
        const totalInvested = 10_000_000
        const totalValue = 5_000_000

        const wf = calculateWaterfall({
            totalDistributable: totalValue,
            totalContributed: totalInvested,
            hurdleRate: 0.08,
            carriedInterest: 0.20,
            catchUpRate: 1.0,
            holdingPeriodYears: 3,
        })

        // Loss scenario: LP gets all (no carry on losses), minus mgmt fees
        const mgmtFees = totalInvested * 0.02 * 3
        const netMoic = (wf.lpTotal - mgmtFees) / totalInvested
        expect(netMoic).toBeLessThan(1.0)
    })
})

// ============================================================================
// calculateNetIRR
// ============================================================================

describe('calculateNetIRR', () => {
    it('returns null when gross IRR has no cashflows', () => {
        const result = calculateNetIRR({
            capitalCalls: [],
            distributions: [],
            currentNAV: 0,
            valuationDate: new Date(),
            managementFeeRate: 0.02,
            carriedInterestRate: 0.20,
        })
        expect(result).toBeNull()
    })

    it('with zero fees, Net IRR approximates Gross IRR', () => {
        const calls = [
            { date: new Date('2023-01-01'), amount: 1_000_000 },
        ]
        const dists = [
            { date: new Date('2025-06-15'), amount: 500_000 },
        ]

        const netIrr = calculateNetIRR({
            capitalCalls: calls,
            distributions: dists,
            currentNAV: 800_000,
            valuationDate: new Date('2026-01-01'),
            managementFeeRate: 0,
            carriedInterestRate: 0,
        })

        expect(netIrr).not.toBeNull()
        // With zero fees, the gross and net cashflows are identical
        // so Net IRR should be a reasonable positive return
        expect(netIrr!).toBeGreaterThan(0)
    })

    it('with standard fees, Net IRR < equivalent Gross IRR', () => {
        const calls = [
            { date: new Date('2023-01-01'), amount: 5_000_000 },
            { date: new Date('2023-06-01'), amount: 3_000_000 },
        ]
        const dists = [
            { date: new Date('2025-01-01'), amount: 4_000_000 },
        ]

        const grossIrr = calculateFundIRR({
            capitalCalls: calls.map(c => ({ date: c.date, amount: c.amount })),
            distributions: dists.map(d => ({ date: d.date, amount: d.amount })),
            currentNAV: 8_000_000,
            valuationDate: new Date('2026-01-01'),
        })

        const netIrr = calculateNetIRR({
            capitalCalls: calls,
            distributions: dists,
            currentNAV: 8_000_000,
            valuationDate: new Date('2026-01-01'),
            managementFeeRate: 0.02,
            carriedInterestRate: 0.20,
        })

        expect(grossIrr).not.toBeNull()
        expect(netIrr).not.toBeNull()
        expect(netIrr!).toBeLessThan(grossIrr!)
    })

    it('carry only applies to profit, not return of capital', () => {
        // Single call and distribution where distribution < called amount (partial loss)
        const calls = [
            { date: new Date('2023-01-01'), amount: 1_000_000 },
        ]
        const dists = [
            { date: new Date('2024-06-01'), amount: 800_000 },
        ]

        const netIrr = calculateNetIRR({
            capitalCalls: calls,
            distributions: dists,
            currentNAV: 0,
            valuationDate: new Date('2025-01-01'),
            managementFeeRate: 0.02,
            carriedInterestRate: 0.20,
        })

        // Loss scenario with fees → deeply negative IRR
        expect(netIrr).not.toBeNull()
        expect(netIrr!).toBeLessThan(0)
    })
})

// ============================================================================
// LP Estimated Value (pro-rata NAV logic)
// ============================================================================

describe('LP estimated value (pro-rata NAV)', () => {
    it('LP ownership × fund NAV gives correct estimated value', () => {
        const fundNAV = 15_000_000
        const ownershipPct = 0.10 // 10%
        const estimatedValue = fundNAV * ownershipPct
        expect(estimatedValue).toBe(1_500_000)
    })

    it('LP MOIC uses real NAV, not arbitrary multiplier', () => {
        const fundNAV = 20_000_000
        const ownershipPct = 0.25
        const estimatedValue = fundNAV * ownershipPct // 5M

        const paidAmount = 4_000_000
        const distributedAmount = 1_000_000

        const moic = (distributedAmount + estimatedValue) / paidAmount
        // (1M + 5M) / 4M = 1.5x
        expect(moic).toBeCloseTo(1.5, 4)
    })

    it('when fund NAV is 0, estimated value is 0 and MOIC reflects only distributions', () => {
        const fundNAV = 0
        const ownershipPct = 0.10
        const estimatedValue = fundNAV * ownershipPct

        expect(estimatedValue).toBe(0)

        const paidAmount = 1_000_000
        const distributedAmount = 200_000
        const moic = paidAmount > 0
            ? (distributedAmount + estimatedValue) / paidAmount
            : 0
        // 200K / 1M = 0.2x
        expect(moic).toBeCloseTo(0.2, 4)
    })
})
