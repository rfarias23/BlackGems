# Emma Write Tools Phase 2 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three write tools (update-deal-stage, log-meeting-note, draft-lp-update) to Emma with an inline approval flow — the AI never writes without explicit user confirmation.

**Architecture:** Write tools return proposals (not mutations). An `AgentAction` model tracks every proposal. An inline `AIApprovalCard` renders in the chat. On user approval, a server action executes the writes and logs audit. The streaming route passes `conversationId` to tool context so proposals link to conversations.

**Tech Stack:** Next.js 15, AI SDK v6 (`streamText`), Prisma 6, Zod, TypeScript strict, Tailwind CSS 4

**Source Spec:** `docs/superpowers/specs/2026-03-10-emma-write-tools-phase2-design.md`

---

## Pre-Implementation Verifications (COMPLETED)

| # | Verification | Result |
|---|---|---|
| 1 | `createQuarterlyUpdate` server action exists? | **No** — named `generateQuarterlyUpdate` in `src/lib/actions/quarterly-updates.ts`. Creates a `Report` with auto-populated sections. W3 needs a separate `saveDraftLPUpdate` function that saves AI-generated sections. **Flagged as additional scope.** |
| 2 | `conversationId` on `AgentAction` is `String` non-nullable? | **Confirmed** — will be `conversationId String` in the migration. |

---

## File Structure

### New Files

| # | File | Responsibility |
|---|------|---------------|
| 1 | `src/lib/actions/agent-actions.ts` | AgentAction CRUD: create proposal, approve (execute writes), reject |
| 2 | `src/lib/ai/tools/shared/approval-types.ts` | `IWriteTool` interface, `ApprovalResult` type, `WriteToolContext` |
| 3 | `src/lib/ai/tools/shared/stage-aliases.ts` | Natural language → `DealStage` enum mapping |
| 4 | `src/lib/ai/tools/deals/deal-name-resolver.ts` | Fuzzy deal name → `dealId` with disambiguation |
| 5 | `src/lib/ai/tools/deals/update-deal-stage.ts` | W1 tool definition |
| 6 | `src/lib/ai/tools/activities/log-meeting-note.ts` | W2 tool definition |
| 7 | `src/lib/ai/tools/reports/lp-update-context-assembler.ts` | W3 data assembly from 6 sources |
| 8 | `src/lib/ai/tools/reports/draft-lp-update.ts` | W3 tool definition |
| 9 | `src/lib/ai/prompt/sections/write-capabilities.ts` | System prompt: write rules |
| 10 | `src/lib/ai/prompt/sections/financial-guardrails.ts` | System prompt: no independent calculations |
| 11 | `src/components/ai/ai-approval-card.tsx` | Inline approval UI (pending/approved/rejected/executing) |
| 12 | `src/__tests__/agent-actions.test.ts` | AgentAction CRUD + approval tests |
| 13 | `src/__tests__/stage-aliases.test.ts` | Alias resolution tests |
| 14 | `src/__tests__/deal-name-resolver.test.ts` | Fuzzy match tests |
| 15 | `src/__tests__/update-deal-stage.test.ts` | W1 schema + proposal tests |
| 16 | `src/__tests__/log-meeting-note.test.ts` | W2 schema + extraction tests |
| 17 | `src/__tests__/lp-update-context-assembler.test.ts` | W3 context assembly tests |
| 18 | `src/__tests__/draft-lp-update.test.ts` | W3 schema + draft tests |

### Modified Files

| # | File | Change |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Add `AgentAction` model, `AgentActionStatus` enum, `CommunicationStatus` enum + field on `Communication` |
| 2 | `src/lib/ai/core/types.ts` | Add `conversationId` to `ToolContext` |
| 3 | `src/lib/ai/tools/create-default-registry.ts` | Register 3 write tools |
| 4 | `src/lib/ai/core/engine.ts` | Wire 2 new prompt sections, accept `conversationId` in `EngineInput` |
| 5 | `src/app/api/chat/route.ts` | Pass `conversationId` to tool context |
| 6 | `src/components/ai/ai-tool-result.tsx` | Detect `needsApproval` in tool output, render `AIApprovalCard` |
| 7 | `src/lib/actions/quarterly-updates.ts` | Add `saveDraftLPUpdate()` for AI-generated reports **(additional scope)** |

---

## Chunk 1: Schema + Foundation

### Task 1: Prisma Schema — AgentAction Model + CommunicationStatus

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/XXXXXX_add_agent_action_and_communication_status/migration.sql` (auto-generated)

- [ ] **Step 1: Add AgentActionStatus enum and AgentAction model to schema.prisma**

Add after the `Message` model (around line 1441):

```prisma
enum AgentActionStatus {
  PROPOSED
  APPROVED
  REJECTED
  EDITED
}

model AgentAction {
  id              String            @id @default(cuid())
  fundId          String
  conversationId  String
  userId          String
  tool            String
  status          AgentActionStatus @default(PROPOSED)
  proposedPayload Json
  finalPayload    Json?
  resultEntityId  String?
  costUsd         Float?
  createdAt       DateTime          @default(now())
  resolvedAt      DateTime?
  fund            Fund              @relation(fields: [fundId], references: [id], onDelete: Cascade)
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([fundId])
  @@index([conversationId])
  @@index([userId])
  @@index([status])
}
```

Add the `agentActions AgentAction[]` relation field to the `Fund`, `User`, and `Conversation` models.

Also add the Conversation relation to AgentAction:
```prisma
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
```

- [ ] **Step 2: Add CommunicationStatus enum and status field to Communication model**

```prisma
enum CommunicationStatus {
  DRAFT
  SENT
  FAILED
}
```

Add to `Communication` model:
```prisma
  status      CommunicationStatus @default(SENT)
```

Existing communications get `SENT` as default — correct since they were all created by manual user action.

- [ ] **Step 3: Generate and apply migration**

Run: `npx prisma migrate dev --name add_agent_action_and_communication_status`
Expected: Migration created and applied successfully.

- [ ] **Step 4: Verify Prisma client generation**

Run: `npx prisma generate`
Expected: Prisma client generated. `AgentAction`, `AgentActionStatus`, `CommunicationStatus` available in types.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(schema): add AgentAction model and CommunicationStatus enum"
```

---

### Task 2: AgentAction Server Actions

**Files:**
- Create: `src/lib/actions/agent-actions.ts`
- Test: `src/__tests__/agent-actions.test.ts`

- [ ] **Step 1: Write failing tests for AgentAction CRUD**

Create `src/__tests__/agent-actions.test.ts`. Mock `@/lib/prisma`, `@/lib/auth`, `@/lib/shared/fund-access`, `@/lib/shared/audit`. Test cases:

1. `createAgentAction` — creates record with PROPOSED status, returns `{ success: true, actionId }`
2. `approveAgentAction` — updates status to APPROVED, sets `resolvedAt`, returns `{ success: true }`
3. `approveAgentAction` — returns error if action not found
4. `approveAgentAction` — returns error if action not in PROPOSED status
5. `rejectAgentAction` — updates status to REJECTED, sets `resolvedAt`
6. Auth guard: returns error if `!session?.user?.id`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agentAction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deal: { findFirst: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn() },
    task: { create: vi.fn() },
    report: { create: vi.fn() },
    communication: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/shared/fund-access', () => ({ requireFundAccess: vi.fn() }))
vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  computeChanges: vi.fn().mockReturnValue({}),
}))

import { createAgentAction, approveAgentAction, rejectAgentAction } from '../lib/actions/agent-actions'
import { auth } from '@/lib/auth'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { prisma } from '@/lib/prisma'

describe('agent-actions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('createAgentAction', () => {
    it('creates PROPOSED action and returns actionId', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.create).mockResolvedValue({ id: 'aa1' } as never)

      const result = await createAgentAction({
        fundId: 'f1',
        conversationId: 'c1',
        tool: 'update-deal-stage',
        proposedPayload: { dealId: 'd1', newStage: 'UNDER_LOI' },
      })
      expect(result).toEqual({ success: true, actionId: 'aa1' })
    })

    it('rejects unauthorized users', async () => {
      vi.mocked(auth).mockResolvedValue(null as never)
      const result = await createAgentAction({
        fundId: 'f1', conversationId: 'c1', tool: 'test', proposedPayload: {},
      })
      expect(result).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('approveAgentAction', () => {
    it('updates status to APPROVED', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.findUnique).mockResolvedValue({
        id: 'aa1', status: 'PROPOSED', tool: 'update-deal-stage',
        fundId: 'f1', userId: 'u1', proposedPayload: { dealId: 'd1', newStage: 'IOI_SUBMITTED' },
      } as never)
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never)
      vi.mocked(prisma.agentAction.update).mockResolvedValue({ id: 'aa1' } as never)

      const result = await approveAgentAction('aa1')
      expect(requireFundAccess).toHaveBeenCalledWith('u1', 'f1')
      expect(result).toEqual(expect.objectContaining({ success: true }))
    })

    it('rejects if action not in PROPOSED status', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.findUnique).mockResolvedValue({
        id: 'aa1', status: 'APPROVED', tool: 'test', fundId: 'f1', userId: 'u1',
      } as never)

      const result = await approveAgentAction('aa1')
      expect(result).toEqual({ error: 'Action is not pending approval' })
    })
  })

  describe('rejectAgentAction', () => {
    it('updates status to REJECTED', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
      vi.mocked(prisma.agentAction.findUnique).mockResolvedValue({
        id: 'aa1', status: 'PROPOSED', fundId: 'f1', userId: 'u1',
      } as never)
      vi.mocked(prisma.agentAction.update).mockResolvedValue({ id: 'aa1' } as never)

      const result = await rejectAgentAction('aa1')
      expect(result).toEqual({ success: true })
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/agent-actions.test.ts`
Expected: FAIL — module `../lib/actions/agent-actions` not found.

- [ ] **Step 3: Implement AgentAction server actions**

Create `src/lib/actions/agent-actions.ts`:

```typescript
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
    // Update stage
    await tx.deal.update({ where: { id: dealId }, data: { stage: newStage } })

    // Log stage change activity
    await tx.activity.create({
      data: {
        userId,
        dealId,
        type: 'STAGE_CHANGE',
        title: `Stage changed to ${newStage}`,
        description: `Moved from ${deal.stage} to ${newStage} via Emma`,
      },
    })

    // Optional: note activity
    if (note) {
      await tx.activity.create({
        data: { userId, dealId, type: 'NOTE', title: 'Emma note', description: note },
      })
    }

    // Optional: follow-up task
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
  const actions = payload.extractedActions as Array<{ title: string; dueDate?: string; owner: string }>
  const emailDraft = payload.draftFollowUpEmail as { subject: string; body: string } | undefined
  const stageChange = payload.suggestedStageChange as { newStage: DealStage } | undefined

  let resultId = ''

  await prisma.$transaction(async (tx) => {
    // Activity record (dealId is optional — works for investor-only meetings too)
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

    // Tasks for user-owned actions
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

    // Email draft (Communication)
    // Note: sentBy is a name field, not a foreign key — resolve user name first
    if (emailDraft && investorId) {
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
    }

    // Stage change (if approved by user)
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/agent-actions.test.ts`
Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/agent-actions.ts src/__tests__/agent-actions.test.ts
git commit -m "feat(emma): AgentAction server actions with write execution dispatcher"
```

---

### Task 3: Approval Types + ToolContext Extension

**Files:**
- Create: `src/lib/ai/tools/shared/approval-types.ts`
- Modify: `src/lib/ai/core/types.ts`

- [ ] **Step 1: Create approval types**

Create `src/lib/ai/tools/shared/approval-types.ts`:

```typescript
export interface ApprovalResult {
  needsApproval: true
  actionId: string
  tool: string
  summary: string
  details: Record<string, string>
}

export interface WriteToolMetadata {
  name: string
  description: string
  category: 'deals' | 'capital' | 'investors' | 'portfolio' | 'operations'
  isWriteTool: true
}
```

- [ ] **Step 2: Add `conversationId` to ToolContext**

Modify `src/lib/ai/core/types.ts` — add `conversationId` field:

```typescript
export interface ToolContext {
  fundId: string
  currency: CurrencyCode
  userId: string
  conversationId: string
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/tools/shared/approval-types.ts src/lib/ai/core/types.ts
git commit -m "feat(emma): approval types and conversationId in ToolContext"
```

---

## Chunk 2: UI + Approval Flow Wiring

### Task 4: AIApprovalCard Component

**Files:**
- Create: `src/components/ai/ai-approval-card.tsx`

- [ ] **Step 1: Create AIApprovalCard component**

Create `src/components/ai/ai-approval-card.tsx`. Stealth Wealth design. Four states: pending, executing, approved, rejected.

```typescript
'use client'

import { useState } from 'react'
import { approveAgentAction, rejectAgentAction } from '@/lib/actions/agent-actions'

interface AIApprovalCardProps {
  actionId: string
  tool: string
  summary: string
  details: Record<string, string>
}

const TOOL_LABELS: Record<string, string> = {
  'update-deal-stage': 'DEAL UPDATE',
  'log-meeting-note': 'MEETING LOG',
  'draft-lp-update': 'LP UPDATE DRAFT',
}

type CardStatus = 'pending' | 'executing' | 'approved' | 'rejected'

export function AIApprovalCard({ actionId, tool, summary, details }: AIApprovalCardProps) {
  const [status, setStatus] = useState<CardStatus>('pending')
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setStatus('executing')
    setError(null)
    const result = await approveAgentAction(actionId)
    if ('error' in result) {
      setError(result.error)
      setStatus('pending')
      return
    }
    setStatus('approved')
  }

  async function handleReject() {
    const result = await rejectAgentAction(actionId)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setStatus('rejected')
  }

  // Collapsed states
  if (status === 'approved') {
    return (
      <div className="bg-[#1E293B]/50 border border-[#334155] rounded-lg px-4 py-2 my-2">
        <span className="text-sm text-[#94A3B8]">Executed — {summary}</span>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="bg-[#1E293B]/30 border border-[#334155]/50 rounded-lg px-4 py-2 my-2">
        <span className="text-sm text-[#64748B]">Cancelled</span>
      </div>
    )
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg my-2 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <span className="text-[10px] tracking-wider uppercase text-[#64748B] font-medium">
          {TOOL_LABELS[tool] ?? tool}
        </span>
      </div>

      {/* Summary */}
      <div className="px-4 pb-2">
        <p className="text-sm text-white">{summary}</p>
      </div>

      {/* Details */}
      <div className="px-4 pb-3">
        <div className="space-y-1">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-[#94A3B8]">{key}</span>
              <span className="text-white font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {status === 'executing' ? (
          <div className="h-8 flex-1 rounded bg-[#334155] animate-pulse" />
        ) : (
          <>
            <button
              onClick={handleApprove}
              className="px-4 py-1.5 rounded text-sm font-medium bg-[#B8960C] text-black hover:bg-[#D4AD0E] transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-1.5 rounded text-sm font-medium border border-[#334155] text-[#94A3B8] hover:border-[#475569] transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai/ai-approval-card.tsx
git commit -m "feat(emma): AIApprovalCard component with stealth wealth design"
```

---

### Task 5: Wire Approval Flow — Route + Tool Result Rendering

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/lib/ai/core/engine.ts`
- Modify: `src/components/ai/ai-tool-result.tsx`

- [ ] **Step 1: Render AIApprovalCard for write tool results**

> **Note:** Engine and route changes for `conversationId` are consolidated in Task 13, Step 2-3 to avoid duplication.

In `src/components/ai/ai-tool-result.tsx`, add detection of `needsApproval` in the tool output and render `AIApprovalCard`:

Import at top:
```typescript
import { AIApprovalCard } from './ai-approval-card'
```

In the `AIToolResult` function, add an early return BEFORE the existing wrapper `<div>`. This is critical — the approval card has its own `bg-[#1E293B]` styling and must not be nested inside the existing `bg-[#111827]` wrapper:

```typescript
export function AIToolResult({ part }: AIToolResultProps) {
  // Early return for approval cards — no wrapper div (card has its own styling)
  if (part.state === 'output-available' && part.output) {
    const output = part.output as Record<string, unknown>
    if (output.needsApproval === true) {
      return (
        <AIApprovalCard
          actionId={output.actionId as string}
          tool={output.tool as string}
          summary={output.summary as string}
          details={output.details as Record<string, string>}
        />
      )
    }
  }

  const toolName = part.toolName
  const isLoading = part.state === 'input-streaming' || part.state === 'input-available'

  // Existing rendering logic (unchanged)...
  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-3 my-2">
      {/* ... existing code unchanged ... */}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build passes with zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts src/lib/ai/core/engine.ts src/components/ai/ai-tool-result.tsx
git commit -m "feat(emma): wire approval flow — conversationId in context, approval card rendering"
```

---

## Chunk 3: W1 — update-deal-stage

### Task 6: Stage Alias Map

**Files:**
- Create: `src/lib/ai/tools/shared/stage-aliases.ts`
- Test: `src/__tests__/stage-aliases.test.ts`

- [ ] **Step 1: Write failing tests for stage alias resolution**

Create `src/__tests__/stage-aliases.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { resolveStageAlias } from '../lib/ai/tools/shared/stage-aliases'

describe('resolveStageAlias', () => {
  // Exact enum values
  it('accepts exact DealStage enum values', () => {
    expect(resolveStageAlias('IOI_SUBMITTED')).toBe('IOI_SUBMITTED')
    expect(resolveStageAlias('CLOSED_WON')).toBe('CLOSED_WON')
  })

  // Natural language aliases
  it('resolves "dead" to CLOSED_LOST', () => {
    expect(resolveStageAlias('dead')).toBe('CLOSED_LOST')
  })
  it('resolves "not interested" to CLOSED_LOST', () => {
    expect(resolveStageAlias('not interested')).toBe('CLOSED_LOST')
  })
  it('resolves "passed" to PASSED', () => {
    expect(resolveStageAlias('passed')).toBe('PASSED')
  })
  it('resolves "under LOI" to LOI_NEGOTIATION', () => {
    expect(resolveStageAlias('under LOI')).toBe('LOI_NEGOTIATION')
  })
  it('resolves "LOI signed" to LOI_NEGOTIATION', () => {
    expect(resolveStageAlias('LOI signed')).toBe('LOI_NEGOTIATION')
  })
  it('resolves "IOI" to IOI_SUBMITTED', () => {
    expect(resolveStageAlias('IOI')).toBe('IOI_SUBMITTED')
  })
  it('resolves "management meeting" to MANAGEMENT_MEETING', () => {
    expect(resolveStageAlias('management meeting')).toBe('MANAGEMENT_MEETING')
  })
  it('resolves "due diligence" to DUE_DILIGENCE', () => {
    expect(resolveStageAlias('due diligence')).toBe('DUE_DILIGENCE')
  })
  it('resolves "in DD" to DUE_DILIGENCE', () => {
    expect(resolveStageAlias('in DD')).toBe('DUE_DILIGENCE')
  })
  it('resolves "closed" to CLOSED_WON', () => {
    expect(resolveStageAlias('closed')).toBe('CLOSED_WON')
  })
  it('resolves "acquired" to CLOSED_WON', () => {
    expect(resolveStageAlias('acquired')).toBe('CLOSED_WON')
  })
  it('resolves "initial contact" to INITIAL_REVIEW', () => {
    expect(resolveStageAlias('initial contact')).toBe('INITIAL_REVIEW')
  })
  it('resolves "NDA signed" to NDA_SIGNED', () => {
    expect(resolveStageAlias('NDA signed')).toBe('NDA_SIGNED')
  })
  it('resolves "on hold" to ON_HOLD', () => {
    expect(resolveStageAlias('on hold')).toBe('ON_HOLD')
  })

  // Case insensitive
  it('is case insensitive', () => {
    expect(resolveStageAlias('DEAD')).toBe('CLOSED_LOST')
    expect(resolveStageAlias('Under LOI')).toBe('LOI_NEGOTIATION')
  })

  // Unknown returns null
  it('returns null for unknown aliases', () => {
    expect(resolveStageAlias('banana')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/stage-aliases.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement stage alias resolver**

Create `src/lib/ai/tools/shared/stage-aliases.ts`:

```typescript
import { DealStage } from '@prisma/client'

/**
 * Maps natural language stage references to DealStage enum values.
 * Used by Emma to resolve fuzzy user input like "move to LOI" into the
 * correct enum value for the stage transition.
 */
const STAGE_ALIASES: Record<string, DealStage> = {
  // CLOSED_LOST
  'dead': DealStage.CLOSED_LOST,
  'not interested': DealStage.CLOSED_LOST,
  'lost': DealStage.CLOSED_LOST,
  'no go': DealStage.CLOSED_LOST,

  // PASSED
  'passed': DealStage.PASSED,
  'pass': DealStage.PASSED,
  'skip': DealStage.PASSED,

  // LOI_NEGOTIATION (spec maps "under LOI" here)
  'under loi': DealStage.LOI_NEGOTIATION,
  'loi signed': DealStage.LOI_NEGOTIATION,
  'loi': DealStage.LOI_NEGOTIATION,

  // IOI_SUBMITTED
  'ioi': DealStage.IOI_SUBMITTED,
  'ioi submitted': DealStage.IOI_SUBMITTED,
  'indication of interest': DealStage.IOI_SUBMITTED,

  // MANAGEMENT_MEETING
  'management meeting': DealStage.MANAGEMENT_MEETING,
  'met the team': DealStage.MANAGEMENT_MEETING,
  'met management': DealStage.MANAGEMENT_MEETING,

  // DUE_DILIGENCE
  'due diligence': DealStage.DUE_DILIGENCE,
  'in dd': DealStage.DUE_DILIGENCE,
  'dd': DealStage.DUE_DILIGENCE,
  'diligencing': DealStage.DUE_DILIGENCE,

  // CLOSED_WON
  'closed': DealStage.CLOSED_WON,
  'done': DealStage.CLOSED_WON,
  'acquired': DealStage.CLOSED_WON,
  'closed won': DealStage.CLOSED_WON,

  // INITIAL_REVIEW
  'initial contact': DealStage.INITIAL_REVIEW,
  'first call done': DealStage.INITIAL_REVIEW,
  'initial review': DealStage.INITIAL_REVIEW,

  // NDA_SIGNED
  'nda signed': DealStage.NDA_SIGNED,
  'under nda': DealStage.NDA_SIGNED,
  'nda': DealStage.NDA_SIGNED,

  // ON_HOLD
  'on hold': DealStage.ON_HOLD,
  'paused': DealStage.ON_HOLD,
  'hold': DealStage.ON_HOLD,

  // SITE_VISIT
  'site visit': DealStage.SITE_VISIT,
  'visited': DealStage.SITE_VISIT,

  // CLOSING
  'closing': DealStage.CLOSING,
  'final negotiation': DealStage.FINAL_NEGOTIATION,

  // IDENTIFIED
  'identified': DealStage.IDENTIFIED,
  'new': DealStage.IDENTIFIED,

  // LOI_PREPARATION
  'loi prep': DealStage.LOI_PREPARATION,
  'preparing loi': DealStage.LOI_PREPARATION,
}

/**
 * Resolves a natural language stage reference to a DealStage enum value.
 * Returns null if no match found.
 */
export function resolveStageAlias(input: string): DealStage | null {
  const normalized = input.toLowerCase().trim()

  // Direct enum match
  if (Object.values(DealStage).includes(normalized.toUpperCase() as DealStage)) {
    return normalized.toUpperCase() as DealStage
  }

  return STAGE_ALIASES[normalized] ?? null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/stage-aliases.test.ts`
Expected: All 18 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/shared/stage-aliases.ts src/__tests__/stage-aliases.test.ts
git commit -m "feat(emma): stage alias resolver — natural language to DealStage mapping"
```

---

### Task 7: Fuzzy Deal Name Resolver

**Files:**
- Create: `src/lib/ai/tools/deals/deal-name-resolver.ts`
- Test: `src/__tests__/deal-name-resolver.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/deal-name-resolver.test.ts`. Test cases:
1. Exact match by name
2. Case-insensitive match
3. Partial match (substring)
4. Token-based match ("TechServ" matches "TechServ LLC")
5. Ambiguous match (2+ candidates) → returns `{ ambiguous: true, candidates: [...] }`
6. No match → returns `{ notFound: true }`
7. Match by deal ID (cuid passthrough)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deal: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}))

import { resolveDealName } from '../lib/ai/tools/deals/deal-name-resolver'
import { prisma } from '@/lib/prisma'

const mockDeals = [
  { id: 'd1', companyName: 'TechServ LLC', stage: 'INITIAL_REVIEW' },
  { id: 'd2', companyName: 'TechServ Holdings', stage: 'NDA_SIGNED' },
  { id: 'd3', companyName: 'Alpine Bakery', stage: 'IOI_SUBMITTED' },
  { id: 'd4', companyName: 'DataFlow Systems', stage: 'DUE_DILIGENCE' },
]

describe('resolveDealName', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns exact match', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('Alpine Bakery', 'fund1')
    expect(result).toEqual({ dealId: 'd3', dealName: 'Alpine Bakery' })
  })

  it('is case-insensitive', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('alpine bakery', 'fund1')
    expect(result).toEqual({ dealId: 'd3', dealName: 'Alpine Bakery' })
  })

  it('matches partial name (substring)', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('DataFlow', 'fund1')
    expect(result).toEqual({ dealId: 'd4', dealName: 'DataFlow Systems' })
  })

  it('returns ambiguous when multiple matches', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('TechServ', 'fund1')
    expect(result).toEqual({
      ambiguous: true,
      candidates: [
        { id: 'd1', name: 'TechServ LLC' },
        { id: 'd2', name: 'TechServ Holdings' },
      ],
    })
  })

  it('returns notFound when no matches', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    const result = await resolveDealName('Nonexistent Corp', 'fund1')
    expect(result).toEqual({ notFound: true, query: 'Nonexistent Corp' })
  })

  it('resolves by deal ID passthrough', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue(mockDeals as never)
    vi.mocked(prisma.deal.findFirst).mockResolvedValue({ id: 'd1', companyName: 'TechServ LLC' } as never)
    const result = await resolveDealName('d1', 'fund1')
    expect(result).toEqual({ dealId: 'd1', dealName: 'TechServ LLC' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/deal-name-resolver.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement fuzzy deal name resolver**

Create `src/lib/ai/tools/deals/deal-name-resolver.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'

type ResolveResult =
  | { dealId: string; dealName: string }
  | { ambiguous: true; candidates: Array<{ id: string; name: string }> }
  | { notFound: true; query: string }

export async function resolveDealName(
  nameOrId: string,
  fundId: string
): Promise<ResolveResult> {
  const query = nameOrId.trim()

  // Load all active deals for the fund (typically < 100)
  const deals = await prisma.deal.findMany({
    where: { fundId, status: { in: ['ACTIVE', 'ON_HOLD'] }, ...notDeleted },
    select: { id: true, companyName: true, stage: true },
    orderBy: { companyName: 'asc' },
  })

  // 1. Try ID passthrough (if query looks like a cuid)
  if (query.length > 20 && !query.includes(' ')) {
    const byId = await prisma.deal.findFirst({
      where: { id: query, fundId, ...notDeleted },
      select: { id: true, companyName: true },
    })
    if (byId) return { dealId: byId.id, dealName: byId.companyName }
  }

  const lower = query.toLowerCase()

  // 2. Exact match (case-insensitive)
  const exactMatch = deals.find(d => d.companyName.toLowerCase() === lower)
  if (exactMatch) return { dealId: exactMatch.id, dealName: exactMatch.companyName }

  // 3. Substring match
  const substringMatches = deals.filter(d =>
    d.companyName.toLowerCase().includes(lower) ||
    lower.includes(d.companyName.toLowerCase())
  )

  // 4. Token match — split query into words and match against deal name tokens
  const queryTokens = lower.split(/\s+/)
  const tokenMatches = substringMatches.length === 0
    ? deals.filter(d => {
        const dealTokens = d.companyName.toLowerCase().split(/\s+/)
        return queryTokens.some(qt => dealTokens.some(dt => dt.startsWith(qt) || qt.startsWith(dt)))
      })
    : substringMatches

  if (tokenMatches.length === 1) {
    return { dealId: tokenMatches[0].id, dealName: tokenMatches[0].companyName }
  }

  if (tokenMatches.length > 1) {
    return {
      ambiguous: true,
      candidates: tokenMatches.map(d => ({ id: d.id, name: d.companyName })),
    }
  }

  return { notFound: true, query }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/deal-name-resolver.test.ts`
Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/deals/deal-name-resolver.ts src/__tests__/deal-name-resolver.test.ts
git commit -m "feat(emma): fuzzy deal name resolver with disambiguation"
```

---

### Task 8: W1 — update-deal-stage Tool

**Files:**
- Create: `src/lib/ai/tools/deals/update-deal-stage.ts`
- Test: `src/__tests__/update-deal-stage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/update-deal-stage.test.ts`. Test the tool's `execute()` method — it should create an `AgentAction` proposal and return an `ApprovalResult`, NOT execute writes.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deal: { findMany: vi.fn(), findFirst: vi.fn() },
    agentAction: { create: vi.fn() },
  },
}))

import { updateDealStageTool } from '../lib/ai/tools/deals/update-deal-stage'
import { prisma } from '@/lib/prisma'

const mockCtx = { fundId: 'f1', currency: 'USD' as const, userId: 'u1', conversationId: 'c1' }

describe('update-deal-stage tool', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('has correct metadata', () => {
    expect(updateDealStageTool.metadata.name).toBe('updateDealStage')
    expect(updateDealStageTool.metadata.category).toBe('deals')
  })

  it('creates a proposal with resolved deal and stage', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { id: 'd1', companyName: 'TechServ LLC', stage: 'INITIAL_REVIEW' },
    ] as never)
    vi.mocked(prisma.agentAction.create).mockResolvedValue({ id: 'aa1' } as never)

    const result = await updateDealStageTool.execute(
      { dealName: 'TechServ', newStage: 'IOI', note: 'Good call' },
      mockCtx
    )

    expect(result).toMatchObject({
      needsApproval: true,
      actionId: 'aa1',
      tool: 'update-deal-stage',
    })
    expect((result as { summary: string }).summary).toContain('TechServ LLC')
  })

  it('returns error if deal not found', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([] as never)

    const result = await updateDealStageTool.execute(
      { dealName: 'Nonexistent', newStage: 'IOI' },
      mockCtx
    )

    expect(result).toMatchObject({ error: expect.stringContaining('not find') })
  })

  it('returns error if stage alias is invalid', async () => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { id: 'd1', companyName: 'TechServ LLC', stage: 'INITIAL_REVIEW' },
    ] as never)

    const result = await updateDealStageTool.execute(
      { dealName: 'TechServ', newStage: 'banana_stage' },
      mockCtx
    )

    expect(result).toMatchObject({ error: expect.stringContaining('stage') })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/update-deal-stage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement update-deal-stage tool**

Create `src/lib/ai/tools/deals/update-deal-stage.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/update-deal-stage.test.ts`
Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/deals/update-deal-stage.ts src/__tests__/update-deal-stage.test.ts
git commit -m "feat(emma): W1 update-deal-stage tool with fuzzy resolution and approval"
```

---

## Chunk 4: W2 — log-meeting-note

### Task 9: W2 — log-meeting-note Tool

**Files:**
- Create: `src/lib/ai/tools/activities/log-meeting-note.ts`
- Test: `src/__tests__/log-meeting-note.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/log-meeting-note.test.ts`. Test the tool's `execute()` — it should parse raw notes, build structured extraction (via the payload shape Claude will populate), and create a proposal.

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/log-meeting-note.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement log-meeting-note tool**

Create `src/lib/ai/tools/activities/log-meeting-note.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/log-meeting-note.test.ts`
Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/activities/log-meeting-note.ts src/__tests__/log-meeting-note.test.ts
git commit -m "feat(emma): W2 log-meeting-note tool with structured extraction and approval"
```

---

## Chunk 5: W3 — draft-lp-update

### Task 10: LP Update Context Assembler

**Files:**
- Create: `src/lib/ai/tools/reports/lp-update-context-assembler.ts`
- Test: `src/__tests__/lp-update-context-assembler.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/lp-update-context-assembler.test.ts`. The context assembler gathers data from 6 sources and returns a structured context package.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fund: { findUnique: vi.fn() },
    commitment: { findMany: vi.fn() },
    portfolioCompany: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    investor: { findMany: vi.fn() },
    activity: { findMany: vi.fn() },
  },
}))

import { assembleLPUpdateContext } from '../lib/ai/tools/reports/lp-update-context-assembler'
import { prisma } from '@/lib/prisma'

describe('assembleLPUpdateContext', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('assembles context from all sources', async () => {
    vi.mocked(prisma.fund.findUnique).mockResolvedValue({
      id: 'f1', name: 'Test Fund', targetSize: 10000000, currency: 'USD',
    } as never)
    vi.mocked(prisma.commitment.findMany).mockResolvedValue([
      { committedAmount: 5000000, calledAmount: 2000000, distributedAmount: 500000 },
    ] as never)
    vi.mocked(prisma.portfolioCompany.findMany).mockResolvedValue([
      { name: 'PortCo1', equityInvested: 1000000, totalValue: 1500000 },
    ] as never)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { companyName: 'Deal1', stage: 'IOI_SUBMITTED', status: 'ACTIVE' },
    ] as never)
    vi.mocked(prisma.investor.findMany).mockResolvedValue([
      { name: 'LP1', type: 'INDIVIDUAL' },
    ] as never)
    vi.mocked(prisma.activity.findMany).mockResolvedValue([] as never)

    const result = await assembleLPUpdateContext('f1', { type: 'Q1', year: 2026 })

    expect(result.fundName).toBe('Test Fund')
    expect(result.totalCommitments).toBe(5000000)
    expect(result.portfolioCompanies).toHaveLength(1)
    expect(result.activeDeals).toHaveLength(1)
    expect(result.investorCount).toBe(1)
  })

  it('returns error if fund not found', async () => {
    vi.mocked(prisma.fund.findUnique).mockResolvedValue(null as never)
    const result = await assembleLPUpdateContext('bad-id', { type: 'Q1', year: 2026 })
    expect(result).toMatchObject({ error: 'Fund not found' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lp-update-context-assembler.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement context assembler**

Create `src/lib/ai/tools/reports/lp-update-context-assembler.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { CurrencyCode } from '@/lib/shared/formatters'

interface PeriodInput {
  type: string // "Q1", "Q2", "Q3", "Q4", "annual", "monthly", "custom"
  year: number
}

export interface LPUpdateContext {
  fundName: string
  currency: CurrencyCode
  periodLabel: string
  totalCommitments: number
  totalCalled: number
  totalDistributed: number
  dryPowder: number
  grossMoic: number
  portfolioCompanies: Array<{ name: string; invested: number; currentValue: number }>
  activeDeals: Array<{ name: string; stage: string }>
  investorCount: number
  recentMilestones: string[]
  formatted: {
    totalCommitments: string
    totalCalled: string
    totalDistributed: string
    dryPowder: string
    grossMoic: string
    deploymentPercent: string
  }
}

export async function assembleLPUpdateContext(
  fundId: string,
  period: PeriodInput
): Promise<LPUpdateContext | { error: string }> {
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    select: { id: true, name: true, targetSize: true, currency: true },
  })
  if (!fund) return { error: 'Fund not found' }

  const currency = (fund.currency ?? 'USD') as CurrencyCode

  // Parallel data assembly
  const [commitments, portfolioCompanies, deals, investors, activities] = await Promise.all([
    prisma.commitment.findMany({
      where: { fundId, ...notDeleted },
      select: { committedAmount: true, calledAmount: true, distributedAmount: true },
    }),
    prisma.portfolioCompany.findMany({
      where: { fundId, ...notDeleted },
      select: { name: true, equityInvested: true, totalValue: true },
    }),
    prisma.deal.findMany({
      where: { fundId, status: { in: ['ACTIVE', 'ON_HOLD'] }, ...notDeleted },
      select: { companyName: true, stage: true },
      orderBy: { updatedAt: 'desc' }, take: 20,
    }),
    prisma.investor.findMany({
      where: { commitments: { some: { fundId, ...notDeleted } }, ...notDeleted },
      select: { name: true, type: true },
    }),
    prisma.activity.findMany({
      where: { deal: { fundId }, type: { in: ['STAGE_CHANGE', 'SITE_VISIT'] } },
      select: { title: true, description: true, createdAt: true },
      orderBy: { createdAt: 'desc' }, take: 10,
    }),
  ])

  const totalCommitments = commitments.reduce((s, c) => s + Number(c.committedAmount), 0)
  const totalCalled = commitments.reduce((s, c) => s + Number(c.calledAmount), 0)
  const totalDistributed = commitments.reduce((s, c) => s + Number(c.distributedAmount), 0)
  const dryPowder = totalCommitments - totalCalled
  const totalInvested = portfolioCompanies.reduce((s, c) => s + Number(c.equityInvested), 0)
  const totalValue = portfolioCompanies.reduce((s, c) => s + Number(c.totalValue ?? 0), 0)
  const grossMoic = totalInvested > 0 ? totalValue / totalInvested : 0

  const periodLabel = period.type.startsWith('Q')
    ? `Q${period.type.slice(1)} ${period.year}`
    : `${period.type} ${period.year}`

  return {
    fundName: fund.name,
    currency,
    periodLabel,
    totalCommitments,
    totalCalled,
    totalDistributed,
    dryPowder,
    grossMoic,
    portfolioCompanies: portfolioCompanies.map(pc => ({
      name: pc.name,
      invested: Number(pc.equityInvested),
      currentValue: Number(pc.totalValue ?? 0),
    })),
    activeDeals: deals.map(d => ({ name: d.companyName, stage: d.stage })),
    investorCount: investors.length,
    recentMilestones: activities.map(a => a.title),
    formatted: {
      totalCommitments: formatMoney(totalCommitments, currency),
      totalCalled: formatMoney(totalCalled, currency),
      totalDistributed: formatMoney(totalDistributed, currency),
      dryPowder: formatMoney(dryPowder, currency),
      grossMoic: formatMultiple(grossMoic),
      deploymentPercent: totalCommitments > 0 ? formatPercent(totalCalled / totalCommitments) : '0%',
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lp-update-context-assembler.test.ts`
Expected: All 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/reports/lp-update-context-assembler.ts src/__tests__/lp-update-context-assembler.test.ts
git commit -m "feat(emma): W3 LP update context assembler — 6 data sources"
```

---

### Task 11: W3 — draft-lp-update Tool

**Files:**
- Create: `src/lib/ai/tools/reports/draft-lp-update.ts`
- Test: `src/__tests__/draft-lp-update.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/draft-lp-update.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fund: { findUnique: vi.fn() },
    commitment: { findMany: vi.fn() },
    portfolioCompany: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    investor: { findMany: vi.fn() },
    activity: { findMany: vi.fn() },
    agentAction: { create: vi.fn() },
  },
}))

import { draftLPUpdateTool } from '../lib/ai/tools/reports/draft-lp-update'
import { prisma } from '@/lib/prisma'

const mockCtx = { fundId: 'f1', currency: 'USD' as const, userId: 'u1', conversationId: 'c1' }

describe('draft-lp-update tool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.fund.findUnique).mockResolvedValue({
      id: 'f1', name: 'Test Fund', targetSize: 10000000, currency: 'USD',
    } as never)
    vi.mocked(prisma.commitment.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.portfolioCompany.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.deal.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.investor.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.activity.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.agentAction.create).mockResolvedValue({ id: 'aa1' } as never)
  })

  it('has correct metadata', () => {
    expect(draftLPUpdateTool.metadata.name).toBe('draftLPUpdate')
    expect(draftLPUpdateTool.metadata.category).toBe('operations')
  })

  it('creates proposal with assembled context', async () => {
    const result = await draftLPUpdateTool.execute({
      periodType: 'Q1',
      year: 2026,
      tone: 'formal',
      customHighlights: 'TechServ LOI signed',
    }, mockCtx)

    expect(result).toMatchObject({
      needsApproval: true,
      actionId: 'aa1',
      tool: 'draft-lp-update',
    })
  })

  it('returns error if fund not found', async () => {
    vi.mocked(prisma.fund.findUnique).mockResolvedValue(null as never)
    const result = await draftLPUpdateTool.execute({ periodType: 'Q1', year: 2026 }, mockCtx)
    expect(result).toMatchObject({ error: expect.stringContaining('Fund') })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/draft-lp-update.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement draft-lp-update tool**

Create `src/lib/ai/tools/reports/draft-lp-update.ts`.

**Important architectural note:** This tool assembles context and creates a proposal. Unlike W1/W2, the actual LP update *prose* is generated by the AI model in its response — not inside the tool. The tool provides the structured fund data as its return value, and Emma (Claude) uses that data to draft the letter. The proposal payload stores the sections that the model has already generated by the time the user clicks Approve. This means the tool flow is:

1. Tool assembles context → returns it to model
2. Model generates the LP update prose in its text response
3. Model also calls a second tool (`saveLPDraft`) to propose saving — OR the model's text response IS the draft and the save happens on approval

**Simplified approach adopted here:** The tool returns the assembled context. The model writes the draft in its response. A separate `confirmLPDraft` is NOT needed — the proposal payload includes the context, and on approval the `executeDraftLPUpdate` in `agent-actions.ts` creates a Report with sections the model populated.

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/draft-lp-update.test.ts`
Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools/reports/draft-lp-update.ts src/__tests__/draft-lp-update.test.ts
git commit -m "feat(emma): W3 draft-lp-update tool with context assembly and two-step flow"
```

---

## Chunk 6: System Prompt + Registry Integration

### Task 12: System Prompt Sections

**Files:**
- Create: `src/lib/ai/prompt/sections/write-capabilities.ts`
- Create: `src/lib/ai/prompt/sections/financial-guardrails.ts`

- [ ] **Step 1: Create write-capabilities prompt section**

Create `src/lib/ai/prompt/sections/write-capabilities.ts`:

```typescript
import type { PromptSection } from '../../core/types'

export function writeCapabilitiesSection(): PromptSection {
  return {
    name: 'write-capabilities',
    order: 75,
    required: true,
    content: `[WRITE CAPABILITIES]
You can now propose changes to the fund. You have three write tools: updateDealStage, logMeetingNote, and draftLPUpdate. You NEVER execute a write operation without first presenting an approval card and receiving explicit confirmation from the user. If the user says "yes", "confirm", "do it", "go ahead", or equivalent — that is confirmation. If they say "no", "cancel", "stop" — that is rejection. You propose exactly one action at a time. You do not chain write operations without intermediate approval.

When a write tool returns { needsApproval: true }, inform the user what you are proposing and ask them to confirm using the approval card displayed below your message.

When a write tool returns { ambiguous: true }, ask the user to clarify which entity they meant. Do not guess.

When a write tool returns { context, instructions }, use the provided fund data to draft the requested content, then call the tool again with the sections populated.`,
  }
}
```

- [ ] **Step 2: Create financial-guardrails prompt section**

Create `src/lib/ai/prompt/sections/financial-guardrails.ts`:

```typescript
import type { PromptSection } from '../../core/types'

export function financialGuardrailsSection(): PromptSection {
  return {
    name: 'financial-guardrails',
    order: 76,
    required: true,
    content: `[FINANCIAL WRITE GUARDRAILS]
You NEVER calculate or generate financial numbers independently. Capital call amounts, distribution amounts, MOIC, IRR, waterfall calculations — these come from the deterministic layer, not from you. If a user asks you to "create a capital call for $200K", you pass that value through to the server action; you do not verify or modify the arithmetic. If a user asks you to calculate the correct capital call amount, you tell them: "I can help log this, but the amount must be your input. I do not perform fund accounting calculations." This rule has no exceptions.`,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/prompt/sections/write-capabilities.ts src/lib/ai/prompt/sections/financial-guardrails.ts
git commit -m "feat(emma): system prompt sections for write capabilities and financial guardrails"
```

---

### Task 13: Registry + Engine Wiring

**Files:**
- Modify: `src/lib/ai/tools/create-default-registry.ts`
- Modify: `src/lib/ai/core/engine.ts`

- [ ] **Step 1: Register write tools in the registry**

In `src/lib/ai/tools/create-default-registry.ts`, add imports and registrations:

```typescript
import { updateDealStageTool } from './deals/update-deal-stage'
import { logMeetingNoteTool } from './activities/log-meeting-note'
import { draftLPUpdateTool } from './reports/draft-lp-update'
```

Add after the Phase 1.5 Batch 2 section:

```typescript
  // Phase 2: Write tools (approval-gated)
  registry.register(updateDealStageTool)
  registry.register(logMeetingNoteTool)
  registry.register(draftLPUpdateTool)
```

- [ ] **Step 2: Wire prompt sections in engine.ts**

In `src/lib/ai/core/engine.ts`, add imports:

```typescript
import { writeCapabilitiesSection } from '../prompt/sections/write-capabilities'
import { financialGuardrailsSection } from '../prompt/sections/financial-guardrails'
```

Add to the composer chain (after `formatToolsBlock` at order 70, before `formattingRulesSection` at order 80):

```typescript
    .addSection(writeCapabilitiesSection())
    .addSection(financialGuardrailsSection())
```

Update `EngineInput` interface to include `conversationId`:
```typescript
export interface EngineInput {
  userId: string
  fundId: string
  currency: CurrencyCode
  conversationId: string
  session: { user?: { id?: string; name?: string | null; role?: string } }
}
```

Update `assembleEngine` to pass `conversationId` in `toolContext`:
```typescript
const toolContext: ToolContext = { fundId, currency, userId, conversationId }
```

- [ ] **Step 3: Update route.ts to pass conversationId**

In `src/app/api/chat/route.ts`, update the `assembleEngine` call:

```typescript
const engine = await assembleEngine({
  userId: session.user.id,
  fundId: activeFund.fundId,
  currency: activeFund.currency,
  conversationId,
  session,
})
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Zero errors. All type checks pass.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All existing tests pass + all new tests pass.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: Clean, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/tools/create-default-registry.ts src/lib/ai/core/engine.ts src/app/api/chat/route.ts
git commit -m "feat(emma): wire Phase 2 write tools into registry, engine, and route"
```

---

## Final Checklist

Before PR:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes clean
- [ ] `npx vitest run` — all tests pass (existing + new)
- [ ] Manual: trigger each write tool via Emma chat, verify ApprovalCard renders
- [ ] Manual: approve an action, verify DB writes correctly
- [ ] Manual: reject an action, verify no DB writes
- [ ] AgentAction audit trail populated for all 3 tools
- [ ] W2 email draft saved with `status: DRAFT` (never SENT)
- [ ] W3 draft saved as Report with `status: DRAFT`
- [ ] No regressions in existing read tools (spot-check 2-3)
- [ ] Cost tracking works for write tool invocations

---

## Test Summary

| Test File | Cases | Tests |
|-----------|-------|-------|
| `agent-actions.test.ts` | CRUD, auth, status validation | ~6 |
| `stage-aliases.test.ts` | 18 aliases + case insensitivity + unknown | ~18 |
| `deal-name-resolver.test.ts` | exact, partial, ambiguous, not found, ID | ~6 |
| `update-deal-stage.test.ts` | metadata, proposal, not found, bad stage | ~4 |
| `log-meeting-note.test.ts` | metadata, proposal, schema validation | ~4 |
| `lp-update-context-assembler.test.ts` | full assembly, fund not found | ~2 |
| `draft-lp-update.test.ts` | metadata, proposal, fund not found | ~3 |
| **Total new** | | **~43** |
