'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { softDelete, notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { CATEGORY_LABELS } from '@/lib/shared/document-types'
import type { DocumentItem } from '@/lib/shared/document-types'
import fs from 'fs/promises'
import path from 'path'

// Roles that can manage documents
const MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']

/** List documents for a deal */
export async function getDealDocuments(dealId: string): Promise<DocumentItem[]> {
  const session = await auth()
  if (!session?.user) return []

  // Verify deal exists and user has access
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, ...notDeleted },
    select: { fundId: true },
  })
  if (!deal) return []

  try {
    await requireFundAccess(session.user.id!, deal.fundId)
  } catch {
    return []
  }

  const documents = await prisma.document.findMany({
    where: { dealId, ...notDeleted },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch uploader names
  const uploaderIds = [...new Set(documents.map(d => d.uploadedBy))]
  const users = await prisma.user.findMany({
    where: { id: { in: uploaderIds } },
    select: { id: true, name: true },
  })
  const userMap = new Map(users.map(u => [u.id, u.name]))

  return documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    category: doc.category,
    categoryLabel: CATEGORY_LABELS[doc.category] || doc.category,
    uploadedBy: doc.uploadedBy,
    uploaderName: userMap.get(doc.uploadedBy) || null,
    createdAt: doc.createdAt,
  }))
}

/** Delete a document (soft delete + remove file from disk) */
export async function deleteDocument(documentId: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
  if (!MANAGE_ROLES.includes(userRole)) {
    return { error: 'Insufficient permissions' }
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, ...notDeleted },
    include: { deal: { select: { fundId: true, id: true } } },
  })

  if (!doc) {
    return { error: 'Document not found' }
  }

  // Verify fund access
  const fundId = doc.deal?.fundId
  if (fundId) {
    try {
      await requireFundAccess(session.user.id!, fundId)
    } catch {
      return { error: 'Access denied' }
    }
  }

  // Soft delete the record
  await softDelete('document', documentId)

  // Remove file from disk
  try {
    const filePath = path.join(process.cwd(), doc.fileUrl)
    await fs.unlink(filePath)
  } catch {
    // File might already be gone — that's fine
  }

  await logAudit({
    userId: session.user.id!,
    action: 'DELETE',
    entityType: 'Document',
    entityId: documentId,
  })

  if (doc.dealId) {
    revalidatePath(`/deals/${doc.dealId}`)
  }
  if (doc.investorId) {
    revalidatePath(`/investors/${doc.investorId}`)
  }

  return { success: true }
}

/** List documents for an investor */
export async function getInvestorDocuments(investorId: string): Promise<DocumentItem[]> {
  const session = await auth()
  if (!session?.user) return []

  const investor = await prisma.investor.findFirst({
    where: { id: investorId, ...notDeleted },
  })
  if (!investor) return []

  const documents = await prisma.document.findMany({
    where: { investorId, ...notDeleted },
    orderBy: { createdAt: 'desc' },
  })

  const uploaderIds = [...new Set(documents.map(d => d.uploadedBy))]
  const users = await prisma.user.findMany({
    where: { id: { in: uploaderIds } },
    select: { id: true, name: true },
  })
  const userMap = new Map(users.map(u => [u.id, u.name]))

  return documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    category: doc.category,
    categoryLabel: CATEGORY_LABELS[doc.category] || doc.category,
    uploadedBy: doc.uploadedBy,
    uploaderName: userMap.get(doc.uploadedBy) || null,
    createdAt: doc.createdAt,
  }))
}
