'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notDeleted } from '@/lib/shared/soft-delete'
import { calculateFundIRR } from '@/lib/shared/irr'
import { calculateWaterfall } from '@/lib/shared/waterfall'

// ============================================================================
// DASHBOARD CHART DATA
// ============================================================================

export interface DashboardChartData {
  moicByCompany: { name: string; moic: number }[]
  sectorAllocation: { name: string; value: number }[]
  capitalTimeline: { date: string; called: number; distributed: number }[]
  fundIrr: number | null
}

export async function getDashboardChartData(): Promise<DashboardChartData | null> {
  const session = await auth()
  if (!session?.user) return null

  const fund = await prisma.fund.findFirst()
  if (!fund) return null

  const [portfolioCompanies, capitalCalls, distributions, commitments] =
    await Promise.all([
      prisma.portfolioCompany.findMany({
        where: { fundId: fund.id, ...notDeleted },
        select: {
          name: true,
          moic: true,
          equityInvested: true,
          industry: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.capitalCall.findMany({
        where: { fundId: fund.id, status: 'FULLY_FUNDED', ...notDeleted },
        select: { callDate: true, totalAmount: true },
        orderBy: { callDate: 'asc' },
      }),
      prisma.distribution.findMany({
        where: { fundId: fund.id, status: 'COMPLETED', ...notDeleted },
        select: { distributionDate: true, totalAmount: true },
        orderBy: { distributionDate: 'asc' },
      }),
      prisma.commitment.findMany({
        where: { fundId: fund.id },
        select: { distributedAmount: true, paidAmount: true },
      }),
    ])

  // MOIC by company (raw numbers, not formatted)
  const moicByCompany = portfolioCompanies.map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 18) + '…' : c.name,
    moic: Number(c.moic || 1),
  }))

  // Sector allocation (by equity invested)
  const sectorMap = new Map<string, number>()
  portfolioCompanies.forEach((c) => {
    const sector = c.industry || 'Other'
    sectorMap.set(
      sector,
      (sectorMap.get(sector) || 0) + Number(c.equityInvested)
    )
  })
  const sectorAllocation = Array.from(sectorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Capital timeline: cumulative called and distributed over time
  const capitalTimeline = buildCapitalTimeline(capitalCalls, distributions)

  // Fund IRR
  const unrealizedValue = commitments.reduce(
    (sum, c) => sum + (Number(c.paidAmount) - Number(c.distributedAmount)),
    0
  )

  const fundIrr = calculateFundIRR({
    capitalCalls: capitalCalls.map((c) => ({
      date: c.callDate,
      amount: Number(c.totalAmount),
    })),
    distributions: distributions.map((d) => ({
      date: d.distributionDate,
      amount: Number(d.totalAmount),
    })),
    currentNAV: Math.max(0, unrealizedValue),
    valuationDate: new Date(),
  })

  return {
    moicByCompany,
    sectorAllocation,
    capitalTimeline,
    fundIrr,
  }
}

// ============================================================================
// LP CHART DATA
// ============================================================================

export interface LPChartData {
  capitalBreakdown: {
    name: string
    committed: number
    called: number
    distributed: number
  }[]
}

export async function getLPChartData(
  investorId: string
): Promise<LPChartData | null> {
  const session = await auth()
  if (!session?.user) return null

  const commitments = await prisma.commitment.findMany({
    where: { investorId },
    include: {
      fund: { select: { name: true } },
    },
  })

  const capitalBreakdown = commitments.map((c) => ({
    name: c.fund.name,
    committed: Number(c.committedAmount),
    called: Number(c.calledAmount),
    distributed: Number(c.distributedAmount),
  }))

  return { capitalBreakdown }
}

// ============================================================================
// WATERFALL CHART DATA (for reports)
// ============================================================================

export interface WaterfallChartData {
  tiers: { name: string; lpAmount: number; gpAmount: number }[]
}

export async function getWaterfallChartData(
  fundId?: string
): Promise<WaterfallChartData | null> {
  const session = await auth()
  if (!session?.user) return null

  const fund = fundId
    ? await prisma.fund.findUnique({ where: { id: fundId } })
    : await prisma.fund.findFirst()

  if (!fund) return null

  const commitments = await prisma.commitment.findMany({
    where: { fundId: fund.id },
  })

  const totalPaid = commitments.reduce(
    (sum, c) => sum + Number(c.paidAmount),
    0
  )
  const totalDistributed = commitments.reduce(
    (sum, c) => sum + Number(c.distributedAmount),
    0
  )

  const portfolioCompanies = await prisma.portfolioCompany.findMany({
    where: { fundId: fund.id, ...notDeleted },
    select: { unrealizedValue: true },
  })

  const unrealizedValue = portfolioCompanies.reduce(
    (sum, c) => sum + Number(c.unrealizedValue || 0),
    0
  )

  const holdingYears = Math.max(
    1,
    new Date().getFullYear() - fund.vintage
  )

  const totalDistributable = totalDistributed + unrealizedValue

  if (totalDistributable <= 0 || totalPaid <= 0) return null

  const result = calculateWaterfall({
    totalDistributable,
    totalContributed: totalPaid,
    hurdleRate: fund.hurdleRate ? Number(fund.hurdleRate) : null,
    carriedInterest: Number(fund.carriedInterest) || 0.2,
    catchUpRate: fund.catchUpRate ? Number(fund.catchUpRate) : null,
    holdingPeriodYears: holdingYears,
  })

  return {
    tiers: result.tiers.map((t) => ({
      name: t.name,
      lpAmount: t.lpAmount,
      gpAmount: t.gpAmount,
    })),
  }
}

// ============================================================================
// Helpers
// ============================================================================

function buildCapitalTimeline(
  capitalCalls: { callDate: Date; totalAmount: unknown }[],
  distributions: { distributionDate: Date; totalAmount: unknown }[]
): { date: string; called: number; distributed: number }[] {
  // Merge events into quarterly buckets
  const buckets = new Map<
    string,
    { called: number; distributed: number }
  >()

  for (const call of capitalCalls) {
    const q = toQuarterLabel(call.callDate)
    const bucket = buckets.get(q) || { called: 0, distributed: 0 }
    bucket.called += Number(call.totalAmount)
    buckets.set(q, bucket)
  }

  for (const dist of distributions) {
    const q = toQuarterLabel(dist.distributionDate)
    const bucket = buckets.get(q) || { called: 0, distributed: 0 }
    bucket.distributed += Number(dist.totalAmount)
    buckets.set(q, bucket)
  }

  // Sort by quarter and make cumulative
  const sorted = Array.from(buckets.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  let cumCalled = 0
  let cumDistributed = 0

  return sorted.map(([date, data]) => {
    cumCalled += data.called
    cumDistributed += data.distributed
    return {
      date,
      called: cumCalled,
      distributed: cumDistributed,
    }
  })
}

function toQuarterLabel(date: Date): string {
  const y = date.getFullYear()
  const q = Math.floor(date.getMonth() / 3) + 1
  return `Q${q} ${y}`
}
