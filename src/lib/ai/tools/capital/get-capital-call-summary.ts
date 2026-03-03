import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getCapitalCallSummary: ITool = {
  metadata: {
    name: 'getCapitalCallSummary',
    description:
      'Get a summary of all capital calls for the fund including total called, collected, outstanding amounts, and status breakdown by call.',
    category: 'capital',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const calls = await prisma.capitalCall.findMany({
      where: {
        fundId: ctx.fundId,
        ...notDeleted,
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      include: {
        items: {
          select: { callAmount: true, paidAmount: true, status: true },
        },
      },
      orderBy: { callNumber: 'desc' },
    })

    if (calls.length === 0) {
      return {
        totalCalls: 0,
        totalCalled: formatMoney(0, ctx.currency),
        totalCollected: formatMoney(0, ctx.currency),
        totalOutstanding: formatMoney(0, ctx.currency),
        collectionRate: formatPercent(0),
        byStatus: [],
        calls: [],
        summary:
          'No capital calls have been issued for this fund. Capital calls are created when the fund needs to draw down committed capital from LPs \u2014 typically for acquisitions, fees, or expenses.',
      }
    }

    let totalCalled = 0
    let totalCollected = 0
    const statusMap = new Map<string, { count: number; amount: number }>()

    for (const call of calls) {
      const amount = Number(call.totalAmount)
      totalCalled += amount

      const collected = call.items.reduce(
        (sum, item) => sum + Number(item.paidAmount),
        0
      )
      totalCollected += collected

      const existing = statusMap.get(call.status) ?? { count: 0, amount: 0 }
      statusMap.set(call.status, {
        count: existing.count + 1,
        amount: existing.amount + amount,
      })
    }

    const collectionRate = totalCalled > 0 ? totalCollected / totalCalled : 0

    const byStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: formatMoney(data.amount, ctx.currency),
    }))

    const recentCalls = calls.slice(0, 10).map((call) => {
      const paid = call.items.filter((item) => item.status === 'PAID').length
      const collectedAmount = call.items.reduce(
        (sum, item) => sum + Number(item.paidAmount),
        0
      )

      return {
        callNumber: call.callNumber,
        callDate: call.callDate.toISOString().split('T')[0],
        dueDate: call.dueDate.toISOString().split('T')[0],
        totalAmount: formatMoney(Number(call.totalAmount), ctx.currency),
        status: call.status,
        purpose: call.purpose,
        itemsPaid: paid,
        itemsTotal: call.items.length,
        collectedAmount: formatMoney(collectedAmount, ctx.currency),
      }
    })

    return {
      totalCalls: calls.length,
      totalCalled: formatMoney(totalCalled, ctx.currency),
      totalCollected: formatMoney(totalCollected, ctx.currency),
      totalOutstanding: formatMoney(totalCalled - totalCollected, ctx.currency),
      collectionRate: formatPercent(collectionRate),
      byStatus,
      calls: recentCalls,
    }
  },
}
