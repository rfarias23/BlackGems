import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { ITool, ToolContext } from '../../core/types'
import type { ApprovalResult } from '../shared/approval-types'
import { resolveDealName } from '../deals/deal-name-resolver'
import { resolveStageAlias } from '../shared/stage-aliases'

const actionItemSchema = z.object({
  title: z.string(),
  dueDate: z.string().datetime().optional(),
  owner: z.enum(['user', 'counterparty']),
})

const inputSchema = z.object({
  dealName: z.string().optional().describe('Deal or company name (if applicable)'),
  investorName: z.string().optional().describe('Investor/LP name (if the meeting was with an LP)'),
  meetingType: z.enum(['call', 'meeting', 'email', 'site_visit', 'other']),
  meetingDate: z.string().datetime().optional().describe('Meeting date (defaults to now)'),
  extractedSummary: z.string().max(2000).describe('Structured 3-5 sentence summary of the meeting'),
  extractedActions: z.array(actionItemSchema).describe('Action items with owner attribution'),
  draftFollowUpEmail: z.object({
    subject: z.string(),
    body: z.string().max(3000),
  }).optional().describe('Draft follow-up email if appropriate'),
  suggestedStageChange: z.object({
    newStage: z.string(),
    rationale: z.string(),
  }).optional().describe('Suggested stage change if meeting notes indicate progression'),
})

type Input = z.infer<typeof inputSchema>
type Output = ApprovalResult | { error: string } | { ambiguous: true; message: string }

export const logMeetingNoteTool: ITool<Input, Output> = {
  metadata: {
    name: 'logMeetingNote',
    description: 'Log a meeting or call: extracts summary, action items, optional follow-up email draft, and optional stage change suggestion. Requires user approval before executing.',
    category: 'deals',
  },
  inputSchema,
  async execute(input: Input, ctx: ToolContext): Promise<Output> {
    let dealId: string | undefined
    let dealName: string | undefined

    // Resolve deal if provided
    if (input.dealName) {
      const dealResult = await resolveDealName(input.dealName, ctx.fundId)
      if ('ambiguous' in dealResult) {
        return { ambiguous: true, message: `Multiple matches: ${dealResult.candidates.map(c => c.name).join(', ')}. Which one?` }
      }
      if ('notFound' in dealResult) {
        return { error: `Could not find a deal called "${input.dealName}".` }
      }
      dealId = dealResult.dealId
      dealName = dealResult.dealName
    }

    // Resolve stage alias if suggested
    let resolvedStage: string | undefined
    if (input.suggestedStageChange) {
      resolvedStage = resolveStageAlias(input.suggestedStageChange.newStage) ?? undefined
    }

    // Build details
    const details: Record<string, string> = {}
    if (dealName) details['Deal'] = dealName
    details['Type'] = input.meetingType
    details['Summary'] = input.extractedSummary.slice(0, 80) + (input.extractedSummary.length > 80 ? '...' : '')

    const userActions = input.extractedActions.filter(a => a.owner === 'user')
    if (userActions.length > 0) details['My tasks'] = `${userActions.length} action item(s)`
    if (input.draftFollowUpEmail) details['Email draft'] = input.draftFollowUpEmail.subject
    if (resolvedStage) details['Stage change'] = `→ ${resolvedStage}`

    // Create proposal
    const action = await prisma.agentAction.create({
      data: {
        fundId: ctx.fundId,
        conversationId: ctx.conversationId,
        userId: ctx.userId,
        tool: 'log-meeting-note',
        status: 'PROPOSED',
        proposedPayload: {
          dealId,
          dealName,
          meetingType: input.meetingType,
          meetingDate: input.meetingDate ?? new Date().toISOString(),
          extractedSummary: input.extractedSummary,
          extractedActions: input.extractedActions,
          draftFollowUpEmail: input.draftFollowUpEmail,
          suggestedStageChange: resolvedStage ? { newStage: resolvedStage, rationale: input.suggestedStageChange?.rationale } : undefined,
        },
      },
    })

    const summaryParts = ['Log']
    summaryParts.push(input.meetingType)
    if (dealName) summaryParts.push(`— ${dealName}`)
    const summary = summaryParts.join(' ')

    return {
      needsApproval: true,
      actionId: action.id,
      tool: 'log-meeting-note',
      summary,
      details,
    }
  },
}
