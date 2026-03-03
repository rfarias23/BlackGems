import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getDealDetails: ITool = {
  metadata: {
    name: 'getDealDetails',
    description:
      'Get detailed information about a specific deal by name or ID. Use this when the user asks about a particular deal.',
    category: 'deals',
  },
  inputSchema: z.object({
    nameOrId: z.string().describe('The deal name (partial match supported) or deal ID'),
  }),
  async execute(input: { nameOrId: string }, ctx) {
    const { nameOrId } = input
    const byId = await prisma.deal.findFirst({
      where: { id: nameOrId, fundId: ctx.fundId, ...notDeleted },
    })

    const deal =
      byId ??
      (await prisma.deal.findFirst({
        where: {
          fundId: ctx.fundId,
          ...notDeleted,
          name: { contains: nameOrId, mode: 'insensitive' as const },
        },
      }))

    if (!deal) return { error: 'Deal not found' }

    return {
      id: deal.id,
      name: deal.name,
      companyName: deal.companyName,
      stage: deal.stage,
      status: deal.status,
      industry: deal.industry,
      askingPrice: formatMoney(deal.askingPrice ? Number(deal.askingPrice) : null, ctx.currency),
      revenue: formatMoney(deal.revenue ? Number(deal.revenue) : null, ctx.currency),
      ebitda: formatMoney(deal.ebitda ? Number(deal.ebitda) : null, ctx.currency),
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
}
