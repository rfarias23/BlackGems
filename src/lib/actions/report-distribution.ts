'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { notDeleted } from '@/lib/shared/soft-delete'
import { sendInvestorEmail } from '@/lib/email'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

interface DistributeOptions {
  recipientIds?: string[]
  customSubject?: string
  customMessage?: string
}

interface DistributeResult {
  success?: boolean
  recipientCount?: number
  error?: string
}

interface DistributionPreview {
  recipientCount: number
  recipientNames: string[]
  defaultSubject: string
  reportTitle: string
}

// ============================================================================
// DISTRIBUTE REPORT
// ============================================================================

const distributeSchema = z.object({
  reportId: z.string().min(1),
})

/**
 * Distribute a published report to LPs via email notification.
 * Sends a notification directing investors to the portal — does NOT attach PDFs.
 */
export async function distributeReport(
  reportId: string,
  options?: DistributeOptions
): Promise<DistributeResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const validated = distributeSchema.safeParse({ reportId })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid input' }
  }

  // Find report with fund relation
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { fund: { select: { id: true, name: true } } },
  })

  if (!report) return { error: 'Report not found' }

  if (report.status !== 'PUBLISHED') {
    return { error: 'Report must be published before distribution' }
  }

  try {
    await requireFundAccess(session.user.id, report.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  const fundName = report.fund.name

  // Get all investors with active commitments for this fund who have email addresses
  const investors = await prisma.investor.findMany({
    where: {
      deletedAt: null,
      email: { not: null },
      commitments: { some: { fundId: report.fundId, ...notDeleted } },
    },
    select: { id: true, name: true, email: true },
  })

  // Filter to requested recipients if provided, otherwise send to all
  const recipients = options?.recipientIds
    ? investors.filter((inv) => options.recipientIds!.includes(inv.id))
    : investors

  if (recipients.length === 0) {
    return { error: 'No eligible recipients found' }
  }

  // Build email content
  const subject = options?.customSubject || `${report.title} — ${fundName}`

  let successCount = 0

  for (const investor of recipients) {
    if (!investor.email) continue

    const message =
      options?.customMessage ||
      `Your quarterly update for ${fundName} is now available.\n\nPlease log in to the investor portal to view the full report.\n\nBest regards,\n${fundName} Team`

    try {
      const result = await sendInvestorEmail({
        to: investor.email,
        subject,
        investorName: investor.name,
        message,
      })
      if (result.success) {
        successCount++
      }
    } catch (emailError) {
      console.error(`Failed to send report email to ${investor.name}:`, emailError)
    }
  }

  // Update report as sent
  await prisma.report.update({
    where: { id: reportId },
    data: {
      sentToLPs: true,
      sentAt: new Date(),
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Report',
    entityId: reportId,
    changes: {
      sentToLPs: { old: false, new: true },
      recipientCount: { old: 0, new: successCount },
    },
  })

  revalidatePath('/reports')
  return { success: true, recipientCount: successCount }
}

// ============================================================================
// DISTRIBUTION PREVIEW
// ============================================================================

/**
 * Get distribution preview info — recipient count, names, default subject.
 * Used to show confirmation UI before sending.
 */
export async function getDistributionPreview(
  reportId: string
): Promise<DistributionPreview | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { fund: { select: { id: true, name: true } } },
  })

  if (!report) return null

  try {
    await requireFundAccess(session.user.id, report.fundId)
  } catch {
    return null
  }

  const investors = await prisma.investor.findMany({
    where: {
      deletedAt: null,
      email: { not: null },
      commitments: { some: { fundId: report.fundId, ...notDeleted } },
    },
    select: { id: true, name: true },
  })

  return {
    recipientCount: investors.length,
    recipientNames: investors.map((inv) => inv.name),
    defaultSubject: `${report.title} — ${report.fund.name}`,
    reportTitle: report.title,
  }
}
