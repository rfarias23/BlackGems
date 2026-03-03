import { ToolRegistry } from './registry'
import { getPipelineSummary } from './deals/get-pipeline-summary'
import { getDealDetails } from './deals/get-deal-details'
import { getFundFinancials } from './capital/get-fund-financials'
import { getInvestorDetails } from './investors/get-investor-details'
import { getPortfolioMetrics } from './portfolio/get-portfolio-metrics'
import { getCapitalCallSummary } from './capital/get-capital-call-summary'
import { getCapitalCallDetails } from './capital/get-capital-call-details'
import { getOverdueCallItems } from './capital/get-overdue-call-items'
import { getDistributionSummary } from './capital/get-distribution-summary'
import { getDistributionDetails } from './capital/get-distribution-details'

/**
 * Creates a ToolRegistry pre-loaded with all Phase 1 + Phase 1.5 read-only tools.
 * Tool objects are statically defined (metadata + Zod schemas don't change
 * between requests) so this is safe to call once at module scope.
 */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry()

  // Phase 1: Core read tools
  registry.register(getPipelineSummary)
  registry.register(getDealDetails)
  registry.register(getFundFinancials)
  registry.register(getInvestorDetails)
  registry.register(getPortfolioMetrics)

  // Phase 1.5 Batch 1: Capital call & distribution tools
  registry.register(getCapitalCallSummary)
  registry.register(getCapitalCallDetails)
  registry.register(getOverdueCallItems)
  registry.register(getDistributionSummary)
  registry.register(getDistributionDetails)

  return registry
}
