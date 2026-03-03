import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { formatMoney } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getOverdueCallItems: ITool = {
  metadata: {
    name: 'getOverdueCallItems',
    description:
      'Get all overdue capital call line items \u2014 specific LPs who have missed payment deadlines. Returns per-investor detail grouped by call, including amounts owed, days overdue, and contact info for follow-up. Only includes calls that have been sent to LPs.',
    category: 'capital',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const now = new Date()

    // Signal 1: date-based — call issued and past due, item not paid
    const overdueItems = await prisma.capitalCallItem.findMany({
      where: {
        status: { notIn: ['PAID'] },
        capitalCall: {
          fundId: ctx.fundId,
          status: { in: ['SENT', 'PARTIALLY_FUNDED'] },
          dueDate: { lt: now },
        },
      },
      include: {
        capitalCall: {
          select: {
            id: true,
            callNumber: true,
            dueDate: true,
            totalAmount: true,
            purpose: true,
            status: true,
          },
        },
        investor: {
          select: {
            name: true,
            type: true,
            contactName: true,
            contactEmail: true,
          },
        },
      },
      orderBy: {
        capitalCall: { dueDate: 'asc' },
      },
    })

    // Signal 2: status-based — item explicitly flagged as OVERDUE or DEFAULTED
    const flaggedItems = await prisma.capitalCallItem.findMany({
      where: {
        status: { in: ['OVERDUE', 'DEFAULTED'] },
        capitalCall: {
          fundId: ctx.fundId,
          status: { notIn: ['DRAFT', 'CANCELLED', 'FULLY_FUNDED'] },
        },
      },
      include: {
        capitalCall: {
          select: {
            id: true,
            callNumber: true,
            dueDate: true,
            totalAmount: true,
            purpose: true,
            status: true,
          },
        },
        investor: {
          select: {
            name: true,
            type: true,
            contactName: true,
            contactEmail: true,
          },
        },
      },
    })

    // Merge both signals, deduplicate by item id
    const itemMap = new Map<string, (typeof overdueItems)[number]>()
    for (const item of [...overdueItems, ...flaggedItems]) {
      itemMap.set(item.id, item)
    }
    const allItems = Array.from(itemMap.values())

    if (allItems.length === 0) {
      return {
        totalOverdueItems: 0,
        totalOverdueAmount: formatMoney(0, ctx.currency),
        overdueByCall: [],
        summary:
          'No overdue capital call items. All LPs with outstanding calls have either paid in full or their calls are not yet past due.',
      }
    }

    // Group by parent call
    const callGroups = new Map<
      string,
      {
        call: (typeof allItems)[number]['capitalCall']
        items: (typeof allItems)[number][]
      }
    >()

    for (const item of allItems) {
      const callId = item.capitalCall.id
      const group = callGroups.get(callId) ?? {
        call: item.capitalCall,
        items: [],
      }
      group.items.push(item)
      callGroups.set(callId, group)
    }

    let totalOverdueAmount = 0

    const overdueByCall = Array.from(callGroups.values())
      .sort(
        (a, b) => a.call.dueDate.getTime() - b.call.dueDate.getTime()
      )
      .map((group) => {
        const daysOverdue = Math.max(
          0,
          Math.floor(
            (now.getTime() - group.call.dueDate.getTime()) / 86_400_000
          )
        )

        const items = group.items.map((item) => {
          const callAmt = Number(item.callAmount)
          const paidAmt = Number(item.paidAmount)
          const outstanding = callAmt - paidAmt
          totalOverdueAmount += outstanding

          return {
            investorName: item.investor.name,
            investorType: item.investor.type,
            callAmount: formatMoney(callAmt, ctx.currency),
            paidAmount: formatMoney(paidAmt, ctx.currency),
            outstandingAmount: formatMoney(outstanding, ctx.currency),
            status: item.status,
            contactName: item.investor.contactName,
            contactEmail: item.investor.contactEmail,
            daysOverdue,
          }
        })

        return {
          callNumber: group.call.callNumber,
          dueDate: group.call.dueDate.toISOString().split('T')[0],
          daysOverdue,
          totalAmount: formatMoney(
            Number(group.call.totalAmount),
            ctx.currency
          ),
          purpose: group.call.purpose,
          items,
        }
      })

    return {
      totalOverdueItems: allItems.length,
      totalOverdueAmount: formatMoney(totalOverdueAmount, ctx.currency),
      overdueByCall,
    }
  },
}
