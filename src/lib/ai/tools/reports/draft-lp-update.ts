import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { ITool, ToolContext } from '../../core/types'
import type { ApprovalResult } from '../shared/approval-types'
import { assembleLPUpdateContext } from './lp-update-context-assembler'

const inputSchema = z.object({
  periodType: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'annual', 'monthly', 'custom']).describe('Report period'),
  year: z.number().int().describe('Report year'),
  tone: z.enum(['formal', 'conversational']).default('formal').describe('Writing tone'),
  customHighlights: z.string().max(2000).optional().describe('Specific points to include'),
  sections: z.array(z.object({
    key: z.string(),
    title: z.string(),
    content: z.string(),
    editable: z.boolean().default(true),
  })).optional().describe('The generated LP update sections — filled by Emma after reviewing fund data'),
})

type Input = z.infer<typeof inputSchema>
type Output = ApprovalResult | { error: string } | { context: unknown; instructions: string }

export const draftLPUpdateTool: ITool<Input, Output> = {
  metadata: {
    name: 'draftLPUpdate',
    description: 'Draft a quarterly LP update letter from live fund data. First call assembles fund context. Second call (with sections populated) creates the draft for approval.',
    category: 'operations',
  },
  inputSchema,
  async execute(input: Input, ctx: ToolContext): Promise<Output> {
    // If sections are provided, this is the save-proposal step
    if (input.sections && input.sections.length > 0) {
      const action = await prisma.agentAction.create({
        data: {
          fundId: ctx.fundId,
          conversationId: ctx.conversationId,
          userId: ctx.userId,
          tool: 'draft-lp-update',
          status: 'PROPOSED',
          proposedPayload: {
            period: { type: input.periodType, year: input.year },
            sections: input.sections,
          },
        },
      })

      return {
        needsApproval: true,
        actionId: action.id,
        tool: 'draft-lp-update',
        summary: `Save ${input.periodType} ${input.year} LP Update as draft`,
        details: {
          'Period': `${input.periodType} ${input.year}`,
          'Sections': `${input.sections.length}`,
          'Tone': input.tone,
        },
      }
    }

    // First call: assemble context and return it for the model to use
    const context = await assembleLPUpdateContext(ctx.fundId, {
      type: input.periodType,
      year: input.year,
    })

    if ('error' in context) {
      return { error: context.error }
    }

    return {
      context,
      instructions: `Use this fund data to draft a ${input.tone} LP update for ${context.periodLabel}. ${input.customHighlights ? `Include these highlights: ${input.customHighlights}` : ''} Follow the Stanford GSB format: 1) Opening Letter, 2) Fund Summary, 3) Deal Activity, 4) Portfolio Update, 5) Financial Summary, 6) Outlook, 7) Closing. After drafting, call this tool again with the sections array populated to propose saving the draft.`,
    }
  },
}
