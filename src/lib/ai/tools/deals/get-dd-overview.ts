import { z } from 'zod'
import { DealStage } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatPercent } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

const DD_ACTIVE_STAGES: DealStage[] = [
  DealStage.DUE_DILIGENCE,
  DealStage.FINAL_NEGOTIATION,
  DealStage.CLOSING,
]
const DD_DONE_STATUSES = ['COMPLETED', 'NA']

export const getDDOverview: ITool = {
  metadata: {
    name: 'getDDOverview',
    description:
      'Get the due diligence status across all active deals in the fund. Shows completion progress, red flags, and category breakdown for deals in DUE_DILIGENCE, FINAL_NEGOTIATION, and CLOSING stages.',
    category: 'deals',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const deals = await prisma.deal.findMany({
      where: {
        fundId: ctx.fundId,
        ...notDeleted,
        stage: { in: DD_ACTIVE_STAGES },
        dueDiligenceItems: { some: {} },
      },
      include: {
        dueDiligenceItems: {
          select: {
            category: true,
            status: true,
            redFlag: true,
            priority: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    if (deals.length === 0) {
      return {
        totalDeals: 0,
        totalItems: 0,
        completedItems: 0,
        overallProgress: formatPercent(0),
        totalRedFlags: 0,
        deals: [],
        summary:
          'No deals are currently in due diligence. Deals enter the DD phase after LOI acceptance \u2014 DD items are created to track investigation across financial, legal, operational, and other categories.',
      }
    }

    let totalItems = 0
    let completedItems = 0
    let totalRedFlags = 0

    const dealSummaries = deals.map((deal) => {
      const items = deal.dueDiligenceItems
      const completed = items.filter((i) =>
        DD_DONE_STATUSES.includes(i.status)
      ).length
      const redFlags = items.filter((i) => i.redFlag).length
      const pendingHighPriority = items.filter(
        (i) => i.priority <= 2 && !DD_DONE_STATUSES.includes(i.status)
      ).length

      totalItems += items.length
      completedItems += completed
      totalRedFlags += redFlags

      const categoryMap = new Map<
        string,
        { total: number; completed: number; redFlags: number }
      >()

      for (const item of items) {
        const entry = categoryMap.get(item.category) ?? {
          total: 0,
          completed: 0,
          redFlags: 0,
        }
        entry.total++
        if (DD_DONE_STATUSES.includes(item.status)) entry.completed++
        if (item.redFlag) entry.redFlags++
        categoryMap.set(item.category, entry)
      }

      const byCategory = Array.from(categoryMap.entries()).map(
        ([category, data]) => ({
          category,
          total: data.total,
          completed: data.completed,
          redFlags: data.redFlags,
        })
      )

      return {
        dealId: deal.id,
        dealName: deal.name,
        companyName: deal.companyName,
        stage: deal.stage,
        totalItems: items.length,
        completedItems: completed,
        progress: formatPercent(items.length > 0 ? completed / items.length : 0),
        redFlagCount: redFlags,
        pendingHighPriority,
        byCategory,
      }
    })

    const overallProgress =
      totalItems > 0 ? completedItems / totalItems : 0

    return {
      totalDeals: deals.length,
      totalItems,
      completedItems,
      overallProgress: formatPercent(overallProgress),
      totalRedFlags,
      deals: dealSummaries,
    }
  },
}
