import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { CurrencyCode } from '@/lib/shared/formatters'

interface PeriodInput {
  type: string // "Q1", "Q2", "Q3", "Q4", "annual", "monthly", "custom"
  year: number
}

export interface LPUpdateContext {
  fundName: string
  currency: CurrencyCode
  periodLabel: string
  totalCommitments: number
  totalCalled: number
  totalDistributed: number
  dryPowder: number
  grossMoic: number
  portfolioCompanies: Array<{ name: string; invested: number; currentValue: number }>
  activeDeals: Array<{ name: string; stage: string }>
  investorCount: number
  recentMilestones: string[]
  formatted: {
    totalCommitments: string
    totalCalled: string
    totalDistributed: string
    dryPowder: string
    grossMoic: string
    deploymentPercent: string
  }
}

export async function assembleLPUpdateContext(
  fundId: string,
  period: PeriodInput
): Promise<LPUpdateContext | { error: string }> {
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    select: { id: true, name: true, targetSize: true, currency: true },
  })
  if (!fund) return { error: 'Fund not found' }

  const currency = (fund.currency ?? 'USD') as CurrencyCode

  const [commitments, portfolioCompanies, deals, investors, activities] = await Promise.all([
    prisma.commitment.findMany({
      where: { fundId, ...notDeleted },
      select: { committedAmount: true, calledAmount: true, distributedAmount: true },
    }),
    prisma.portfolioCompany.findMany({
      where: { fundId, ...notDeleted },
      select: { name: true, equityInvested: true, totalValue: true },
    }),
    prisma.deal.findMany({
      where: { fundId, status: { in: ['ACTIVE', 'ON_HOLD'] }, ...notDeleted },
      select: { companyName: true, stage: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
    prisma.investor.findMany({
      where: { commitments: { some: { fundId, ...notDeleted } }, ...notDeleted },
      select: { name: true, type: true },
    }),
    prisma.activity.findMany({
      where: { deal: { fundId }, type: { in: ['STAGE_CHANGE', 'SITE_VISIT'] } },
      select: { title: true, description: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const totalCommitments = commitments.reduce((s, c) => s + Number(c.committedAmount), 0)
  const totalCalled = commitments.reduce((s, c) => s + Number(c.calledAmount), 0)
  const totalDistributed = commitments.reduce((s, c) => s + Number(c.distributedAmount), 0)
  const dryPowder = totalCommitments - totalCalled
  const totalInvested = portfolioCompanies.reduce((s, c) => s + Number(c.equityInvested), 0)
  const totalValue = portfolioCompanies.reduce((s, c) => s + Number(c.totalValue ?? 0), 0)
  const grossMoic = totalInvested > 0 ? totalValue / totalInvested : 0

  const periodLabel = period.type.startsWith('Q')
    ? `Q${period.type.slice(1)} ${period.year}`
    : `${period.type} ${period.year}`

  return {
    fundName: fund.name,
    currency,
    periodLabel,
    totalCommitments,
    totalCalled,
    totalDistributed,
    dryPowder,
    grossMoic,
    portfolioCompanies: portfolioCompanies.map(pc => ({
      name: pc.name,
      invested: Number(pc.equityInvested),
      currentValue: Number(pc.totalValue ?? 0),
    })),
    activeDeals: deals.map(d => ({ name: d.companyName, stage: d.stage })),
    investorCount: investors.length,
    recentMilestones: activities.map(a => a.title),
    formatted: {
      totalCommitments: formatMoney(totalCommitments, currency),
      totalCalled: formatMoney(totalCalled, currency),
      totalDistributed: formatMoney(totalDistributed, currency),
      dryPowder: formatMoney(dryPowder, currency),
      grossMoic: formatMultiple(grossMoic),
      deploymentPercent: totalCommitments > 0 ? formatPercent(totalCalled / totalCommitments) : '0%',
    },
  }
}
