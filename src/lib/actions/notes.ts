'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { notDeleted } from '@/lib/shared/soft-delete'

const MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']

export async function getDealNotes(dealId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

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

  const notes = await prisma.comment.findMany({
    where: { dealId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  })

  return notes.map((n) => ({
    id: n.id,
    content: n.content,
    userId: n.userId,
    userName: n.user.name,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }))
}

export async function createDealNote(dealId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
  if (!MANAGE_ROLES.includes(userRole)) {
    return { error: 'Insufficient permissions' }
  }

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, ...notDeleted },
    select: { fundId: true },
  })
  if (!deal) {
    return { error: 'Deal not found' }
  }

  try {
    await requireFundAccess(session.user.id!, deal.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  const content = (formData.get('content') as string)?.trim()
  if (!content) {
    return { error: 'Note content is required' }
  }

  try {
    const note = await prisma.comment.create({
      data: {
        dealId,
        userId: session.user.id!,
        content,
      },
    })

    await logAudit({
      userId: session.user.id!,
      action: 'CREATE',
      entityType: 'Comment',
      entityId: note.id,
    })

    revalidatePath(`/deals/${dealId}`)
    return { success: true }
  } catch (error) {
    console.error('Error creating note:', error)
    return { error: 'Failed to create note' }
  }
}

export async function deleteDealNote(noteId: string, dealId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
  if (!MANAGE_ROLES.includes(userRole)) {
    return { error: 'Insufficient permissions' }
  }

  const note = await prisma.comment.findFirst({
    where: { id: noteId, dealId },
    include: { deal: { select: { fundId: true } } },
  })
  if (!note || !note.deal) {
    return { error: 'Note not found' }
  }

  try {
    await requireFundAccess(session.user.id!, note.deal.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  try {
    await prisma.comment.delete({
      where: { id: noteId },
    })

    await logAudit({
      userId: session.user.id!,
      action: 'DELETE',
      entityType: 'Comment',
      entityId: noteId,
    })

    revalidatePath(`/deals/${dealId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    return { error: 'Failed to delete note' }
  }
}
