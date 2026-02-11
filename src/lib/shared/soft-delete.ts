import { prisma } from '@/lib/prisma'

/**
 * Soft-deletes a record by setting deletedAt to the current timestamp.
 * This is preferred over hard deletion for all critical PE platform data.
 *
 * Usage:
 *   await softDelete('deal', dealId)
 *   await softDelete('investor', investorId)
 */
export async function softDelete(
  model: 'deal' | 'investor' | 'portfolioCompany' | 'document' | 'capitalCall' | 'distribution',
  id: string
): Promise<void> {
  const now = new Date()

  switch (model) {
    case 'deal':
      await prisma.deal.update({
        where: { id },
        data: { deletedAt: now },
      })
      break
    case 'investor':
      await prisma.investor.update({
        where: { id },
        data: { deletedAt: now },
      })
      break
    case 'portfolioCompany':
      await prisma.portfolioCompany.update({
        where: { id },
        data: { deletedAt: now },
      })
      break
    case 'document':
      await prisma.document.update({
        where: { id },
        data: { deletedAt: now },
      })
      break
    case 'capitalCall':
      await prisma.capitalCall.update({
        where: { id },
        data: { deletedAt: now },
      })
      break
    case 'distribution':
      await prisma.distribution.update({
        where: { id },
        data: { deletedAt: now },
      })
      break
  }
}

/**
 * Standard filter to exclude soft-deleted records.
 * Apply to all findMany / findFirst queries on soft-deletable models.
 */
export const notDeleted = { deletedAt: null }
