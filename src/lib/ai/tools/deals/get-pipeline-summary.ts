import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getPipelineSummary: ITool = {
  metadata: {
    name: 'getPipelineSummary',
    description:
      'Get the current deal pipeline with counts by stage, total pipeline value, and active deal count.',
    category: 'deals',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const deals = await prisma.deal.findMany({
      where: { fundId: ctx.fundId, ...notDeleted },
      select: { id: true, stage: true, status: true, askingPrice: true },
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
      totalPipelineValue: formatMoney(totalPipelineValue, ctx.currency),
    }
  },
}
