# Emma Write Tools Phase 2 — Validated Design

**Date:** 2026-03-10
**Status:** Approved — ready for implementation planning
**Source Spec:** Engineering Specification v1.0 (March 2026)

---

## Summary

Three write tools for the Emma AI copilot, gated by an inline approval flow. No AI-initiated writes without explicit user confirmation.

| Tool | Purpose | Writes To |
|------|---------|-----------|
| W1: `update-deal-stage` | Move deal + log note + create follow-up task | Deal, Activity, Task |
| W2: `log-meeting-note` | Structured extraction from raw notes → activity + tasks + email draft | Activity, Task, Communication |
| W3: `draft-lp-update` | Generate quarterly LP update from fund data | Report (status: DRAFT) |

---

## Codebase Validation

Validated against Phase 1 codebase (commit `fc81a23`, March 10 2026).

### Existing Infrastructure (No Changes Needed)

| Component | Location | Phase 2 Usage |
|-----------|----------|---------------|
| Tool interface (`ITool`) | `src/lib/ai/tools/types.ts` | New tools implement same interface |
| Tool registry | `src/lib/ai/tools/create-default-registry.ts` | Register 3 new tools |
| Prompt composer | `src/lib/ai/prompt/prompt-composer.ts` | Add 2 new sections (order 75, 76) |
| Streaming route | `src/app/api/chat/route.ts` | Add approval flow handling |
| `updateDealStage` | `src/lib/actions/deals.ts` | W1 calls directly |
| `createDealActivity` | `src/lib/actions/deals.ts` | W1, W2 call directly |
| `createTask` | `src/lib/actions/tasks.ts` | W1, W2 call directly |
| `logCommunication` | `src/lib/actions/communications.ts` | W2 email draft save |
| `generateQuarterlyUpdate` | `src/lib/actions/quarterly-updates.ts` | W3 saves via Report model |
| Cost tracker | `src/lib/ai/cost-tracker.ts` | Track write tool costs |
| Rate limiter | `src/lib/shared/rate-limit.ts` | Existing limits apply |

### Schema Changes Required

1. **New model: `AgentAction`** — audit trail for all proposed/approved/rejected AI actions
   - `conversationId String` (non-nullable, confirmed)
   - Status enum: `PROPOSED | APPROVED | REJECTED | EDITED`

2. **New enum + field on `Communication`:** `CommunicationStatus` (DRAFT | SENT | FAILED)
   - Enables W2 to save email drafts without sending

### DealStage Enum — 17 Values (Not 18)

The spec references 18 stages; the actual Prisma enum has 17. The alias table is correct — all referenced stages exist. The count discrepancy is cosmetic.

### Action Name Mapping

| Spec Says | Actual Codebase Name |
|-----------|---------------------|
| `createActivity` | `createDealActivity` |
| `createQuarterlyUpdate` | `generateQuarterlyUpdate` (creates Report with DRAFT status) |

---

## Architecture Decisions

### Approval Flow

AI SDK v6 `addToolResult` pattern. When a write tool fires:
1. Tool returns `{ needsApproval: true, proposedPayload }` instead of executing
2. Route handler streams an `AIApprovalCard` to the client
3. Client sends confirmation/rejection as a follow-up message
4. Route handler calls `tool.execute()` on confirmation

### Fund Isolation

Same pattern as Phase 1: all tools receive `ctx.fundId` and scope all queries. No cross-fund writes.

### Financial Guardrail

Emma never generates financial numbers. All values in W3 drafts come from deterministic data assembly (existing server actions). Prompt section explicitly forbids independent calculation.

---

## New Files (Estimated)

```
src/lib/ai/tools/deals/update-deal-stage.ts       # W1 tool definition
src/lib/ai/tools/deals/deal-name-resolver.ts       # Fuzzy name → dealId
src/lib/ai/tools/activities/log-meeting-note.ts     # W2 tool definition
src/lib/ai/tools/reports/draft-lp-update.ts         # W3 tool definition
src/lib/ai/tools/shared/approval-types.ts           # Shared approval interfaces
src/lib/ai/prompt/sections/write-capabilities.ts    # System prompt section
src/lib/ai/prompt/sections/financial-guardrails.ts  # System prompt section
src/components/ai/ai-approval-card.tsx              # Inline approval UI
src/lib/actions/agent-actions.ts                    # AgentAction CRUD
prisma/migrations/XXXXXX_add_agent_action/          # Schema migration
```

## Modified Files (Estimated)

```
src/app/api/chat/route.ts                          # Approval flow handling
src/lib/ai/tools/create-default-registry.ts         # Register new tools
src/lib/ai/engine.ts                                # Wire new prompt sections
prisma/schema.prisma                                # AgentAction model + CommunicationStatus
```
