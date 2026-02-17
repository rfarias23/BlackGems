'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess, getActiveFundWithCurrency } from '@/lib/shared/fund-access'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { CurrencyCode } from '@/lib/shared/formatters'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

export interface QuarterlySection {
  key: string
  title: string
  content: string
  editable: boolean
}

export interface QuarterlyReport {
  id: string
  title: string
  status: string
  year: number
  quarter: number
  periodStart: Date
  periodEnd: Date
  sections: QuarterlySection[]
  sentToLPs: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// GENERATE QUARTERLY UPDATE
// ============================================================================

const generateSchema = z.object({
  fundId: z.string().min(1),
  year: z.number().int().min(2020).max(2030),
  quarter: z.number().int().min(1).max(4),
})

/** Generate a new quarterly update draft with auto-populated sections */
export async function generateQuarterlyUpdate(fundId: string, year: number, quarter: number) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const validated = generateSchema.safeParse({ fundId, year, quarter })
  if (!validated.success) return { error: validated.error.issues[0]?.message || 'Invalid input' }

  try {
    await requireFundAccess(session.user.id, fundId)
  } catch {
    return { error: 'Access denied' }
  }

  // Calculate period dates
  const quarterStartMonth = (quarter - 1) * 3 // 0, 3, 6, 9
  const periodStart = new Date(year, quarterStartMonth, 1)
  const periodEnd = new Date(year, quarterStartMonth + 3, 0) // Last day of quarter

  const title = `Q${quarter} ${year} Quarterly Update`

  // Gather fund data for auto-population
  const fund = await prisma.fund.findUnique({ where: { id: fundId } })
  if (!fund) return { error: 'Fund not found' }
  const currency = (fund.currency ?? 'USD') as CurrencyCode

  const [commitments, portfolioCompanies, deals] = await Promise.all([
    prisma.commitment.findMany({ where: { fundId, ...notDeleted } }),
    prisma.portfolioCompany.findMany({ where: { fundId } }),
    prisma.deal.findMany({ where: { fundId, ...notDeleted, status: 'ACTIVE' } }),
  ])

  // Capital metrics
  const totalCommitments = commitments.reduce((sum, c) => sum + Number(c.committedAmount), 0)
  const totalCalled = commitments.reduce((sum, c) => sum + Number(c.calledAmount), 0)
  const totalDistributed = commitments.reduce((sum, c) => sum + Number(c.distributedAmount), 0)

  // Portfolio metrics
  const totalInvested = portfolioCompanies.reduce((sum, c) => sum + Number(c.equityInvested), 0)
  const totalValue = portfolioCompanies.reduce((sum, c) => sum + Number(c.totalValue || 0), 0)
  const grossMoic = totalInvested > 0 ? totalValue / totalInvested : 0

  // Build auto-populated sections
  const sections: QuarterlySection[] = [
    {
      key: 'letter',
      title: 'Letter from the Manager',
      content: '',
      editable: true,
    },
    {
      key: 'fund_summary',
      title: 'Fund Summary',
      content: [
        `Fund: ${fund.name}`,
        `Total Commitments: ${formatMoney(totalCommitments, currency)}`,
        `Capital Called: ${formatMoney(totalCalled, currency)} (${totalCommitments > 0 ? formatPercent(totalCalled / totalCommitments) : '0%'})`,
        `Capital Distributed: ${formatMoney(totalDistributed, currency)}`,
        `Gross MOIC: ${formatMultiple(grossMoic)}`,
        `Active Deals: ${deals.length}`,
        `Portfolio Companies: ${portfolioCompanies.length}`,
      ].join('\n'),
      editable: false,
    },
    {
      key: 'portfolio_update',
      title: 'Portfolio Company Updates',
      content: portfolioCompanies.length > 0
        ? portfolioCompanies.map(pc =>
            `${pc.name}: Invested ${formatMoney(Number(pc.equityInvested), currency)}, Current Value ${formatMoney(Number(pc.totalValue || 0), currency)}`
          ).join('\n')
        : 'No portfolio companies to report on.',
      editable: true,
    },
    {
      key: 'capital_summary',
      title: 'Capital Activity',
      content: [
        `Total Commitments: ${formatMoney(totalCommitments, currency)}`,
        `Called to Date: ${formatMoney(totalCalled, currency)}`,
        `Remaining Uncalled: ${formatMoney(totalCommitments - totalCalled, currency)}`,
        `Distributed to Date: ${formatMoney(totalDistributed, currency)}`,
      ].join('\n'),
      editable: false,
    },
    {
      key: 'looking_ahead',
      title: 'Looking Ahead',
      content: '',
      editable: true,
    },
  ]

  // Create Report record
  const report = await prisma.report.create({
    data: {
      fundId,
      type: 'QUARTERLY_UPDATE',
      title,
      periodStart,
      periodEnd,
      content: JSON.parse(JSON.stringify({ year, quarter, sections })),
      status: 'DRAFT',
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Report',
    entityId: report.id,
  })

  revalidatePath('/reports')
  return { success: true, reportId: report.id }
}

// ============================================================================
// GET QUARTERLY UPDATE DRAFT
// ============================================================================

/** Get a quarterly update draft for editing */
export async function getQuarterlyUpdateDraft(reportId: string): Promise<QuarterlyReport | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const report = await prisma.report.findUnique({
    where: { id: reportId },
  })
  if (!report) return null

  try {
    await requireFundAccess(session.user.id, report.fundId)
  } catch {
    return null
  }

  const content = report.content as { year: number; quarter: number; sections: QuarterlySection[] } | null

  return {
    id: report.id,
    title: report.title,
    status: report.status,
    year: content?.year || 0,
    quarter: content?.quarter || 0,
    periodStart: report.periodStart || new Date(),
    periodEnd: report.periodEnd || new Date(),
    sections: content?.sections || [],
    sentToLPs: report.sentToLPs,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }
}

// ============================================================================
// UPDATE SECTION
// ============================================================================

const updateSectionSchema = z.object({
  reportId: z.string().min(1),
  sectionKey: z.string().min(1),
  content: z.string(),
})

/** Update a single section of a quarterly update */
export async function updateQuarterlySection(reportId: string, sectionKey: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const validated = updateSectionSchema.safeParse({ reportId, sectionKey, content })
  if (!validated.success) return { error: validated.error.issues[0]?.message || 'Invalid input' }

  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) return { error: 'Report not found' }

  try {
    await requireFundAccess(session.user.id, report.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  if (report.status !== 'DRAFT' && report.status !== 'REVIEW') {
    return { error: 'Cannot edit a published report' }
  }

  const reportContent = report.content as { year: number; quarter: number; sections: QuarterlySection[] } | null
  if (!reportContent?.sections) return { error: 'Report has no sections' }

  const sectionIndex = reportContent.sections.findIndex(s => s.key === sectionKey)
  if (sectionIndex === -1) return { error: 'Section not found' }

  reportContent.sections[sectionIndex].content = content

  await prisma.report.update({
    where: { id: reportId },
    data: { content: JSON.parse(JSON.stringify(reportContent)) },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Report',
    entityId: reportId,
    changes: { [`section.${sectionKey}`]: { old: '[previous]', new: '[updated]' } },
  })

  revalidatePath('/reports')
  return { success: true }
}

// ============================================================================
// APPROVE & PUBLISH
// ============================================================================

const approveSchema = z.object({
  reportId: z.string().min(1),
})

/** Approve and publish a quarterly update */
export async function approveAndPublish(reportId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const validated = approveSchema.safeParse({ reportId })
  if (!validated.success) return { error: validated.error.issues[0]?.message || 'Invalid input' }

  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) return { error: 'Report not found' }

  try {
    await requireFundAccess(session.user.id, report.fundId)
  } catch {
    return { error: 'Access denied' }
  }

  if (report.status === 'PUBLISHED') {
    return { error: 'Report is already published' }
  }

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: session.user.id,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Report',
    entityId: reportId,
    changes: { status: { old: report.status, new: 'PUBLISHED' } },
  })

  revalidatePath('/reports')
  return { success: true }
}

// ============================================================================
// LIST REPORTS
// ============================================================================

export interface ReportListItem {
  id: string
  type: string
  title: string
  status: string
  periodStart: Date | null
  periodEnd: Date | null
  publishedAt: Date | null
  sentToLPs: boolean
  createdAt: Date
}

/** List all reports for the fund */
export async function listReports(): Promise<ReportListItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const { fundId } = await getActiveFundWithCurrency(session.user.id!)

  try {
    await requireFundAccess(session.user.id, fundId)
  } catch {
    return []
  }

  const reports = await prisma.report.findMany({
    where: { fundId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      publishedAt: true,
      sentToLPs: true,
      createdAt: true,
    },
  })

  return reports
}
