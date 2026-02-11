import { describe, it, expect } from 'vitest'
import {
  calculateIRR,
  calculateFundIRR,
  calculateCompanyIRR,
} from '../irr'

// Helper: assert IRR is close to expected value
function expectIRR(result: number | null, expected: number, tolerance = 0.005) {
  expect(result).not.toBeNull()
  expect(result!).toBeCloseTo(expected, 2)
}

// ---------------------------------------------------------------------------
// calculateIRR — Core XIRR
// ---------------------------------------------------------------------------

describe('calculateIRR', () => {
  it('returns null for empty cash flows', () => {
    expect(calculateIRR([])).toBeNull()
  })

  it('returns null for a single cash flow', () => {
    expect(
      calculateIRR([{ date: new Date('2023-01-01'), amount: -1000 }])
    ).toBeNull()
  })

  it('returns null when all flows are negative', () => {
    expect(
      calculateIRR([
        { date: new Date('2023-01-01'), amount: -1000 },
        { date: new Date('2024-01-01'), amount: -500 },
      ])
    ).toBeNull()
  })

  it('returns null when all flows are positive', () => {
    expect(
      calculateIRR([
        { date: new Date('2023-01-01'), amount: 1000 },
        { date: new Date('2024-01-01'), amount: 500 },
      ])
    ).toBeNull()
  })

  it('calculates ~0% IRR for breakeven (1yr)', () => {
    const result = calculateIRR([
      { date: new Date('2023-01-01'), amount: -1000 },
      { date: new Date('2024-01-01'), amount: 1000 },
    ])
    expectIRR(result, 0.0, 0.01)
  })

  it('calculates ~100% IRR for 1yr 2x return', () => {
    const result = calculateIRR([
      { date: new Date('2023-01-01'), amount: -1000 },
      { date: new Date('2024-01-01'), amount: 2000 },
    ])
    expectIRR(result, 1.0, 0.02) // 100% ≈ 1.0
  })

  it('calculates IRR for a simple PE scenario', () => {
    // Invest $10M, receive $2M after 1yr, $5M after 2yr, $8M after 3yr
    const result = calculateIRR([
      { date: new Date('2021-01-01'), amount: -10_000_000 },
      { date: new Date('2022-01-01'), amount: 2_000_000 },
      { date: new Date('2023-01-01'), amount: 5_000_000 },
      { date: new Date('2024-01-01'), amount: 8_000_000 },
    ])
    // Total returned = $15M on $10M in 3 years
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(0.1)
    expect(result!).toBeLessThan(0.5)
  })

  it('calculates negative IRR for a loss', () => {
    const result = calculateIRR([
      { date: new Date('2023-01-01'), amount: -1000 },
      { date: new Date('2024-01-01'), amount: 500 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeLessThan(0) // loss → negative IRR
  })

  it('handles multiple investments and returns', () => {
    const result = calculateIRR([
      { date: new Date('2022-01-01'), amount: -5_000_000 },
      { date: new Date('2022-07-01'), amount: -3_000_000 },
      { date: new Date('2023-06-01'), amount: 1_000_000 },
      { date: new Date('2024-01-01'), amount: 4_000_000 },
      { date: new Date('2024-06-01'), amount: 6_000_000 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(0)
  })

  it('handles unsorted cash flows', () => {
    const result = calculateIRR([
      { date: new Date('2024-01-01'), amount: 2000 },
      { date: new Date('2023-01-01'), amount: -1000 },
    ])
    expectIRR(result, 1.0, 0.02) // Same as sorted
  })

  it('calculates correctly with very high returns', () => {
    // 10x in 1 year
    const result = calculateIRR([
      { date: new Date('2023-01-01'), amount: -1000 },
      { date: new Date('2024-01-01'), amount: 10000 },
    ])
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(8) // ~900% IRR
  })
})

// ---------------------------------------------------------------------------
// calculateFundIRR
// ---------------------------------------------------------------------------

describe('calculateFundIRR', () => {
  it('returns null when no capital calls', () => {
    expect(
      calculateFundIRR({
        capitalCalls: [],
        distributions: [{ date: new Date('2024-01-01'), amount: 1000 }],
      })
    ).toBeNull()
  })

  it('calculates IRR from capital calls and distributions', () => {
    const result = calculateFundIRR({
      capitalCalls: [
        { date: new Date('2022-01-01'), amount: 5_000_000 },
        { date: new Date('2022-06-01'), amount: 3_000_000 },
      ],
      distributions: [
        { date: new Date('2023-06-01'), amount: 4_000_000 },
        { date: new Date('2024-06-01'), amount: 8_000_000 },
      ],
    })
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(0)
  })

  it('includes current NAV as terminal value', () => {
    const resultWithoutNAV = calculateFundIRR({
      capitalCalls: [{ date: new Date('2023-01-01'), amount: 10_000_000 }],
      distributions: [{ date: new Date('2024-01-01'), amount: 5_000_000 }],
    })

    const resultWithNAV = calculateFundIRR({
      capitalCalls: [{ date: new Date('2023-01-01'), amount: 10_000_000 }],
      distributions: [{ date: new Date('2024-01-01'), amount: 5_000_000 }],
      currentNAV: 8_000_000,
      valuationDate: new Date('2024-06-01'),
    })

    // NAV should increase IRR since total returns are higher
    expect(resultWithNAV).not.toBeNull()
    expect(resultWithoutNAV).not.toBeNull()
    expect(resultWithNAV!).toBeGreaterThan(resultWithoutNAV!)
  })

  it('handles capital calls as absolute amounts', () => {
    // Both should work the same — amounts are made negative internally
    const result = calculateFundIRR({
      capitalCalls: [{ date: new Date('2023-01-01'), amount: 1000 }],
      distributions: [{ date: new Date('2024-01-01'), amount: 1500 }],
    })
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// calculateCompanyIRR
// ---------------------------------------------------------------------------

describe('calculateCompanyIRR', () => {
  it('returns null for zero investment', () => {
    expect(
      calculateCompanyIRR(new Date('2023-01-01'), 0, 1000)
    ).toBeNull()
  })

  it('returns null for zero current value', () => {
    expect(
      calculateCompanyIRR(new Date('2023-01-01'), 1000, 0)
    ).toBeNull()
  })

  it('calculates ~100% for 1yr 2x return', () => {
    const result = calculateCompanyIRR(
      new Date('2023-01-01'),
      1_000_000,
      2_000_000,
      new Date('2024-01-01')
    )
    expectIRR(result, 1.0, 0.02) // ~100%
  })

  it('calculates ~22% for 2yr 1.5x return', () => {
    const result = calculateCompanyIRR(
      new Date('2022-01-01'),
      1_000_000,
      1_500_000,
      new Date('2024-01-01')
    )
    // 1.5x in 2 years ≈ sqrt(1.5) - 1 ≈ 22.5%
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(0.20)
    expect(result!).toBeLessThan(0.25)
  })

  it('calculates negative IRR for a loss', () => {
    const result = calculateCompanyIRR(
      new Date('2023-01-01'),
      1_000_000,
      600_000,
      new Date('2024-01-01')
    )
    expect(result).not.toBeNull()
    expect(result!).toBeLessThan(0)
  })

  it('calculates 3yr hold with 3x return', () => {
    const result = calculateCompanyIRR(
      new Date('2021-01-01'),
      5_000_000,
      15_000_000,
      new Date('2024-01-01')
    )
    // 3x in 3 years ≈ 3^(1/3) - 1 ≈ 44%
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThan(0.40)
    expect(result!).toBeLessThan(0.50)
  })

  it('defaults valuationDate to now if not provided', () => {
    const result = calculateCompanyIRR(
      new Date('2023-01-01'),
      1_000_000,
      1_200_000
    )
    expect(result).not.toBeNull()
    // Should be positive since we're returning more than invested
    expect(result!).toBeGreaterThan(0)
  })
})
