import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getFundFinancials: ITool = {
  metadata: {
    name: 'getFundFinancials',
    description:
      'Get the fund financial summary including total committed capital, called capital, distributed capital, and performance metrics.',
    category: 'capital',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const fund = await prisma.fund.findUniqueOrThrow({
      where: { id: ctx.fundId },
      select: { name: true, targetSize: true, status: true },
    })

    const commitmentAgg = await prisma.commitment.aggregate({
      where: { fundId: ctx.fundId, ...notDeleted },
      _sum: {
        committedAmount: true,
        calledAmount: true,
        paidAmount: true,
        distributedAmount: true,
      },
    })

    const portfolioCompanies = await prisma.portfolioCompany.findMany({
      where: { fundId: ctx.fundId, ...notDeleted },
      select: { equityInvested: true, moic: true, totalValue: true },
    })

    const totalCommitted = Number(commitmentAgg._sum.committedAmount ?? 0)
    const totalCalled = Number(commitmentAgg._sum.calledAmount ?? 0)
    const totalPaid = Number(commitmentAgg._sum.paidAmount ?? 0)
    const totalDistributed = Number(commitmentAgg._sum.distributedAmount ?? 0)
    const paidInPct = totalCommitted > 0 ? totalPaid / totalCommitted : 0

    const totalEquityInvested = portfolioCompanies.reduce(
      (sum, pc) => sum + Number(pc.equityInvested), 0
    )
    const weightedMoicSum = portfolioCompanies.reduce(
      (sum, pc) => sum + (pc.moic ? Number(pc.moic) * Number(pc.equityInvested) : 0), 0
    )
    const totalMOIC = totalEquityInvested > 0 ? weightedMoicSum / totalEquityInvested : 0

    return {
      fundName: fund.name,
      fundStatus: fund.status,
      targetSize: formatMoney(Number(fund.targetSize), ctx.currency),
      totalCommitted: formatMoney(totalCommitted, ctx.currency),
      totalCalled: formatMoney(totalCalled, ctx.currency),
      totalPaid: formatMoney(totalPaid, ctx.currency),
      totalDistributed: formatMoney(totalDistributed, ctx.currency),
      paidInPct: formatPercent(paidInPct),
      portfolioCount: portfolioCompanies.length,
      totalMOIC: formatMultiple(totalMOIC),
    }
  },
}
