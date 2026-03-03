import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getInvestorDetails: ITool = {
  metadata: {
    name: 'getInvestorDetails',
    description:
      'Get details about a specific investor/LP including their commitment, paid-in amount, and contact information.',
    category: 'investors',
  },
  inputSchema: z.object({
    nameOrId: z.string().describe('The investor name (partial match supported) or investor ID'),
  }),
  async execute(input: { nameOrId: string }, ctx) {
    const { nameOrId } = input
    const commitment = await prisma.commitment.findFirst({
      where: {
        fundId: ctx.fundId,
        ...notDeleted,
        investor: {
          ...notDeleted,
          OR: [
            { id: nameOrId },
            { name: { contains: nameOrId, mode: 'insensitive' as const } },
          ],
        },
      },
      include: { investor: true },
    })

    if (!commitment) return { error: 'Investor not found in this fund' }

    const investor = commitment.investor
    return {
      id: investor.id,
      name: investor.name,
      type: investor.type,
      status: investor.status,
      email: investor.email,
      contactName: investor.contactName,
      contactEmail: investor.contactEmail,
      committed: formatMoney(Number(commitment.committedAmount), ctx.currency),
      called: formatMoney(Number(commitment.calledAmount), ctx.currency),
      paidIn: formatMoney(Number(commitment.paidAmount), ctx.currency),
      distributed: formatMoney(Number(commitment.distributedAmount), ctx.currency),
      unfunded: formatMoney(
        Number(commitment.committedAmount) - Number(commitment.calledAmount), ctx.currency
      ),
      commitmentStatus: commitment.status,
      commitmentDate: commitment.commitmentDate?.toISOString().split('T')[0] ?? null,
    }
  },
}
