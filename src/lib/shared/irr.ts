/**
 * IRR (Internal Rate of Return) Calculator
 *
 * Implements XIRR using Newton-Raphson with bisection fallback.
 * Pure TypeScript, no external dependencies.
 *
 * Usage:
 *   const irr = calculateIRR([
 *     { date: new Date('2023-01-01'), amount: -1000000 },
 *     { date: new Date('2024-06-15'), amount: 500000 },
 *     { date: new Date('2025-01-01'), amount: 800000 },
 *   ])
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CashFlow {
  date: Date
  amount: number // Negative = outflow (investment), Positive = inflow (return)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 100
const TOLERANCE = 1e-10
const DAYS_PER_YEAR = 365.25

// ---------------------------------------------------------------------------
// Core XIRR
// ---------------------------------------------------------------------------

/**
 * Calculates the annualised Internal Rate of Return for irregular cash flows (XIRR).
 *
 * Uses Newton-Raphson for fast convergence, falling back to bisection if
 * Newton-Raphson diverges or oscillates.
 *
 * @returns annualised rate as a decimal (e.g. 0.15 = 15%), or null if no solution
 */
export function calculateIRR(cashFlows: CashFlow[]): number | null {
  // Guard: need at least 2 cash flows
  if (cashFlows.length < 2) return null

  // Guard: must have both positive and negative flows
  const hasNeg = cashFlows.some((cf) => cf.amount < 0)
  const hasPos = cashFlows.some((cf) => cf.amount > 0)
  if (!hasNeg || !hasPos) return null

  // Sort by date ascending
  const sorted = [...cashFlows].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  const t0 = sorted[0].date.getTime()

  // Year fractions from the first date
  const years = sorted.map(
    (cf) => (cf.date.getTime() - t0) / (DAYS_PER_YEAR * 86_400_000)
  )
  const amounts = sorted.map((cf) => cf.amount)

  // NPV and its derivative at rate r
  function npv(r: number): number {
    let sum = 0
    for (let i = 0; i < amounts.length; i++) {
      sum += amounts[i] / Math.pow(1 + r, years[i])
    }
    return sum
  }

  function dnpv(r: number): number {
    let sum = 0
    for (let i = 0; i < amounts.length; i++) {
      sum -= years[i] * amounts[i] / Math.pow(1 + r, years[i] + 1)
    }
    return sum
  }

  // ------ Newton-Raphson ------
  let rate = 0.1 // initial guess
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const f = npv(rate)
    const df = dnpv(rate)

    if (Math.abs(f) < TOLERANCE) {
      return rate
    }

    if (Math.abs(df) < 1e-14) break // derivative too small, switch to bisection

    const newRate = rate - f / df

    // Clamp to avoid runaway divergence
    if (newRate < -0.999) break
    if (newRate > 10) break
    if (!isFinite(newRate)) break

    rate = newRate
  }

  // ------ Bisection fallback ------
  let lo = -0.99
  let hi = 10.0

  // Verify bracket exists
  const fLo = npv(lo)
  const fHi = npv(hi)
  if (fLo * fHi > 0) return null // no sign change → no root

  for (let i = 0; i < MAX_ITERATIONS * 2; i++) {
    const mid = (lo + hi) / 2
    const fMid = npv(mid)

    if (Math.abs(fMid) < TOLERANCE || (hi - lo) / 2 < TOLERANCE) {
      return mid
    }

    if (fLo * fMid < 0) {
      hi = mid
    } else {
      lo = mid
    }
  }

  return null // no convergence
}

// ---------------------------------------------------------------------------
// Fund-level IRR
// ---------------------------------------------------------------------------

export interface FundCashFlows {
  capitalCalls: { date: Date; amount: number }[]
  distributions: { date: Date; amount: number }[]
  currentNAV?: number
  valuationDate?: Date
}

/**
 * Calculates fund-level IRR from capital calls, distributions, and current NAV.
 *
 * Capital calls are treated as outflows (negative) from the investor perspective.
 * Distributions and current NAV are inflows (positive).
 */
export function calculateFundIRR(params: FundCashFlows): number | null {
  const cashFlows: CashFlow[] = []

  // Capital calls → negative (investor puts money in)
  for (const call of params.capitalCalls) {
    cashFlows.push({ date: call.date, amount: -Math.abs(call.amount) })
  }

  // Distributions → positive (investor gets money back)
  for (const dist of params.distributions) {
    cashFlows.push({ date: dist.date, amount: Math.abs(dist.amount) })
  }

  // Current NAV as a terminal positive flow
  if (params.currentNAV && params.currentNAV > 0) {
    const valuationDate = params.valuationDate ?? new Date()
    cashFlows.push({ date: valuationDate, amount: params.currentNAV })
  }

  return calculateIRR(cashFlows)
}

// ---------------------------------------------------------------------------
// Company-level IRR
// ---------------------------------------------------------------------------

/**
 * Calculates IRR for a single portfolio company.
 *
 * @param investmentDate  When the equity was deployed
 * @param equityInvested  Total equity invested (positive number)
 * @param currentValue    Current total value or exit proceeds
 * @param valuationDate   Date of the current value (defaults to now)
 */
export function calculateCompanyIRR(
  investmentDate: Date,
  equityInvested: number,
  currentValue: number,
  valuationDate?: Date
): number | null {
  if (equityInvested <= 0 || currentValue <= 0) return null

  const cashFlows: CashFlow[] = [
    { date: investmentDate, amount: -equityInvested },
    { date: valuationDate ?? new Date(), amount: currentValue },
  ]

  return calculateIRR(cashFlows)
}

// ---------------------------------------------------------------------------
// LP-level IRR
// ---------------------------------------------------------------------------

export interface LPCashFlows {
  capitalCalls: { date: Date; amount: number }[]
  distributions: { date: Date; amount: number }[]
  currentNAV?: number
  valuationDate?: Date
}

/**
 * Calculates IRR for a single LP based on their capital calls and distributions.
 * Identical interface to fund IRR but scoped to one investor's flows.
 */
export function calculateLPIRR(params: LPCashFlows): number | null {
  return calculateFundIRR(params) // same logic, different scope
}
