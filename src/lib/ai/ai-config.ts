import { createAnthropic } from '@ai-sdk/anthropic'

export const AI_CONFIG = {
  model: process.env.AI_MODEL || 'claude-sonnet-4-6-20250929',
  rateLimitPerHour: Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 30,
  rateLimitPerDay: Number(process.env.AI_RATE_LIMIT_PER_DAY) || 200,
  monthlyBudgetUSD: Number(process.env.AI_MONTHLY_BUDGET_USD) || 50,
  tokenBudget: 50_000,
  isEnabled: !!process.env.ANTHROPIC_API_KEY,
}

let _anthropicProvider: ReturnType<typeof createAnthropic> | null = null

export function getAnthropicProvider() {
  if (!_anthropicProvider) {
    _anthropicProvider = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return _anthropicProvider
}
