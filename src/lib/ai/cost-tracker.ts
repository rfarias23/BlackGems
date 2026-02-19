import { logAudit } from '@/lib/shared/audit'

const PRICING_PER_MILLION = {
  input: 3,
  output: 15,
} as const

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

interface CostBreakdown {
  inputCostUSD: number
  outputCostUSD: number
  totalCostUSD: number
}

/**
 * Calculates the USD cost for a given token usage.
 * Based on Claude Sonnet pricing: $3/1M input, $15/1M output.
 */
export function calculateCost(usage: TokenUsage): CostBreakdown {
  const inputCostUSD = (usage.inputTokens / 1_000_000) * PRICING_PER_MILLION.input
  const outputCostUSD = (usage.outputTokens / 1_000_000) * PRICING_PER_MILLION.output
  return {
    inputCostUSD,
    outputCostUSD,
    totalCostUSD: Math.round((inputCostUSD + outputCostUSD) * 10000) / 10000,
  }
}

/**
 * Logs AI interaction cost to the audit trail. Fire-and-forget pattern:
 * errors are caught and logged, never blocking the response stream.
 */
export function trackAICost(
  userId: string,
  fundId: string,
  usage: TokenUsage
): void {
  const cost = calculateCost(usage)

  logAudit({
    userId,
    action: 'CREATE',
    entityType: 'AIInteraction',
    entityId: fundId,
    changes: {
      inputTokens: { old: null, new: usage.inputTokens },
      outputTokens: { old: null, new: usage.outputTokens },
      totalTokens: { old: null, new: usage.totalTokens },
      costUSD: { old: null, new: cost.totalCostUSD },
      model: { old: null, new: process.env.AI_MODEL || 'claude-sonnet-4-6' },
    },
  }).catch((error: unknown) => {
    console.error('Failed to track AI cost:', error)
  })
}
