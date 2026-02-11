import { describe, it, expect } from 'vitest'
import {
  calculateWaterfall,
  calculateInvestorWaterfall,
} from '../waterfall'

// ---------------------------------------------------------------------------
// calculateWaterfall
// ---------------------------------------------------------------------------

describe('calculateWaterfall', () => {
  it('returns empty result for zero distributable', () => {
    const result = calculateWaterfall({
      totalDistributable: 0,
      totalContributed: 10_000_000,
      hurdleRate: 0.08,
      carriedInterest: 0.20,
      catchUpRate: 1.0,
      holdingPeriodYears: 3,
    })
    expect(result.tiers).toHaveLength(0)
    expect(result.lpTotal).toBe(0)
    expect(result.gpTotal).toBe(0)
  })

  it('returns only Tier 1 when distribution < contributed', () => {
    const result = calculateWaterfall({
      totalDistributable: 5_000_000,
      totalContributed: 10_000_000,
      hurdleRate: 0.08,
      carriedInterest: 0.20,
      catchUpRate: 1.0,
      holdingPeriodYears: 3,
    })
    expect(result.tiers).toHaveLength(1)
    expect(result.tiers[0].name).toBe('Return of Capital')
    expect(result.tiers[0].lpAmount).toBe(5_000_000)
    expect(result.tiers[0].gpAmount).toBe(0)
    expect(result.lpTotal).toBe(5_000_000)
    expect(result.gpTotal).toBe(0)
  })

  it('returns Tier 1 + Tier 2 when distribution covers capital + partial pref return', () => {
    const contributed = 10_000_000
    const hurdleRate = 0.08
    const years = 3
    // Pref return = 10M × ((1.08)^3 - 1) ≈ $2,597,120
    const prefReturn = contributed * (Math.pow(1 + hurdleRate, years) - 1)

    const result = calculateWaterfall({
      totalDistributable: contributed + prefReturn * 0.5, // Only half pref return
      totalContributed: contributed,
      hurdleRate,
      carriedInterest: 0.20,
      catchUpRate: 1.0,
      holdingPeriodYears: years,
    })

    expect(result.tiers).toHaveLength(2)
    expect(result.tiers[0].name).toBe('Return of Capital')
    expect(result.tiers[0].lpAmount).toBe(contributed)
    expect(result.tiers[1].name).toBe('Preferred Return')
    expect(result.tiers[1].lpAmount).toBeCloseTo(prefReturn * 0.5, 0)
    expect(result.gpTotal).toBe(0)
  })

  it('calculates full 4-tier waterfall with 80/20 carry', () => {
    const contributed = 10_000_000
    const distributable = 15_000_000 // 1.5x MOIC
    const hurdleRate = 0.08
    const carry = 0.20
    const catchUp = 1.0
    const years = 3

    const result = calculateWaterfall({
      totalDistributable: distributable,
      totalContributed: contributed,
      hurdleRate,
      carriedInterest: carry,
      catchUpRate: catchUp,
      holdingPeriodYears: years,
    })

    // Should have all 4 tiers
    expect(result.tiers.length).toBeGreaterThanOrEqual(3)

    // Tier 1: Return of Capital
    expect(result.tiers[0].name).toBe('Return of Capital')
    expect(result.tiers[0].lpAmount).toBe(contributed)

    // Tier 2: Preferred Return (8% compounded over 3 years)
    const expectedPref = contributed * (Math.pow(1 + hurdleRate, years) - 1)
    expect(result.tiers[1].name).toBe('Preferred Return')
    expect(result.tiers[1].lpAmount).toBeCloseTo(expectedPref, -2)

    // Total should equal distributable
    expect(result.totalDistributed).toBeCloseTo(distributable, 0)

    // LP should get majority, GP gets carry
    expect(result.lpTotal).toBeGreaterThan(result.gpTotal)
    expect(result.gpTotal).toBeGreaterThan(0)

    // LP + GP should equal total
    expect(result.lpTotal + result.gpTotal).toBeCloseTo(distributable, 0)
  })

  it('calculates waterfall with no hurdle rate', () => {
    const result = calculateWaterfall({
      totalDistributable: 15_000_000,
      totalContributed: 10_000_000,
      hurdleRate: null,
      carriedInterest: 0.20,
      catchUpRate: null,
      holdingPeriodYears: 3,
    })

    // With no hurdle: Tier 1 (return capital) + Tier 4 (carry split on profits)
    expect(result.tiers.length).toBeGreaterThanOrEqual(2)
    expect(result.tiers[0].name).toBe('Return of Capital')
    expect(result.tiers[0].lpAmount).toBe(10_000_000)

    // Profit = $5M → GP gets 20% = $1M, LP gets 80% = $4M
    const lastTier = result.tiers[result.tiers.length - 1]
    expect(lastTier.name).toBe('Carried Interest')
    expect(lastTier.gpAmount).toBeCloseTo(1_000_000, -1)
    expect(lastTier.lpAmount).toBeCloseTo(4_000_000, -1)
  })

  it('calculates waterfall with no catch-up', () => {
    const result = calculateWaterfall({
      totalDistributable: 15_000_000,
      totalContributed: 10_000_000,
      hurdleRate: 0.08,
      carriedInterest: 0.20,
      catchUpRate: null,
      holdingPeriodYears: 3,
    })

    // Should have: Return of Capital + Preferred Return + Carried Interest (no catch-up tier)
    const tierNames = result.tiers.map((t) => t.name)
    expect(tierNames).not.toContain('GP Catch-Up')
    expect(tierNames).toContain('Return of Capital')
    expect(tierNames).toContain('Preferred Return')
    expect(tierNames).toContain('Carried Interest')
  })

  it('calculates effective carry percentage', () => {
    const result = calculateWaterfall({
      totalDistributable: 15_000_000,
      totalContributed: 10_000_000,
      hurdleRate: null,
      carriedInterest: 0.20,
      catchUpRate: null,
      holdingPeriodYears: 3,
    })

    // With no hurdle: profit = $5M, GP gets 20% = $1M
    // Effective carry = $1M / $5M = 20%
    expect(result.effectiveCarryPct).toBeCloseTo(0.20, 2)
  })

  it('calculates LP multiple correctly', () => {
    const result = calculateWaterfall({
      totalDistributable: 20_000_000,
      totalContributed: 10_000_000,
      hurdleRate: null,
      carriedInterest: 0.20,
      catchUpRate: null,
      holdingPeriodYears: 3,
    })

    // Total profit = $10M, GP carry = 20% of $10M = $2M, LP gets $18M
    // LP multiple = $18M / $10M = 1.80x
    expect(result.lpMultiple).toBeCloseTo(1.80, 1)
  })

  it('handles exact breakeven', () => {
    const result = calculateWaterfall({
      totalDistributable: 10_000_000,
      totalContributed: 10_000_000,
      hurdleRate: 0.08,
      carriedInterest: 0.20,
      catchUpRate: 1.0,
      holdingPeriodYears: 3,
    })

    expect(result.tiers).toHaveLength(1)
    expect(result.tiers[0].name).toBe('Return of Capital')
    expect(result.lpTotal).toBe(10_000_000)
    expect(result.gpTotal).toBe(0)
    expect(result.lpMultiple).toBeCloseTo(1.0, 2)
  })
})

// ---------------------------------------------------------------------------
// calculateInvestorWaterfall
// ---------------------------------------------------------------------------

describe('calculateInvestorWaterfall', () => {
  it('calculates pro-rata LP share', () => {
    const params = {
      totalDistributable: 15_000_000,
      totalContributed: 10_000_000,
      hurdleRate: null as number | null,
      carriedInterest: 0.20,
      catchUpRate: null as number | null,
      holdingPeriodYears: 3,
    }

    const fullResult = calculateWaterfall(params)
    const investor25 = calculateInvestorWaterfall(params, 0.25) // 25% LP

    // Investor LP total should be 25% of full LP total
    expect(investor25.lpTotal).toBeCloseTo(fullResult.lpTotal * 0.25, 0)
  })

  it('calculates correct LP multiple for investor', () => {
    const result = calculateInvestorWaterfall(
      {
        totalDistributable: 20_000_000,
        totalContributed: 10_000_000,
        hurdleRate: null,
        carriedInterest: 0.20,
        catchUpRate: null,
        holdingPeriodYears: 3,
      },
      0.10 // 10% ownership
    )

    // LP multiple should be same as full waterfall LP multiple (pro-rata preserves ratio)
    // LP gets 80% of $10M profit + $10M capital = $18M
    // 10% of $18M = $1.8M on 10% of $10M = $1M → 1.8x
    expect(result.lpMultiple).toBeCloseTo(1.80, 1)
  })

  it('handles small ownership percentages', () => {
    const result = calculateInvestorWaterfall(
      {
        totalDistributable: 15_000_000,
        totalContributed: 10_000_000,
        hurdleRate: 0.08,
        carriedInterest: 0.20,
        catchUpRate: 1.0,
        holdingPeriodYears: 3,
      },
      0.01 // 1% ownership
    )

    expect(result.lpTotal).toBeGreaterThan(0)
    expect(result.tiers.length).toBeGreaterThan(0)
  })
})
