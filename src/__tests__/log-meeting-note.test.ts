import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deal: { findMany: vi.fn(), findFirst: vi.fn() },
    agentAction: { create: vi.fn() },
  },
}))

import { logMeetingNoteTool } from '../lib/ai/tools/activities/log-meeting-note'
import { prisma } from '@/lib/prisma'

const mockCtx = { fundId: 'f1', currency: 'USD' as const, userId: 'u1', conversationId: 'c1' }

describe('log-meeting-note tool', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('has correct metadata', () => {
    expect(logMeetingNoteTool.metadata.name).toBe('logMeetingNote')
    expect(logMeetingNoteTool.metadata.category).toBe('deals')
  })

  it('creates a proposal with structured extraction', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { id: 'd1', companyName: 'TechServ LLC', stage: 'INITIAL_REVIEW' },
    ] as never)
    vi.mocked(prisma.agentAction.create).mockResolvedValue({ id: 'aa1' } as never)

    const result = await logMeetingNoteTool.execute({
      dealName: 'TechServ',
      meetingType: 'call',
      extractedSummary: 'Good call with owner. Revenue at $3.2M.',
      extractedActions: [
        { title: 'Send NDA', dueDate: '2026-03-12T00:00:00Z', owner: 'user' },
      ],
    }, mockCtx)

    expect(result).toMatchObject({
      needsApproval: true,
      actionId: 'aa1',
      tool: 'log-meeting-note',
    })
  })

  it('validates meetingType enum', () => {
    const result = logMeetingNoteTool.inputSchema.safeParse({
      dealName: 'Test',
      meetingType: 'invalid',
      extractedSummary: 'test',
      extractedActions: [],
    })
    expect(result.success).toBe(false)
  })

  it('validates action item structure', () => {
    const result = logMeetingNoteTool.inputSchema.safeParse({
      dealName: 'Test',
      meetingType: 'call',
      extractedSummary: 'test',
      extractedActions: [{ title: 'Task', owner: 'user' }],
    })
    expect(result.success).toBe(true)
  })
})
