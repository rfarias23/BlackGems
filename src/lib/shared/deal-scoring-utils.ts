/**
 * Pure utility functions for deal scoring logic.
 * Extracted for testability — no server-side dependencies.
 */

interface DealScoresInput {
  attractivenessScore: number
  fitScore: number
  riskScore: number
}

/**
 * Validates that all three scores are integers between 1 and 10.
 * Returns an error message string if invalid, null if valid.
 */
export function validateDealScores(scores: DealScoresInput): string | null {
  const { attractivenessScore, fitScore, riskScore } = scores

  for (const [label, value] of [
    ['Attractiveness', attractivenessScore],
    ['Fit', fitScore],
    ['Risk', riskScore],
  ] as const) {
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      return `${label} score must be an integer between 1 and 10`
    }
  }

  return null
}

/**
 * Computes a weighted composite score from three axes.
 * Weights: Attractiveness 40%, Fit 35%, Risk 25%.
 * Returns null if all three inputs are null.
 * For partially scored deals, uses only the available scores with
 * their weights re-normalized.
 */
export function computeCompositeScore(
  attractiveness: number | null,
  fit: number | null,
  risk: number | null
): number | null {
  const entries: { value: number; weight: number }[] = []

  if (attractiveness !== null) entries.push({ value: attractiveness, weight: 0.4 })
  if (fit !== null) entries.push({ value: fit, weight: 0.35 })
  if (risk !== null) entries.push({ value: risk, weight: 0.25 })

  if (entries.length === 0) return null

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  const weightedSum = entries.reduce((sum, e) => sum + e.value * e.weight, 0)

  return Math.round((weightedSum / totalWeight) * 10) / 10
}

/**
 * Returns a Tailwind text color class based on the score value.
 *   8-10 = emerald (strong)
 *   5-7  = amber (moderate)
 *   1-4  = red (weak)
 */
export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-500'
  if (score >= 5) return 'text-amber-500'
  return 'text-red-400'
}
