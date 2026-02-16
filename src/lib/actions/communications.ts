'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { notDeleted } from '@/lib/shared/soft-delete'
import { sendInvestorEmail } from '@/lib/email'
import { renderEmailTemplate, type TemplateType } from '@/lib/email-templates'
import type { CommunicationType, CommunicationDirection } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CommunicationItem {
  id: string
  type: CommunicationType
  direction: CommunicationDirection
  subject: string | null
  content: string | null
  date: Date
  contactName: string | null
  sentBy: string | null
  followUpDate: Date | null
  followUpDone: boolean
  notes: string | null
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const bulkCommunicationSchema = z.object({
  recipientIds: z.array(z.string().min(1)).min(1, 'At least one recipient is required'),
  templateType: z.enum(['capital_call', 'distribution', 'quarterly_update', 'custom']),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
})

const logCommunicationSchema = z.object({
  type: z.enum(['EMAIL', 'CALL', 'MEETING', 'VIDEO_CALL', 'TEXT', 'OTHER']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  subject: z.string().optional(),
  content: z.string().optional(),
  contactName: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================================================
// SEND BULK COMMUNICATION
// ============================================================================

/**
 * Send a bulk email communication to multiple investors.
 * Creates Communication records for each successfully sent email.
 */
export async function sendBulkCommunication(
  fundId: string,
  data: {
    recipientIds: string[]
    templateType: TemplateType
    subject: string
    body: string
  }
): Promise<{ success?: boolean; sentCount?: number; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  try {
    await requireFundAccess(session.user.id, fundId)
  } catch {
    return { error: 'Access denied' }
  }

  const parsed = bulkCommunicationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Validation failed' }
  }

  const { recipientIds, templateType, subject, body } = parsed.data

  // Query investors by IDs — filter to those with email and active commitments in the fund
  const investors = await prisma.investor.findMany({
    where: {
      id: { in: recipientIds },
      ...notDeleted,
      OR: [
        { email: { not: null } },
        { contactEmail: { not: null } },
      ],
      commitments: {
        some: {
          fundId,
          ...notDeleted,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      contactEmail: true,
    },
  })

  if (investors.length === 0) {
    return { error: 'No eligible recipients found with email addresses and active commitments' }
  }

  const userName = (session.user as { name?: string }).name || 'Unknown'
  let sentCount = 0

  // Get fund name for template rendering
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    select: { name: true },
  })
  const fundName = fund?.name || 'Fund'

  for (const investor of investors) {
    const recipientEmail = investor.contactEmail || investor.email
    if (!recipientEmail) continue

    try {
      // Render template or use custom content
      let emailSubject = subject
      let emailHtml = body

      if (templateType !== 'custom') {
        const rendered = renderEmailTemplate(templateType, {
          fundName,
          investorName: investor.name,
          customSubject: subject,
          customBody: body,
        })
        emailSubject = rendered.subject
        emailHtml = rendered.html
      }

      // Send email
      const emailResult = await sendInvestorEmail({
        to: recipientEmail,
        subject: emailSubject,
        investorName: investor.name,
        message: templateType === 'custom' ? body : emailHtml,
      })

      if (!emailResult.success) {
        console.error(`Failed to send email to ${recipientEmail}:`, emailResult.error)
        continue
      }

      // Create Communication record
      await prisma.communication.create({
        data: {
          investorId: investor.id,
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: emailSubject,
          content: body,
          date: new Date(),
          sentBy: userName,
        },
      })

      sentCount++
    } catch (error) {
      console.error(`Error sending to investor ${investor.id}:`, error)
      // Continue to next recipient
    }
  }

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Communication',
    entityId: fundId,
    changes: {
      type: { old: '', new: 'BULK_EMAIL' },
      templateType: { old: '', new: templateType },
      sentCount: { old: 0, new: sentCount },
      recipientCount: { old: 0, new: investors.length },
    },
  })

  revalidatePath('/investors')

  return { success: true, sentCount }
}

// ============================================================================
// GET COMMUNICATION HISTORY
// ============================================================================

/**
 * Get the communication history for a specific investor.
 * Returns all logged communications ordered by date descending.
 */
export async function getCommunicationHistory(
  investorId: string
): Promise<{ data: CommunicationItem[] } | { error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  // Get investor to determine fundId for access check
  const investor = await prisma.investor.findFirst({
    where: { id: investorId, ...notDeleted },
    select: {
      id: true,
      commitments: {
        where: { ...notDeleted },
        select: { fundId: true },
        take: 1,
      },
    },
  })

  if (!investor) {
    return { error: 'Investor not found' }
  }

  // Check fund access if investor has commitments
  if (investor.commitments.length > 0) {
    try {
      await requireFundAccess(session.user.id, investor.commitments[0].fundId)
    } catch {
      return { error: 'Access denied' }
    }
  }

  const communications = await prisma.communication.findMany({
    where: { investorId },
    orderBy: { date: 'desc' },
  })

  const data: CommunicationItem[] = communications.map((c) => ({
    id: c.id,
    type: c.type,
    direction: c.direction,
    subject: c.subject,
    content: c.content,
    date: c.date,
    contactName: c.contactName,
    sentBy: c.sentBy,
    followUpDate: c.followUpDate,
    followUpDone: c.followUpDone,
    notes: c.notes,
  }))

  return { data }
}

// ============================================================================
// LOG COMMUNICATION
// ============================================================================

/**
 * Manually log a communication (call, meeting, etc.) for an investor.
 */
export async function logCommunication(
  investorId: string,
  data: {
    type: CommunicationType
    direction: CommunicationDirection
    subject?: string
    content?: string
    contactName?: string
    followUpDate?: string
    notes?: string
  }
): Promise<{ success?: boolean; id?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  // Get investor to determine fundId for access check
  const investor = await prisma.investor.findFirst({
    where: { id: investorId, ...notDeleted },
    select: {
      id: true,
      commitments: {
        where: { ...notDeleted },
        select: { fundId: true },
        take: 1,
      },
    },
  })

  if (!investor) {
    return { error: 'Investor not found' }
  }

  // Check fund access if investor has commitments
  if (investor.commitments.length > 0) {
    try {
      await requireFundAccess(session.user.id, investor.commitments[0].fundId)
    } catch {
      return { error: 'Access denied' }
    }
  }

  const parsed = logCommunicationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Validation failed' }
  }

  const { type, direction, subject, content, contactName, followUpDate, notes } = parsed.data
  const userName = (session.user as { name?: string }).name || 'Unknown'

  try {
    const communication = await prisma.communication.create({
      data: {
        investorId,
        type,
        direction,
        subject: subject || null,
        content: content || null,
        date: new Date(),
        contactName: contactName || null,
        sentBy: userName,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Communication',
      entityId: communication.id,
      changes: {
        type: { old: '', new: type },
        direction: { old: '', new: direction },
        investorId: { old: '', new: investorId },
      },
    })

    revalidatePath(`/investors/${investorId}`)

    return { success: true, id: communication.id }
  } catch (error) {
    console.error('Error logging communication:', error)
    return { error: 'Failed to log communication' }
  }
}
