'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { CATEGORY_LABELS } from '@/lib/shared/document-types'
import type { DocumentItem } from '@/lib/shared/document-types'

const MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']

/** Get version history for a document */
export async function getDocumentVersions(documentId: string): Promise<DocumentItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const doc = await prisma.document.findFirst({
    where: { id: documentId, ...notDeleted },
    include: { deal: { select: { fundId: true } } },
  })
  if (!doc) return []

  // Verify fund access
  if (doc.deal?.fundId) {
    try {
      await requireFundAccess(session.user.id, doc.deal.fundId)
    } catch {
      return []
    }
  }

  // Find the root document (the original without a parent)
  const rootId = doc.parentId || doc.id

  // Get all versions in this chain
  const versions = await prisma.document.findMany({
    where: {
      ...notDeleted,
      OR: [
        { id: rootId },
        { parentId: rootId },
      ],
    },
    orderBy: { version: 'desc' },
  })

  const uploaderIds = [...new Set(versions.map(d => d.uploadedBy))]
  const users = await prisma.user.findMany({
    where: { id: { in: uploaderIds } },
    select: { id: true, name: true },
  })
  const userMap = new Map(users.map(u => [u.id, u.name]))

  return versions.map(v => ({
    id: v.id,
    name: v.name,
    fileName: v.fileName,
    fileType: v.fileType,
    fileSize: v.fileSize,
    category: v.category,
    categoryLabel: CATEGORY_LABELS[v.category] || v.category,
    uploadedBy: v.uploadedBy,
    uploaderName: userMap.get(v.uploadedBy) || null,
    createdAt: v.createdAt,
    version: v.version,
    isLatest: v.isLatest,
    parentId: v.parentId,
    visibleToLPs: v.visibleToLPs,
  }))
}

/** Mark a specific version as the latest */
export async function setLatestVersion(documentId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
  if (!MANAGE_ROLES.includes(userRole)) return { error: 'Insufficient permissions' }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, ...notDeleted },
    include: { deal: { select: { fundId: true } } },
  })
  if (!doc) return { error: 'Document not found' }

  if (doc.deal?.fundId) {
    try {
      await requireFundAccess(session.user.id, doc.deal.fundId)
    } catch {
      return { error: 'Access denied' }
    }
  }

  const rootId = doc.parentId || doc.id

  // Unset isLatest on all versions in the chain
  await prisma.document.updateMany({
    where: {
      OR: [
        { id: rootId },
        { parentId: rootId },
      ],
      ...notDeleted,
    },
    data: { isLatest: false },
  })

  // Set this version as latest
  await prisma.document.update({
    where: { id: documentId },
    data: { isLatest: true },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Document',
    entityId: documentId,
    changes: { isLatest: { old: false, new: true } },
  })

  if (doc.dealId) revalidatePath(`/deals/${doc.dealId}`)
  if (doc.investorId) revalidatePath(`/investors/${doc.investorId}`)

  return { success: true }
}
