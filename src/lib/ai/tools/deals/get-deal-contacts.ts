import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import type { ITool } from '../../core/types'

export const getDealContacts: ITool = {
  metadata: {
    name: 'getDealContacts',
    description:
      'Get all contacts associated with a specific deal including names, roles, titles, and contact information. Use this when the user asks about who is involved in a deal or needs someone\'s contact details.',
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
        contacts: {
          orderBy: [
            { isPrimary: 'desc' },
            { role: 'asc' },
            { name: 'asc' },
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

    if (deal.contacts.length === 0) {
      return {
        dealName: deal.name,
        companyName: deal.companyName,
        totalContacts: 0,
        primaryContact: null,
        contacts: [],
        summary:
          'No contacts have been added to this deal yet. Contacts typically include the business owner, broker, attorney, and key management team members.',
      }
    }

    const primary = deal.contacts.find((c) => c.isPrimary) ?? null

    const contacts = deal.contacts.map((c) => ({
      name: c.name,
      title: c.title,
      role: c.role,
      email: c.email,
      phone: c.phone,
      isPrimary: c.isPrimary,
      notes: c.notes,
    }))

    return {
      dealName: deal.name,
      companyName: deal.companyName,
      totalContacts: deal.contacts.length,
      primaryContact: primary
        ? {
            name: primary.name,
            title: primary.title,
            role: primary.role,
            email: primary.email,
            phone: primary.phone,
          }
        : null,
      contacts,
    }
  },
}
