/**
 * Pure utility functions for portfolio monitoring calculations.
 * Extracted for testability — these have no server dependencies.
 */

/**
 * Computes the period-over-period percentage change between two numeric values.
 * Returns null if the prior value is zero or null (division by zero).
 */
export function computePeriodOverPeriodChange(
    current: number | null,
    prior: number | null
): number | null {
    if (prior === null || prior === 0 || current === null) {
        return null
    }
    return ((current - prior) / Math.abs(prior)) * 100
}

/**
 * Aggregates portfolio-level metrics from a set of portfolio companies.
 * Computes total invested, total current value, weighted MOIC, and count.
 * Excludes EXITED and WRITTEN_OFF companies from active portfolio summary.
 */
export function aggregatePortfolioMetrics(
    companies: Array<{
        equityInvested: number
        totalValue: number | null
        realizedValue: number | null
        unrealizedValue: number | null
        moic: number | null
        status: string
    }>
): {
    totalCompanies: number
    activeCompanies: number
    totalInvested: number
    totalCurrentValue: number
    totalRealizedValue: number
    totalUnrealizedValue: number
    portfolioMoic: number
} {
    const active = companies.filter(
        (c) => c.status !== 'EXITED' && c.status !== 'WRITTEN_OFF'
    )

    const totalInvested = active.reduce((sum, c) => sum + c.equityInvested, 0)
    const totalCurrentValue = active.reduce(
        (sum, c) => sum + (c.totalValue ?? 0),
        0
    )
    const totalRealizedValue = active.reduce(
        (sum, c) => sum + (c.realizedValue ?? 0),
        0
    )
    const totalUnrealizedValue = active.reduce(
        (sum, c) => sum + (c.unrealizedValue ?? 0),
        0
    )
    const portfolioMoic =
        totalInvested > 0 ? totalCurrentValue / totalInvested : 0

    return {
        totalCompanies: companies.length,
        activeCompanies: active.length,
        totalInvested,
        totalCurrentValue,
        totalRealizedValue,
        totalUnrealizedValue,
        portfolioMoic,
    }
}

/**
 * Computes valuation changes relative to the prior valuation in a time-ordered list.
 * Each entry gets a `changePercent` field showing the percentage change from the prior entry.
 */
export function computeValuationChanges(
    valuations: Array<{ value: number; date: Date }>
): Array<{ value: number; date: Date; changePercent: number | null }> {
    return valuations.map((v, i) => {
        const prior = i > 0 ? valuations[i - 1] : null
        const changePercent = prior
            ? computePeriodOverPeriodChange(v.value, prior.value)
            : null
        return {
            value: v.value,
            date: v.date,
            changePercent,
        }
    })
}
