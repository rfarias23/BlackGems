/**
 * PE Waterfall Distribution Calculator
 *
 * Implements the standard 4-tier PE distribution waterfall:
 *   1. Return of Capital      — 100% to LP
 *   2. Preferred Return       — 100% to LP (compounded hurdle)
 *   3. GP Catch-Up            — catch-up % to GP until GP reaches carry %
 *   4. Carried Interest Split — carry % to GP, rest to LP
 *
 * Pure TypeScript, no external dependencies.
 *
 * Usage:
 *   const result = calculateWaterfall({
 *     totalDistributable: 15_000_000,
 *     totalContributed:   10_000_000,
 *     hurdleRate:         0.08,
 *     carriedInterest:    0.20,
 *     catchUpRate:        1.00,
 *     holdingPeriodYears: 3,
 *   })
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WaterfallParams {
  /** Total amount available for distribution */
  totalDistributable: number
  /** Total capital contributed by LPs */
  totalContributed: number
  /** Annual preferred return (hurdle) as a decimal (e.g. 0.08 = 8%). Null/0 = no hurdle */
  hurdleRate: number | null
  /** GP's carried interest share (e.g. 0.20 = 20%) */
  carriedInterest: number
  /** Catch-up rate: fraction of distributions going to GP during catch-up (e.g. 1.0 = 100%, 0.80 = 80%). Null = skip catch-up */
  catchUpRate: number | null
  /** Years of investment for compounding the preferred return */
  holdingPeriodYears: number
  /** Management fee rate for net IRR calculation (optional) */
  managementFee?: number
}

export interface WaterfallTier {
  name: string
  lpAmount: number
  gpAmount: number
  totalAmount: number
}

export interface WaterfallResult {
  tiers: WaterfallTier[]
  lpTotal: number
  gpTotal: number
  totalDistributed: number
  /** GP carry as a percentage of total profit */
  effectiveCarryPct: number | null
  /** LP multiple on contributed capital */
  lpMultiple: number
}

// ---------------------------------------------------------------------------
// Core Waterfall Calculator
// ---------------------------------------------------------------------------

/**
 * Calculates the standard 4-tier PE waterfall distribution.
 */
export function calculateWaterfall(params: WaterfallParams): WaterfallResult {
  const {
    totalDistributable,
    totalContributed,
    hurdleRate,
    carriedInterest,
    catchUpRate,
    holdingPeriodYears,
  } = params

  // If nothing to distribute
  if (totalDistributable <= 0 || totalContributed <= 0) {
    return {
      tiers: [],
      lpTotal: 0,
      gpTotal: 0,
      totalDistributed: 0,
      effectiveCarryPct: null,
      lpMultiple: 0,
    }
  }

  const tiers: WaterfallTier[] = []
  let remaining = totalDistributable
  let lpTotal = 0
  let gpTotal = 0

  // ---- Tier 1: Return of Capital (100% LP) ----
  const tier1Amount = Math.min(remaining, totalContributed)
  tiers.push({
    name: 'Return of Capital',
    lpAmount: tier1Amount,
    gpAmount: 0,
    totalAmount: tier1Amount,
  })
  lpTotal += tier1Amount
  remaining -= tier1Amount

  if (remaining <= 0) {
    return buildResult(tiers, lpTotal, gpTotal, totalDistributed(tiers), totalContributed)
  }

  // ---- Tier 2: Preferred Return (100% LP) ----
  const effectiveHurdle = hurdleRate && hurdleRate > 0 ? hurdleRate : 0
  let preferredReturn = 0

  if (effectiveHurdle > 0 && holdingPeriodYears > 0) {
    // Compound preferred return: Capital × ((1 + hurdle)^years − 1)
    preferredReturn =
      totalContributed * (Math.pow(1 + effectiveHurdle, holdingPeriodYears) - 1)
  }

  const tier2Amount = Math.min(remaining, preferredReturn)
  if (tier2Amount > 0) {
    tiers.push({
      name: 'Preferred Return',
      lpAmount: tier2Amount,
      gpAmount: 0,
      totalAmount: tier2Amount,
    })
    lpTotal += tier2Amount
    remaining -= tier2Amount
  }

  if (remaining <= 0) {
    return buildResult(tiers, lpTotal, gpTotal, totalDistributed(tiers), totalContributed)
  }

  // ---- Tier 3: GP Catch-Up ----
  // GP receives catchUpRate% of distributions until GP has received
  // carriedInterest% of total profits (Tier 2 + Tier 3 + Tier 4 profits)
  const effectiveCatchUp = catchUpRate != null ? catchUpRate : 0

  if (effectiveCatchUp > 0 && carriedInterest > 0) {
    // Total profits so far = tier2Amount (pref return already distributed to LP)
    // GP target: carry% of (pref return + catch-up + remaining)
    // At end of catch-up: GP should have carry%/(1-carry%) × LP's profit share from Tier 2
    // Simplified: GP catch-up amount = (carry / (1 - carry)) × preferredReturn
    // But capped by what's available and the catch-up rate
    const gpTargetFromPref = (carriedInterest / (1 - carriedInterest)) * tier2Amount

    // If catch-up is 100%, all goes to GP; if 80%, 80% GP / 20% LP
    const catchUpTotal = effectiveCatchUp > 0
      ? Math.min(remaining, gpTargetFromPref / effectiveCatchUp)
      : 0

    if (catchUpTotal > 0) {
      const gpCatchUp = catchUpTotal * effectiveCatchUp
      const lpCatchUp = catchUpTotal - gpCatchUp

      tiers.push({
        name: 'GP Catch-Up',
        lpAmount: lpCatchUp,
        gpAmount: gpCatchUp,
        totalAmount: catchUpTotal,
      })
      lpTotal += lpCatchUp
      gpTotal += gpCatchUp
      remaining -= catchUpTotal
    }
  }

  if (remaining <= 0) {
    return buildResult(tiers, lpTotal, gpTotal, totalDistributed(tiers), totalContributed)
  }

  // ---- Tier 4: Carried Interest Split ----
  // Remaining split: carry% to GP, (1 - carry%) to LP
  const gpCarry = remaining * carriedInterest
  const lpShare = remaining - gpCarry

  tiers.push({
    name: 'Carried Interest',
    lpAmount: lpShare,
    gpAmount: gpCarry,
    totalAmount: remaining,
  })
  lpTotal += lpShare
  gpTotal += gpCarry

  return buildResult(tiers, lpTotal, gpTotal, totalDistributed(tiers), totalContributed)
}

// ---------------------------------------------------------------------------
// Investor-level waterfall (pro-rata)
// ---------------------------------------------------------------------------

/**
 * Calculates a single investor's share of the waterfall distribution.
 *
 * @param params     Full waterfall parameters
 * @param ownershipPct  Investor's ownership as a decimal (e.g. 0.25 = 25%)
 */
export function calculateInvestorWaterfall(
  params: WaterfallParams,
  ownershipPct: number
): WaterfallResult {
  const fullResult = calculateWaterfall(params)

  const tiers = fullResult.tiers.map((tier) => ({
    name: tier.name,
    lpAmount: tier.lpAmount * ownershipPct,
    gpAmount: tier.gpAmount, // GP amounts are not pro-rated by LP ownership
    totalAmount: tier.lpAmount * ownershipPct + tier.gpAmount,
  }))

  const lpTotal = fullResult.lpTotal * ownershipPct
  const gpTotal = fullResult.gpTotal
  const distributed = lpTotal + gpTotal

  return {
    tiers,
    lpTotal,
    gpTotal,
    totalDistributed: distributed,
    effectiveCarryPct: fullResult.effectiveCarryPct,
    lpMultiple: params.totalContributed * ownershipPct > 0
      ? lpTotal / (params.totalContributed * ownershipPct)
      : 0,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function totalDistributed(tiers: WaterfallTier[]): number {
  return tiers.reduce((sum, t) => sum + t.totalAmount, 0)
}

function buildResult(
  tiers: WaterfallTier[],
  lpTotal: number,
  gpTotal: number,
  distributed: number,
  contributed: number
): WaterfallResult {
  const totalProfit = distributed - contributed
  const effectiveCarryPct =
    totalProfit > 0 && gpTotal > 0 ? gpTotal / totalProfit : null

  return {
    tiers,
    lpTotal,
    gpTotal,
    totalDistributed: distributed,
    effectiveCarryPct,
    lpMultiple: contributed > 0 ? lpTotal / contributed : 0,
  }
}
