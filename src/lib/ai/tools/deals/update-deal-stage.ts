import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { ITool, ToolContext } from '../../core/types'
import type { ApprovalResult } from '../shared/approval-types'
import { resolveDealName } from './deal-name-resolver'
import { resolveStageAlias } from '../shared/stage-aliases'

const inputSchema = z.object({
  dealName: z.string().describe('The name (or partial name) of the deal to update'),
  newStage: z.string().describe('The target stage — accepts natural language like "IOI", "under LOI", "dead"'),
  note: z.string().max(2000).optional().describe('Optional activity note to log'),
  followUpDate: z.string().optional().describe('ISO8601 date for follow-up task'),
  followUpNote: z.string().max(500).optional().describe('What to follow up on'),
})

type Input = z.infer<typeof inputSchema>
type Output = ApprovalResult | { error: string } | { ambiguous: true; message: string }

export const updateDealStageTool: ITool<Input, Output> = {
  metadata: {
    name: 'updateDealStage',
    description: 'Move a deal to a new pipeline stage, optionally add a note and follow-up task. Requires user approval before executing.',
    category: 'deals',
  },
  inputSchema,
  async execute(input: Input, ctx: ToolContext): Promise<Output> {
    // 1. Resolve stage alias
    const resolvedStage = resolveStageAlias(input.newStage)
    if (!resolvedStage) {
      return { error: `Could not resolve "${input.newStage}" to a valid deal stage. Try: IOI, Under LOI, Due Diligence, Closed Won, Dead, On Hold, etc.` }
    }

    // 2. Resolve deal name
    const dealResult = await resolveDealName(input.dealName, ctx.fundId)

    if ('notFound' in dealResult) {
      return { error: `Could not find a deal called "${input.dealName}". What is the full company name?` }
    }

    if ('ambiguous' in dealResult) {
      const names = dealResult.candidates.map(c => c.name).join(', ')
      return { ambiguous: true, message: `Multiple matches: ${names}. Which one did you mean?` }
    }

    // 3. Build details for approval card
    const details: Record<string, string> = {
      'Deal': dealResult.dealName,
      'New stage': resolvedStage,
    }
    if (input.note) details['Note'] = input.note.slice(0, 100) + (input.note.length > 100 ? '...' : '')
    if (input.followUpNote) details['Follow-up'] = input.followUpNote
    if (input.followUpDate) details['Due'] = new Date(input.followUpDate).toLocaleDateString()

    // 4. Create AgentAction proposal
    const action = await prisma.agentAction.create({
      data: {
        fundId: ctx.fundId,
        conversationId: ctx.conversationId,
        userId: ctx.userId,
        tool: 'update-deal-stage',
        status: 'PROPOSED',
        proposedPayload: {
          dealId: dealResult.dealId,
          dealName: dealResult.dealName,
          newStage: resolvedStage,
          note: input.note,
          followUpDate: input.followUpDate,
          followUpNote: input.followUpNote,
        },
      },
    })

    return {
      needsApproval: true,
      actionId: action.id,
      tool: 'update-deal-stage',
      summary: `Move ${dealResult.dealName} → ${resolvedStage}`,
      details,
    }
  },
}
