'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { logAudit } from '@/lib/shared/audit'
import { revalidatePath } from 'next/cache'
import { notDeleted } from '@/lib/shared/soft-delete'
import { DealStage } from '@prisma/client'
import { canTransitionDealStage } from '@/lib/shared/stage-transitions'

// ============================================================================
// CREATE (called by write tools during proposal phase)
// ============================================================================

export async function createAgentAction(input: {
  fundId: string
  conversationId: string
  tool: string
  proposedPayload: Record<string, unknown>
  costUsd?: number
}): Promise<{ success: true; actionId: string } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    await requireFundAccess(session.user.id, input.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  const action = await prisma.agentAction.create({
    data: {
      fundId: input.fundId,
      conversationId: input.conversationId,
      userId: session.user.id,
      tool: input.tool,
      status: 'PROPOSED',
      proposedPayload: input.proposedPayload,
      costUsd: input.costUsd ?? null,
    },
  })

  return { success: true, actionId: action.id }
}

// ============================================================================
// APPROVE (called by AIApprovalCard on user confirmation)
// ============================================================================

export async function approveAgentAction(
  actionId: string,
  editedPayload?: Record<string, unknown>
): Promise<{ success: true; resultEntityId?: string } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const action = await prisma.agentAction.findUnique({ where: { id: actionId } })
  if (!action) return { error: 'Action not found' }
  if (action.status !== 'PROPOSED') return { error: 'Action is not pending approval' }

  try {
    await requireFundAccess(session.user.id, action.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  const payload = (editedPayload ?? action.proposedPayload) as Record<string, unknown>
  const status = editedPayload ? 'EDITED' : 'APPROVED'

  try {
    const resultEntityId = await executeWriteAction(action.tool, payload, action.fundId, session.user.id)

    await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status,
        finalPayload: payload,
        resultEntityId,
        resolvedAt: new Date(),
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'AgentAction',
      entityId: actionId,
      changes: { status: { old: 'PROPOSED', new: status } },
    })

    revalidatePath('/deals')
    revalidatePath('/reports')
    return { success: true, resultEntityId: resultEntityId ?? undefined }
  } catch (error) {
    console.error('Failed to execute agent action:', error)
    return { error: 'Failed to execute action' }
  }
}

// ============================================================================
// REJECT
// ============================================================================

export async function rejectAgentAction(
  actionId: string
): Promise<{ success: true } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const action = await prisma.agentAction.findUnique({ where: { id: actionId } })
  if (!action) return { error: 'Action not found' }
  if (action.status !== 'PROPOSED') return { error: 'Action is not pending approval' }

  try {
    await requireFundAccess(session.user.id, action.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  await prisma.agentAction.update({
    where: { id: actionId },
    data: { status: 'REJECTED', resolvedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'AgentAction',
    entityId: actionId,
    changes: { status: { old: 'PROPOSED', new: 'REJECTED' } },
  })

  return { success: true }
}

// ============================================================================
// WRITE EXECUTION DISPATCHER
// ============================================================================

async function executeWriteAction(
  tool: string,
  payload: Record<string, unknown>,
  fundId: string,
  userId: string
): Promise<string | null> {
  switch (tool) {
    case 'update-deal-stage':
      return executeUpdateDealStage(payload, fundId, userId)
    case 'log-meeting-note':
      return executeLogMeetingNote(payload, fundId, userId)
    case 'draft-lp-update':
      return executeDraftLPUpdate(payload, fundId, userId)
    default:
      throw new Error(`Unknown write tool: ${tool}`)
  }
}

// --- W1: Update Deal Stage ---
async function executeUpdateDealStage(
  payload: Record<string, unknown>,
  fundId: string,
  userId: string
): Promise<string> {
  const dealId = payload.dealId as string
  const newStage = payload.newStage as DealStage
  const note = payload.note as string | undefined
  const followUpDate = payload.followUpDate as string | undefined
  const followUpNote = payload.followUpNote as string | undefined

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, fundId, ...notDeleted },
    select: { id: true, stage: true, companyName: true },
  })
  if (!deal) throw new Error('Deal not found')

  if (!canTransitionDealStage(deal.stage, newStage)) {
    throw new Error(`Cannot transition from ${deal.stage} to ${newStage}`)
  }

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({ where: { id: dealId }, data: { stage: newStage } })

    await tx.activity.create({
      data: {
        userId,
        dealId,
        type: 'STAGE_CHANGE',
        title: `Stage changed to ${newStage}`,
        description: `Moved from ${deal.stage} to ${newStage} via Emma`,
      },
    })

    if (note) {
      await tx.activity.create({
        data: { userId, dealId, type: 'NOTE', title: 'Emma note', description: note },
      })
    }

    if (followUpNote) {
      await tx.task.create({
        data: {
          dealId,
          title: followUpNote,
          assigneeId: userId,
          createdById: userId,
          dueDate: followUpDate ? new Date(followUpDate) : null,
          priority: 'MEDIUM',
        },
      })
    }
  })

  await logAudit({
    userId, action: 'UPDATE', entityType: 'Deal', entityId: dealId,
    changes: { stage: { old: deal.stage, new: newStage }, source: { old: null, new: 'emma' } },
  })

  return dealId
}

// --- W2: Log Meeting Note ---
async function executeLogMeetingNote(
  payload: Record<string, unknown>,
  fundId: string,
  userId: string
): Promise<string> {
  const dealId = payload.dealId as string | undefined
  const investorId = payload.investorId as string | undefined
  const meetingType = payload.meetingType as string
  const summary = payload.extractedSummary as string
  const actions = payload.extractedActions as Array<{ title: string; dueDate?: string; owner: string }> | undefined
  const emailDraft = payload.draftFollowUpEmail as { subject: string; body: string } | undefined
  const stageChange = payload.suggestedStageChange as { newStage: DealStage } | undefined

  let resultId = ''

  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: {
        userId,
        dealId: dealId ?? null,
        type: meetingType === 'call' ? 'CALL' : meetingType === 'site_visit' ? 'SITE_VISIT' : 'MEETING',
        title: `${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)} logged via Emma`,
        description: summary,
      },
    })
    resultId = activity.id

    const userActions = (actions ?? []).filter(a => a.owner === 'user')
    for (const action of userActions) {
      await tx.task.create({
        data: {
          dealId: dealId ?? null,
          title: action.title,
          assigneeId: userId,
          createdById: userId,
          dueDate: action.dueDate ? new Date(action.dueDate) : null,
          priority: 'MEDIUM',
        },
      })
    }

    if (emailDraft) {
      if (investorId) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true } })
        await tx.communication.create({
          data: {
            investorId,
            type: 'EMAIL',
            direction: 'OUTBOUND',
            subject: emailDraft.subject,
            content: emailDraft.body,
            date: new Date(),
            status: 'DRAFT',
            sentBy: user?.name ?? null,
          },
        })
      } else {
        console.warn(`Email draft skipped — investor not resolved for meeting note`)
      }
    }

    if (stageChange?.newStage && dealId) {
      const deal = await tx.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { stage: true },
      })
      if (deal && canTransitionDealStage(deal.stage, stageChange.newStage)) {
        await tx.deal.update({ where: { id: dealId }, data: { stage: stageChange.newStage } })
        await tx.activity.create({
          data: {
            userId,
            dealId,
            type: 'STAGE_CHANGE',
            title: `Stage changed to ${stageChange.newStage}`,
            description: 'Auto-suggested by Emma based on meeting notes',
          },
        })
      }
    }
  })

  await logAudit({
    userId, action: 'CREATE', entityType: 'Activity', entityId: resultId,
    changes: { source: { old: null, new: 'emma' }, meetingType: { old: null, new: meetingType } },
  })

  return resultId
}

// --- W3: Draft LP Update ---
async function executeDraftLPUpdate(
  payload: Record<string, unknown>,
  fundId: string,
  userId: string
): Promise<string> {
  const period = payload.period as { type: string; year: number; label?: string }
  const sections = payload.sections as Array<{ key: string; title: string; content: string; editable: boolean }>

  const quarter = period.type.startsWith('Q') ? parseInt(period.type.slice(1)) : 1
  const quarterStartMonth = (quarter - 1) * 3
  const periodStart = new Date(period.year, quarterStartMonth, 1)
  const periodEnd = new Date(period.year, quarterStartMonth + 3, 0)

  const title = period.label ?? `${period.type} ${period.year} LP Update`

  const report = await prisma.report.create({
    data: {
      fundId,
      type: 'QUARTERLY_UPDATE',
      title,
      periodStart,
      periodEnd,
      content: JSON.parse(JSON.stringify({ year: period.year, quarter, sections })),
      status: 'DRAFT',
    },
  })

  await logAudit({
    userId, action: 'CREATE', entityType: 'Report', entityId: report.id,
    changes: { source: { old: null, new: 'emma' }, period: { old: null, new: `${period.type} ${period.year}` } },
  })

  return report.id
}
