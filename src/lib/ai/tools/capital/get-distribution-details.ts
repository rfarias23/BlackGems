import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getDistributionDetails: ITool = {
  metadata: {
    name: 'getDistributionDetails',
    description:
      'Get detailed information about a specific distribution including per-investor payment amounts, withholding tax, net amounts, and payment status.',
    category: 'capital',
  },
  inputSchema: z.object({
    distributionNumberOrId: z
      .string()
      .describe('Distribution number (e.g., "2") or distribution ID'),
  }),
  async execute(input: { distributionNumberOrId: string }, ctx) {
    const { distributionNumberOrId } = input
    const parsed = parseInt(distributionNumberOrId, 10)

    const dist = await prisma.distribution.findFirst({
      where: {
        fundId: ctx.fundId,
        ...notDeleted,
        OR: [
          ...(Number.isFinite(parsed)
            ? [{ distributionNumber: parsed }]
            : []),
          { id: distributionNumberOrId },
        ],
      },
      include: {
        items: {
          include: {
            investor: {
              select: { name: true, type: true },
            },
          },
          orderBy: { grossAmount: 'desc' },
        },
      },
    })

    if (!dist) {
      return {
        error:
          'Distribution not found. Check the distribution number or use getDistributionSummary to see all distributions.',
      }
    }

    const totalGross = dist.items.reduce(
      (sum, item) => sum + Number(item.grossAmount),
      0
    )
    const totalWithholding = dist.items.reduce(
      (sum, item) => sum + Number(item.withholdingTax),
      0
    )
    const totalNet = dist.items.reduce(
      (sum, item) => sum + Number(item.netAmount),
      0
    )

    const items = dist.items.map((item) => ({
      investorName: item.investor.name,
      investorType: item.investor.type,
      grossAmount: formatMoney(Number(item.grossAmount), ctx.currency),
      withholdingTax: formatMoney(Number(item.withholdingTax), ctx.currency),
      netAmount: formatMoney(Number(item.netAmount), ctx.currency),
      status: item.status,
      paidDate: item.paidDate?.toISOString().split('T')[0] ?? null,
      paymentMethod: item.paymentMethod,
    }))

    return {
      distributionNumber: dist.distributionNumber,
      type: dist.type,
      status: dist.status,
      distributionDate: dist.distributionDate.toISOString().split('T')[0],
      approvedDate: dist.approvedDate?.toISOString().split('T')[0] ?? null,
      paidDate: dist.paidDate?.toISOString().split('T')[0] ?? null,
      totalAmount: formatMoney(Number(dist.totalAmount), ctx.currency),
      returnOfCapital: formatMoney(
        Number(dist.returnOfCapital ?? 0),
        ctx.currency
      ),
      realizedGains: formatMoney(
        Number(dist.realizedGains ?? 0),
        ctx.currency
      ),
      dividends: formatMoney(Number(dist.dividends ?? 0), ctx.currency),
      interest: formatMoney(Number(dist.interest ?? 0), ctx.currency),
      source: dist.source,
      notes: dist.notes,
      totalGross: formatMoney(totalGross, ctx.currency),
      totalWithholding: formatMoney(totalWithholding, ctx.currency),
      totalNet: formatMoney(totalNet, ctx.currency),
      items,
    }
  },
}
