import { z } from 'zod'
import { type Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple, type CurrencyCode } from '@/lib/shared/formatters'

/**
 * Creates 5 read-only AI tools scoped to a single fund.
 * Every query is isolated by fundId (Layer 1) and filtered for soft deletes.
 * All monetary values are formatted with the fund's currency.
 */
export function createReadTools(fundId: string, currency: CurrencyCode) {
  return {
    getPipelineSummary: {
      description:
        'Get the current deal pipeline with counts by stage, total pipeline value, and active deal count.',
      parameters: z.object({}),
      execute: async () => {
        const deals = await prisma.deal.findMany({
          where: { fundId, ...notDeleted },
          select: {
            id: true,
            stage: true,
            status: true,
            askingPrice: true,
          },
        })

        const activeDeals = deals.filter((d) => d.status === 'ACTIVE')

        const byStage: Record<string, number> = {}
        for (const deal of deals) {
          byStage[deal.stage] = (byStage[deal.stage] ?? 0) + 1
        }

        const totalPipelineValue = activeDeals.reduce(
          (sum, d) => sum + (d.askingPrice ? Number(d.askingPrice) : 0),
          0
        )

        return {
          totalDeals: deals.length,
          activeDeals: activeDeals.length,
          byStage,
          totalPipelineValue: formatMoney(totalPipelineValue, currency),
        }
      },
    },

    getDealDetails: {
      description:
        'Get detailed information about a specific deal by name or ID. Use this when the user asks about a particular deal.',
      parameters: z.object({
        nameOrId: z.string().describe('The deal name (partial match supported) or deal ID'),
      }),
      execute: async ({ nameOrId }: { nameOrId: string }) => {
        // Try exact ID match first
        const byId = await prisma.deal.findFirst({
          where: { id: nameOrId, fundId, ...notDeleted },
        })

        const deal =
          byId ??
          (await prisma.deal.findFirst({
            where: {
              fundId,
              ...notDeleted,
              name: { contains: nameOrId, mode: 'insensitive' as const },
            },
          }))

        if (!deal) {
          return { error: 'Deal not found' }
        }

        return {
          id: deal.id,
          name: deal.name,
          companyName: deal.companyName,
          stage: deal.stage,
          status: deal.status,
          industry: deal.industry,
          askingPrice: formatMoney(deal.askingPrice ? Number(deal.askingPrice) : null, currency),
          revenue: formatMoney(deal.revenue ? Number(deal.revenue) : null, currency),
          ebitda: formatMoney(deal.ebitda ? Number(deal.ebitda) : null, currency),
          revenueMultiple: deal.revenueMultiple ? formatMultiple(Number(deal.revenueMultiple)) : null,
          ebitdaMultiple: deal.ebitdaMultiple ? formatMultiple(Number(deal.ebitdaMultiple)) : null,
          grossMargin: deal.grossMargin ? formatPercent(Number(deal.grossMargin)) : null,
          ebitdaMargin: deal.ebitdaMargin ? formatPercent(Number(deal.ebitdaMargin)) : null,
          employeeCount: deal.employeeCount,
          yearFounded: deal.yearFounded,
          location: [deal.city, deal.state, deal.country].filter(Boolean).join(', '),
          investmentThesis: deal.investmentThesis,
          keyRisks: deal.keyRisks,
          nextSteps: deal.nextSteps,
          expectedCloseDate: deal.expectedCloseDate?.toISOString().split('T')[0] ?? null,
        }
      },
    },

    getFundFinancials: {
      description:
        'Get the fund financial summary including total committed capital, called capital, distributed capital, and performance metrics.',
      parameters: z.object({}),
      execute: async () => {
        const fund = await prisma.fund.findUniqueOrThrow({
          where: { id: fundId },
          select: {
            name: true,
            targetSize: true,
            status: true,
          },
        })

        const commitmentAgg = await prisma.commitment.aggregate({
          where: { fundId, ...notDeleted },
          _sum: {
            committedAmount: true,
            calledAmount: true,
            paidAmount: true,
            distributedAmount: true,
          },
        })

        const portfolioCompanies = await prisma.portfolioCompany.findMany({
          where: { fundId, ...notDeleted },
          select: {
            equityInvested: true,
            moic: true,
            totalValue: true,
          },
        })

        const totalCommitted = Number(commitmentAgg._sum.committedAmount ?? 0)
        const totalCalled = Number(commitmentAgg._sum.calledAmount ?? 0)
        const totalPaid = Number(commitmentAgg._sum.paidAmount ?? 0)
        const totalDistributed = Number(commitmentAgg._sum.distributedAmount ?? 0)
        const paidInPct = totalCommitted > 0 ? totalPaid / totalCommitted : 0

        const totalEquityInvested = portfolioCompanies.reduce(
          (sum, pc) => sum + Number(pc.equityInvested),
          0
        )
        const weightedMoicSum = portfolioCompanies.reduce(
          (sum, pc) => sum + (pc.moic ? Number(pc.moic) * Number(pc.equityInvested) : 0),
          0
        )
        const totalMOIC = totalEquityInvested > 0 ? weightedMoicSum / totalEquityInvested : 0

        return {
          fundName: fund.name,
          fundStatus: fund.status,
          targetSize: formatMoney(Number(fund.targetSize), currency),
          totalCommitted: formatMoney(totalCommitted, currency),
          totalCalled: formatMoney(totalCalled, currency),
          totalPaid: formatMoney(totalPaid, currency),
          totalDistributed: formatMoney(totalDistributed, currency),
          paidInPct: formatPercent(paidInPct),
          portfolioCount: portfolioCompanies.length,
          totalMOIC: formatMultiple(totalMOIC),
        }
      },
    },

    getInvestorDetails: {
      description:
        'Get details about a specific investor/LP including their commitment, paid-in amount, and contact information.',
      parameters: z.object({
        nameOrId: z.string().describe('The investor name (partial match supported) or investor ID'),
      }),
      execute: async ({ nameOrId }: { nameOrId: string }) => {
        // Investors are accessed through commitments for fund isolation
        const commitment = await prisma.commitment.findFirst({
          where: {
            fundId,
            ...notDeleted,
            investor: {
              ...notDeleted,
              OR: [
                { id: nameOrId },
                { name: { contains: nameOrId, mode: 'insensitive' as const } },
              ],
            },
          },
          include: {
            investor: true,
          },
        })

        if (!commitment) {
          return { error: 'Investor not found in this fund' }
        }

        const investor = commitment.investor

        return {
          id: investor.id,
          name: investor.name,
          type: investor.type,
          status: investor.status,
          email: investor.email,
          contactName: investor.contactName,
          contactEmail: investor.contactEmail,
          committed: formatMoney(Number(commitment.committedAmount), currency),
          called: formatMoney(Number(commitment.calledAmount), currency),
          paidIn: formatMoney(Number(commitment.paidAmount), currency),
          distributed: formatMoney(Number(commitment.distributedAmount), currency),
          unfunded: formatMoney(
            Number(commitment.committedAmount) - Number(commitment.calledAmount),
            currency
          ),
          commitmentStatus: commitment.status,
          commitmentDate: commitment.commitmentDate?.toISOString().split('T')[0] ?? null,
        }
      },
    },

    getPortfolioMetrics: {
      description:
        'Get portfolio company metrics including revenue, EBITDA, margins, and performance data.',
      parameters: z.object({
        companyName: z
          .string()
          .optional()
          .describe('Optional company name to filter. If omitted, returns all portfolio companies.'),
      }),
      execute: async ({ companyName }: { companyName?: string }) => {
        const where: Prisma.PortfolioCompanyWhereInput = {
          fundId,
          ...notDeleted,
          ...(companyName
            ? { name: { contains: companyName, mode: 'insensitive' as const } }
            : {}),
        }

        const companies = await prisma.portfolioCompany.findMany({
          where,
          select: {
            id: true,
            name: true,
            status: true,
            industry: true,
            equityInvested: true,
            totalInvestment: true,
            moic: true,
            irr: true,
            totalValue: true,
            acquisitionDate: true,
            metrics: {
              orderBy: { periodDate: 'desc' },
              take: 1,
              select: {
                periodDate: true,
                periodType: true,
                revenue: true,
                revenueGrowth: true,
                ebitda: true,
                ebitdaMargin: true,
                grossMargin: true,
                netIncome: true,
                employeeCount: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        })

        return companies.map((co) => {
          const latestMetric = co.metrics[0] ?? null

          return {
            id: co.id,
            name: co.name,
            status: co.status,
            industry: co.industry,
            equityInvested: formatMoney(Number(co.equityInvested), currency),
            totalInvestment: formatMoney(Number(co.totalInvestment), currency),
            moic: co.moic ? formatMultiple(Number(co.moic)) : '-',
            irr: co.irr ? formatPercent(Number(co.irr)) : null,
            totalValue: co.totalValue ? formatMoney(Number(co.totalValue), currency) : null,
            acquisitionDate: co.acquisitionDate.toISOString().split('T')[0],
            latestMetrics: latestMetric
              ? {
                  period: latestMetric.periodDate.toISOString().split('T')[0],
                  periodType: latestMetric.periodType,
                  revenue: latestMetric.revenue
                    ? formatMoney(Number(latestMetric.revenue), currency)
                    : null,
                  ebitda: latestMetric.ebitda
                    ? formatMoney(Number(latestMetric.ebitda), currency)
                    : null,
                  ebitdaMargin: latestMetric.ebitdaMargin
                    ? formatPercent(Number(latestMetric.ebitdaMargin))
                    : null,
                  grossMargin: latestMetric.grossMargin
                    ? formatPercent(Number(latestMetric.grossMargin))
                    : null,
                  revenueGrowth: latestMetric.revenueGrowth
                    ? formatPercent(Number(latestMetric.revenueGrowth))
                    : null,
                  netIncome: latestMetric.netIncome
                    ? formatMoney(Number(latestMetric.netIncome), currency)
                    : null,
                  employeeCount: latestMetric.employeeCount,
                }
              : null,
          }
        })
      },
    },
  }
}
