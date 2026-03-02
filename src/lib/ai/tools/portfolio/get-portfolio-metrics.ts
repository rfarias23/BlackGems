import { z } from 'zod'
import { type Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getPortfolioMetrics: ITool = {
  metadata: {
    name: 'getPortfolioMetrics',
    description:
      'Get portfolio company metrics including revenue, EBITDA, margins, and performance data.',
    category: 'portfolio',
  },
  inputSchema: z.object({
    companyName: z
      .string()
      .optional()
      .describe('Optional company name to filter. If omitted, returns all portfolio companies.'),
  }),
  async execute(input: { companyName?: string }, ctx) {
    const where: Prisma.PortfolioCompanyWhereInput = {
      fundId: ctx.fundId,
      ...notDeleted,
      ...(input.companyName
        ? { name: { contains: input.companyName, mode: 'insensitive' as const } }
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
        equityInvested: formatMoney(Number(co.equityInvested), ctx.currency),
        totalInvestment: formatMoney(Number(co.totalInvestment), ctx.currency),
        moic: co.moic ? formatMultiple(Number(co.moic)) : '-',
        irr: co.irr ? formatPercent(Number(co.irr)) : null,
        totalValue: co.totalValue ? formatMoney(Number(co.totalValue), ctx.currency) : null,
        acquisitionDate: co.acquisitionDate.toISOString().split('T')[0],
        latestMetrics: latestMetric
          ? {
              period: latestMetric.periodDate.toISOString().split('T')[0],
              periodType: latestMetric.periodType,
              revenue: latestMetric.revenue
                ? formatMoney(Number(latestMetric.revenue), ctx.currency)
                : null,
              ebitda: latestMetric.ebitda
                ? formatMoney(Number(latestMetric.ebitda), ctx.currency)
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
                ? formatMoney(Number(latestMetric.netIncome), ctx.currency)
                : null,
              employeeCount: latestMetric.employeeCount,
            }
          : null,
      }
    })
  },
}
