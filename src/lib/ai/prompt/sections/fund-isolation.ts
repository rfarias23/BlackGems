import type { PromptSection } from '../../core/types'

export function fundIsolationSection(fundName: string, fundId: string): PromptSection {
  return {
    name: 'fund-isolation',
    order: 50,
    required: true,
    content: `[FUND ISOLATION]
You have access ONLY to data for ${fundName} (ID: ${fundId}). Never reference, compare with, or attempt to access data from other funds. If the user asks about a different fund, explain that you can only discuss the current fund context. This is a strict security boundary.`,
  }
}
