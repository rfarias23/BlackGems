import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

import { calculateCost, trackAICost } from '../lib/ai/cost-tracker'
import { logAudit } from '@/lib/shared/audit'

describe('calculateCost', () => {
  it('calculates correct cost for 1000 input and 500 output tokens', () => {
    const result = calculateCost({
      inputTokens: 1000,
      outputTokens: 500,
      totalTokens: 1500,
    })

    // $3/1M input: 1000/1_000_000 * 3 = 0.003
    expect(result.inputCostUSD).toBe(0.003)
    // $15/1M output: 500/1_000_000 * 15 = 0.0075
    expect(result.outputCostUSD).toBe(0.0075)
    // Total rounded to 4 decimal places
    expect(result.totalCostUSD).toBe(0.0105)
  })

  it('returns zero cost for zero tokens', () => {
    const result = calculateCost({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    })

    expect(result.inputCostUSD).toBe(0)
    expect(result.outputCostUSD).toBe(0)
    expect(result.totalCostUSD).toBe(0)
  })

  it('calculates $18 total for 1M input and 1M output tokens', () => {
    const result = calculateCost({
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      totalTokens: 2_000_000,
    })

    expect(result.inputCostUSD).toBe(3)
    expect(result.outputCostUSD).toBe(15)
    expect(result.totalCostUSD).toBe(18)
  })

  it('rounds totalCostUSD to 4 decimal places', () => {
    // Pick values that produce a long decimal
    // 333 input: 333/1_000_000 * 3 = 0.000999
    // 111 output: 111/1_000_000 * 15 = 0.001665
    // Sum = 0.002664 => rounded to 4dp = 0.0027
    const result = calculateCost({
      inputTokens: 333,
      outputTokens: 111,
      totalTokens: 444,
    })

    const decimalPlaces = result.totalCostUSD.toString().split('.')[1]?.length ?? 0
    expect(decimalPlaces).toBeLessThanOrEqual(4)
    expect(result.totalCostUSD).toBe(
      Math.round((0.000999 + 0.001665) * 10000) / 10000
    )
  })
})

describe('trackAICost', () => {
  it('calls logAudit with correct parameters', () => {
    const usage = {
      inputTokens: 2000,
      outputTokens: 1000,
      totalTokens: 3000,
    }
    const cost = calculateCost(usage)

    trackAICost('user-123', 'fund-456', usage)

    expect(logAudit).toHaveBeenCalledWith({
      userId: 'user-123',
      action: 'CREATE',
      entityType: 'AIInteraction',
      entityId: 'fund-456',
      changes: {
        inputTokens: { old: null, new: 2000 },
        outputTokens: { old: null, new: 1000 },
        totalTokens: { old: null, new: 3000 },
        costUSD: { old: null, new: cost.totalCostUSD },
        model: { old: null, new: process.env.AI_MODEL || 'claude-sonnet-4-6' },
      },
    })
  })
})
