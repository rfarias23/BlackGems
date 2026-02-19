import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'

export interface FundContext {
  fund: {
    id: string
    name: string
    currency: string
    status: string
    targetSize: number
    type: string
  } | null
  dealCounts: { stage: string; _count: number }[]
  investorSummary: {
    totalCommitted: number
    totalPaid: number
    investorCount: number
  }
  recentCapitalCalls: {
    id: string
    callDate: Date | null
    totalAmount: number
    status: string
  }[]
  portfolioSummary: {
    name: string
    status: string
    equityInvested: number
    moic: number | null
  }[]
}

export async function assembleFundContext(fundId: string): Promise<FundContext> {
  const [fund, dealCounts, commitmentAgg, capitalCalls, portfolio] = await Promise.all([
    prisma.fund.findUnique({
      where: { id: fundId },
      select: {
        id: true,
        name: true,
        currency: true,
        status: true,
        targetSize: true,
        type: true,
      },
    }),
    prisma.deal.groupBy({
      by: ['stage'],
      where: { fundId, ...notDeleted },
      _count: true,
    }),
    prisma.commitment.aggregate({
      where: { fundId, deletedAt: null },
      _sum: { committedAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.capitalCall.findMany({
      where: { fundId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, callDate: true, totalAmount: true, status: true },
    }),
    prisma.portfolioCompany.findMany({
      where: { fundId, ...notDeleted },
      select: { name: true, status: true, equityInvested: true, moic: true },
    }),
  ])

  return {
    fund: fund
      ? {
          id: fund.id,
          name: fund.name,
          currency: fund.currency,
          status: fund.status,
          targetSize: Number(fund.targetSize),
          type: fund.type,
        }
      : null,
    dealCounts: dealCounts.map((d) => ({ stage: d.stage, _count: d._count })),
    investorSummary: {
      totalCommitted: Number(commitmentAgg._sum.committedAmount || 0),
      totalPaid: Number(commitmentAgg._sum.paidAmount || 0),
      investorCount: commitmentAgg._count,
    },
    recentCapitalCalls: capitalCalls.map((cc) => ({
      id: cc.id,
      callDate: cc.callDate,
      totalAmount: Number(cc.totalAmount),
      status: cc.status,
    })),
    portfolioSummary: portfolio.map((pc) => ({
      name: pc.name,
      status: pc.status,
      equityInvested: Number(pc.equityInvested),
      moic: pc.moic ? Number(pc.moic) : null,
    })),
  }
}
