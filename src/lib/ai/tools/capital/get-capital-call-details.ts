import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { formatMoney, formatPercent } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getCapitalCallDetails: ITool = {
  metadata: {
    name: 'getCapitalCallDetails',
    description:
      'Get detailed information about a specific capital call including per-investor payment status, amounts, and collection progress.',
    category: 'capital',
  },
  inputSchema: z.object({
    callNumberOrId: z
      .string()
      .describe('Call number (e.g., "3") or capital call ID'),
  }),
  async execute(input: { callNumberOrId: string }, ctx) {
    const { callNumberOrId } = input
    const parsed = parseInt(callNumberOrId, 10)

    const call = await prisma.capitalCall.findFirst({
      where: {
        fundId: ctx.fundId,
        OR: [
          ...(Number.isFinite(parsed) ? [{ callNumber: parsed }] : []),
          { id: callNumberOrId },
        ],
      },
      include: {
        items: {
          include: {
            investor: {
              select: { name: true, type: true },
            },
          },
          orderBy: { callAmount: 'desc' },
        },
      },
    })

    if (!call) {
      return {
        error:
          'Capital call not found. Check the call number or use getCapitalCallSummary to see all active calls.',
      }
    }

    const now = new Date()
    const isOverdue =
      call.dueDate < now &&
      call.status !== 'FULLY_FUNDED' &&
      call.status !== 'CANCELLED'
    const daysOverdue = isOverdue
      ? Math.floor((now.getTime() - call.dueDate.getTime()) / 86_400_000)
      : 0

    const collectedAmount = call.items.reduce(
      (sum, item) => sum + Number(item.paidAmount),
      0
    )
    const totalAmount = Number(call.totalAmount)
    const outstandingAmount = totalAmount - collectedAmount
    const collectionRate = totalAmount > 0 ? collectedAmount / totalAmount : 0

    const items = call.items.map((item) => {
      const callAmt = Number(item.callAmount)
      const paidAmt = Number(item.paidAmount)
      return {
        investorName: item.investor.name,
        investorType: item.investor.type,
        callAmount: formatMoney(callAmt, ctx.currency),
        paidAmount: formatMoney(paidAmt, ctx.currency),
        outstandingAmount: formatMoney(callAmt - paidAmt, ctx.currency),
        status: item.status,
        paidDate: item.paidDate?.toISOString().split('T')[0] ?? null,
      }
    })

    return {
      callNumber: call.callNumber,
      status: call.status,
      callDate: call.callDate.toISOString().split('T')[0],
      dueDate: call.dueDate.toISOString().split('T')[0],
      noticeDate: call.noticeDate?.toISOString().split('T')[0] ?? null,
      completedDate: call.completedDate?.toISOString().split('T')[0] ?? null,
      totalAmount: formatMoney(totalAmount, ctx.currency),
      forInvestment: formatMoney(
        call.forInvestment ? Number(call.forInvestment) : null,
        ctx.currency
      ),
      forFees: formatMoney(
        call.forFees ? Number(call.forFees) : null,
        ctx.currency
      ),
      forExpenses: formatMoney(
        call.forExpenses ? Number(call.forExpenses) : null,
        ctx.currency
      ),
      purpose: call.purpose,
      dealReference: call.dealReference,
      collectedAmount: formatMoney(collectedAmount, ctx.currency),
      outstandingAmount: formatMoney(outstandingAmount, ctx.currency),
      collectionRate: formatPercent(collectionRate),
      isOverdue,
      daysOverdue,
      items,
    }
  },
}
