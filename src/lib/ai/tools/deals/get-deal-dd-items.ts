import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatPercent } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

const DD_DONE_STATUSES = ['COMPLETED', 'NA']

export const getDealDDItems: ITool = {
  metadata: {
    name: 'getDealDDItems',
    description:
      'Get all due diligence items for a specific deal, grouped by category. Includes status, priority, findings, and red flags for each item. Use this when the user asks about DD status for a particular deal.',
    category: 'deals',
  },
  inputSchema: z.object({
    dealNameOrId: z
      .string()
      .describe('Deal name (partial match supported) or deal ID'),
  }),
  async execute(input: { dealNameOrId: string }, ctx) {
    const { dealNameOrId } = input

    const deal = await prisma.deal.findFirst({
      where: {
        fundId: ctx.fundId,
        ...notDeleted,
        OR: [
          { id: dealNameOrId },
          { name: { contains: dealNameOrId, mode: 'insensitive' as const } },
        ],
      },
      include: {
        dueDiligenceItems: {
          orderBy: [
            { category: 'asc' },
            { priority: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    })

    if (!deal) {
      return {
        error:
          'Deal not found. Check the deal name or use getPipelineSummary to see all active deals.',
      }
    }

    const items = deal.dueDiligenceItems

    if (items.length === 0) {
      return {
        dealName: deal.name,
        companyName: deal.companyName,
        stage: deal.stage,
        totalItems: 0,
        completedItems: 0,
        progress: formatPercent(0),
        redFlagCount: 0,
        byCategory: [],
        summary:
          'No due diligence items have been created for this deal yet. DD items are typically organized by category (Financial, Legal, Commercial, etc.) and track the investigation of each diligence area.',
      }
    }

    const completed = items.filter((i) =>
      DD_DONE_STATUSES.includes(i.status)
    ).length
    const redFlagCount = items.filter((i) => i.redFlag).length

    const categoryMap = new Map<
      string,
      {
        total: number
        completed: number
        redFlags: number
        items: typeof items
      }
    >()

    for (const item of items) {
      const entry = categoryMap.get(item.category) ?? {
        total: 0,
        completed: 0,
        redFlags: 0,
        items: [],
      }
      entry.total++
      if (DD_DONE_STATUSES.includes(item.status)) entry.completed++
      if (item.redFlag) entry.redFlags++
      entry.items.push(item)
      categoryMap.set(item.category, entry)
    }

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        total: data.total,
        completed: data.completed,
        redFlags: data.redFlags,
        items: data.items.map((item) => ({
          id: item.id,
          item: item.item,
          status: item.status,
          priority: item.priority,
          assignedTo: item.assignedTo,
          findings: item.findings,
          redFlag: item.redFlag,
          updatedAt: item.updatedAt.toISOString().split('T')[0],
        })),
      })
    )

    return {
      dealName: deal.name,
      companyName: deal.companyName,
      stage: deal.stage,
      totalItems: items.length,
      completedItems: completed,
      progress: formatPercent(items.length > 0 ? completed / items.length : 0),
      redFlagCount,
      byCategory,
    }
  },
}
