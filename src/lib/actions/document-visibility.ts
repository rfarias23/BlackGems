'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'

const MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']

/** Toggle LP visibility for a document */
export async function toggleDocumentVisibility(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
  if (!MANAGE_ROLES.includes(userRole)) return { error: 'Insufficient permissions' }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, ...notDeleted },
    include: { deal: { select: { fundId: true } } },
  })
  if (!doc) return { error: 'Document not found' }

  const fundId = doc.deal?.fundId || doc.fundId
  if (fundId) {
    try {
      await requireFundAccess(session.user.id, fundId)
    } catch {
      return { error: 'Access denied' }
    }
  }

  const newValue = !doc.visibleToLPs

  await prisma.document.update({
    where: { id: documentId },
    data: { visibleToLPs: newValue },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Document',
    entityId: documentId,
    changes: { visibleToLPs: { old: doc.visibleToLPs, new: newValue } },
  })

  if (doc.dealId) revalidatePath(`/deals/${doc.dealId}`)
  if (doc.investorId) revalidatePath(`/investors/${doc.investorId}`)

  return { success: true, visibleToLPs: newValue }
}
