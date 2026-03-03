import { ToolRegistry } from './registry'
import { getPipelineSummary } from './deals/get-pipeline-summary'
import { getDealDetails } from './deals/get-deal-details'
import { getFundFinancials } from './capital/get-fund-financials'
import { getInvestorDetails } from './investors/get-investor-details'
import { getPortfolioMetrics } from './portfolio/get-portfolio-metrics'

/**
 * Creates a ToolRegistry pre-loaded with all 5 Phase 1 read-only tools.
 * Tool objects are statically defined (metadata + Zod schemas don't change
 * between requests) so this is safe to call once at module scope.
 */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.register(getPipelineSummary)
  registry.register(getDealDetails)
  registry.register(getFundFinancials)
  registry.register(getInvestorDetails)
  registry.register(getPortfolioMetrics)
  return registry
}
