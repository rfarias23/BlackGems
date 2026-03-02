import type { PromptSection } from '../../core/types'
import type { FundContext } from '../../context/fund-context'
import type { UserContext } from '../../context/user-context'
import type { CurrencyCode } from '@/lib/shared/formatters'
import type { ToolRegistry } from '../../tools/registry'

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
}

export function formatUserContextBlock(user: UserContext): PromptSection {
  return {
    name: 'user-context',
    order: 30,
    required: true,
    content: `[USER CONTEXT]
Name: ${user.name}
Role: ${user.role}
User ID: ${user.id}`,
  }
}

export function formatFundContextBlock(ctx: FundContext, currency: CurrencyCode): PromptSection {
  const sym = CURRENCY_SYMBOLS[currency]

  if (!ctx.fund) {
    return {
      name: 'fund-context',
      order: 35,
      required: true,
      content: `[FUND CONTEXT]\nNo fund data available. Ask the user which fund they are working with.`,
    }
  }

  const dealLines = ctx.dealCounts.length > 0
    ? ctx.dealCounts.map((d) => `  ${d.stage}: ${d._count}`).join('\n')
    : '  No active deals.'

  const portfolioLines = ctx.portfolioSummary.length > 0
    ? ctx.portfolioSummary
        .map((pc) => {
          const moicStr = pc.moic !== null ? ` | MOIC: ${pc.moic.toFixed(2)}x` : ''
          return `  ${pc.name} (${pc.status}) - Equity: ${sym}${pc.equityInvested.toLocaleString()}${moicStr}`
        })
        .join('\n')
    : '  No portfolio companies.'

  const ccLines = ctx.recentCapitalCalls.length > 0
    ? ctx.recentCapitalCalls
        .map((cc) => {
          const dateStr = cc.callDate
            ? new Date(cc.callDate).toISOString().split('T')[0]
            : 'No date'
          return `  ${dateStr} | ${sym}${cc.totalAmount.toLocaleString()} | ${cc.status}`
        })
        .join('\n')
    : '  No capital calls issued.'

  return {
    name: 'fund-context',
    order: 35,
    required: true,
    content: `[FUND CONTEXT]
Fund: ${ctx.fund.name}
Type: ${ctx.fund.type.replace(/_/g, ' ')}
Status: ${ctx.fund.status}
Target Size: ${sym}${ctx.fund.targetSize.toLocaleString()}
Currency: ${currency}

Deal Pipeline:
${dealLines}

Investor Summary:
  Investors: ${ctx.investorSummary.investorCount}
  Total Committed: ${sym}${ctx.investorSummary.totalCommitted.toLocaleString()}
  Total Paid-In: ${sym}${ctx.investorSummary.totalPaid.toLocaleString()}
  Unfunded: ${sym}${(ctx.investorSummary.totalCommitted - ctx.investorSummary.totalPaid).toLocaleString()}

Portfolio Companies:
${portfolioLines}

Recent Capital Calls (last 3):
${ccLines}`,
  }
}

export function formatCurrencyBlock(currency: CurrencyCode): PromptSection {
  const sym = CURRENCY_SYMBOLS[currency]
  return {
    name: 'currency',
    order: 40,
    required: true,
    content: `[CURRENCY]
This fund operates in ${currency}. Always format monetary values with the ${sym} symbol and appropriate thousands separators. Use ${currency} conventions consistently. When presenting tables or comparisons, align decimal points.`,
  }
}

export function formatToolsBlock(registry: ToolRegistry): PromptSection {
  return {
    name: 'available-tools',
    order: 55,
    required: true,
    content: `[AVAILABLE TOOLS]
You have access to these read-only tools for querying fund data. Use them when the user asks questions that require current data beyond what is in your context:

${registry.generatePromptSection()}

When using tools:
- Prefer the most specific tool for the question.
- Combine tool results with your fund context for complete answers.
- If a tool returns no data, say so clearly rather than fabricating information.
- Never call tools speculatively. Only invoke when the user's question requires data you do not already have.`,
  }
}

export function formatGreetingBlock(user: UserContext, isFirstTime: boolean): PromptSection {
  if (isFirstTime) {
    return {
      name: 'greeting',
      order: 80,
      required: true,
      content: `[FIRST MESSAGE]
This is the user's first message in this conversation. Begin your response with a brief, professional greeting addressing them by name ("${user.name}"). Include a one-line summary of the fund's current state based on your context (status, committed capital, pipeline activity). Then address their question. Do not greet on subsequent messages.`,
    }
  }

  return {
    name: 'greeting',
    order: 80,
    required: true,
    content: `[CONTINUATION]
This is a continuing conversation. Do not greet. Address the question directly.`,
  }
}
