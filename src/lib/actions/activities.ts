'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ActivityType } from '@prisma/client'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { notDeleted } from '@/lib/shared/soft-delete'
import type { TimelineEvent } from '@/lib/shared/activity-types'

const MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']

/** Log a manual activity (call, meeting, note, etc.) for a deal */
export async function createDealActivity(dealId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) {
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

  const type = formData.get('type') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!type || !title) {
    return { error: 'Type and title are required' }
  }

  if (!Object.values(ActivityType).includes(type as ActivityType)) {
    return { error: 'Invalid activity type' }
  }

  try {
    const activity = await prisma.activity.create({
      data: {
        dealId,
        userId: session.user.id!,
        type: type as ActivityType,
        title,
        description,
      },
    })

    await logAudit({
      userId: session.user.id!,
      action: 'CREATE',
      entityType: 'Activity',
      entityId: activity.id,
    })

    revalidatePath(`/deals/${dealId}`)
    return { success: true }
  } catch (error) {
    console.error('Error creating activity:', error)
    return { error: 'Failed to log activity' }
  }
}

/** Get combined timeline: manual activities + system audit events for a deal */
export async function getDealTimeline(dealId: string): Promise<TimelineEvent[]> {
  const session = await auth()
  if (!session?.user) return []

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

  // Fetch manual activities
  const activities = await prisma.activity.findMany({
    where: { dealId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true } } },
  })

  // Fetch system audit logs for this deal
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: { in: ['Deal', 'Document', 'DealContact', 'Activity'] }, entityId: dealId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true } } },
  })

  // Also fetch audit logs for documents/contacts that belong to this deal
  const dealDocIds = await prisma.document.findMany({
    where: { dealId, deletedAt: null },
    select: { id: true },
  })
  const dealContactIds = await prisma.dealContact.findMany({
    where: { dealId },
    select: { id: true },
  })
  const relatedIds = [
    ...dealDocIds.map(d => d.id),
    ...dealContactIds.map(c => c.id),
  ]

  let relatedLogs: typeof auditLogs = []
  if (relatedIds.length > 0) {
    relatedLogs = await prisma.auditLog.findMany({
      where: { entityId: { in: relatedIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true } } },
    })
  }

  // Build timeline events
  const events: TimelineEvent[] = []

  // Manual activities
  for (const a of activities) {
    events.push({
      id: `activity-${a.id}`,
      kind: 'activity',
      type: a.type,
      title: a.title,
      description: a.description,
      userName: a.user.name,
      createdAt: a.createdAt,
    })
  }

  // System events from audit logs
  const allAuditLogs = [...auditLogs, ...relatedLogs]
  const seenIds = new Set<string>()
  for (const log of allAuditLogs) {
    if (seenIds.has(log.id)) continue
    seenIds.add(log.id)

    // Skip Activity CREATE logs to avoid duplicates with manual activities
    if (log.entityType === 'Activity' && log.action === 'CREATE') continue

    const title = formatAuditTitle(log.action, log.entityType, log.changes as Record<string, unknown> | null)
    events.push({
      id: `audit-${log.id}`,
      kind: 'system',
      type: `${log.action}_${log.entityType}`,
      title,
      description: null,
      userName: log.user?.name || null,
      createdAt: log.createdAt,
    })
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return events.slice(0, 50)
}

function formatAuditTitle(action: string, entityType: string, changes: Record<string, unknown> | null): string {
  const entity = entityType === 'DealContact' ? 'contact' : entityType.toLowerCase()

  switch (action) {
    case 'CREATE':
      return `Added new ${entity}`
    case 'UPDATE': {
      if (changes && typeof changes === 'object') {
        const fields = Object.keys(changes)
        if (fields.length <= 3) {
          return `Updated ${entity} ${fields.join(', ')}`
        }
        return `Updated ${entity} (${fields.length} fields)`
      }
      return `Updated ${entity}`
    }
    case 'DELETE':
      return `Removed ${entity}`
    default:
      return `${action} ${entity}`
  }
}
