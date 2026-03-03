import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getDistributionSummary: ITool = {
  metadata: {
    name: 'getDistributionSummary',
    description:
      'Get a summary of all distributions for the fund including total distributed by type (return of capital, profit, dividends), status breakdown, and recent distribution history.',
    category: 'capital',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const distributions = await prisma.distribution.findMany({
      where: {
        fundId: ctx.fundId,
        ...notDeleted,
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      include: {
        items: {
          select: { grossAmount: true, netAmount: true, status: true },
        },
      },
      orderBy: { distributionNumber: 'desc' },
    })

    if (distributions.length === 0) {
      return {
        totalDistributions: 0,
        totalDistributed: formatMoney(0, ctx.currency),
        byType: [],
        byStatus: [],
        totalReturnOfCapital: formatMoney(0, ctx.currency),
        totalRealizedGains: formatMoney(0, ctx.currency),
        totalDividends: formatMoney(0, ctx.currency),
        totalInterest: formatMoney(0, ctx.currency),
        distributions: [],
        summary:
          'No distributions have been made from this fund. Distributions occur when the fund returns capital to LPs \u2014 typically from portfolio company exits, dividends, or recapitalization events.',
      }
    }

    let totalDistributed = 0
    let totalReturnOfCapital = 0
    let totalRealizedGains = 0
    let totalDividends = 0
    let totalInterest = 0

    const typeMap = new Map<string, { count: number; amount: number }>()
    const statusMap = new Map<string, { count: number; amount: number }>()

    for (const dist of distributions) {
      const amount = Number(dist.totalAmount)
      totalDistributed += amount
      totalReturnOfCapital += Number(dist.returnOfCapital ?? 0)
      totalRealizedGains += Number(dist.realizedGains ?? 0)
      totalDividends += Number(dist.dividends ?? 0)
      totalInterest += Number(dist.interest ?? 0)

      const typeEntry = typeMap.get(dist.type) ?? { count: 0, amount: 0 }
      typeMap.set(dist.type, {
        count: typeEntry.count + 1,
        amount: typeEntry.amount + amount,
      })

      const statusEntry = statusMap.get(dist.status) ?? { count: 0, amount: 0 }
      statusMap.set(dist.status, {
        count: statusEntry.count + 1,
        amount: statusEntry.amount + amount,
      })
    }

    const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      amount: formatMoney(data.amount, ctx.currency),
    }))

    const byStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: formatMoney(data.amount, ctx.currency),
    }))

    const distList = distributions.slice(0, 10).map((dist) => {
      const paidItems = dist.items.filter((i) => i.status === 'PAID').length

      return {
        distributionNumber: dist.distributionNumber,
        distributionDate: dist.distributionDate.toISOString().split('T')[0],
        type: dist.type,
        status: dist.status,
        totalAmount: formatMoney(Number(dist.totalAmount), ctx.currency),
        source: dist.source,
        itemsPaid: paidItems,
        itemsTotal: dist.items.length,
      }
    })

    return {
      totalDistributions: distributions.length,
      totalDistributed: formatMoney(totalDistributed, ctx.currency),
      byType,
      byStatus,
      totalReturnOfCapital: formatMoney(totalReturnOfCapital, ctx.currency),
      totalRealizedGains: formatMoney(totalRealizedGains, ctx.currency),
      totalDividends: formatMoney(totalDividends, ctx.currency),
      totalInterest: formatMoney(totalInterest, ctx.currency),
      distributions: distList,
    }
  },
}
