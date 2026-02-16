# BlackGem — Roadmap Audit + AI Integration Strategy

## Context

The user requested two deliverables:
1. **Exhaustive audit** of the existing development roadmap to identify what's truly pending
2. **AI integration strategy** — an executable plan for integrating LLMs to improve fund manager and analyst efficiency

### Key Finding: The Roadmap is 95% Complete

The development roadmap at `docs/plans/2026-02-15-blackgem-development-roadmap.md` lists 8 phases with 20+ tasks. After auditing every task against the actual codebase, **nearly all features are already implemented**. The roadmap was written on Feb 15 but reflects the state *before* sprints 1-12 (PRs #17-#36), which built most of the planned features.

### User Decisions
- **AI Priority:** Operational efficiency first (automate repetitive tasks), then strategic intelligence
- **Timing:** Complete remaining roadmap items, then AI
- **LLM Provider:** Agnostic — each use case defines the optimal model
- **Scope:** Full executable plan with tasks, dependencies, and estimations

---

## Part 1: Roadmap Audit — What's Actually Pending

### Completed Features (no action needed)

| Roadmap Task | Status | Evidence |
|---|---|---|
| S3 client + SDK | **DONE** | `src/lib/s3.ts` (54 lines, lazy-init) |
| S3 upload migration | **DONE** | `src/app/api/documents/upload/route.ts` uses S3 |
| Document versioning | **DONE** | `src/lib/actions/document-versions.ts`, tests exist |
| LP document visibility | **DONE** | `src/lib/actions/document-visibility.ts`, Eye/EyeOff toggle |
| Report Prisma model | **DONE** | `prisma/schema.prisma` lines 1151-1199 |
| Quarterly update builder (API) | **DONE** | `src/lib/actions/quarterly-updates.ts` (200+ lines) |
| Quarterly update builder (UI) | **DONE** | `src/app/(dashboard)/reports/page.tsx` |
| Quarterly PDF generation | **DONE** | `src/lib/pdf/quarterly-update.ts` |
| Report email distribution | **DONE** | `src/lib/actions/report-distribution.ts` |
| Deal scoring UI | **DONE** | `src/components/deals/deal-scoring.tsx`, tests exist |
| Deal source tracking | **DONE** | `src/components/deals/deal-source-select.tsx` |
| Valuation model | **DONE** | `prisma/schema.prisma` Valuation model |
| Portfolio KPI trends (API) | **DONE** | `src/lib/actions/portfolio-monitoring.ts` (400+ lines), tests exist |
| Portfolio monitoring dashboard | **DONE** | `src/components/portfolio/portfolio-dashboard.tsx`, sparklines |
| Email templates | **DONE** | `src/lib/email-templates.ts` (234 lines) |
| Bulk communications (API) | **DONE** | `src/lib/actions/communications.ts` |
| Communications UI | **DONE** | `src/components/investors/investor-communications.tsx` |
| Activity timeline | **DONE** | `src/components/deals/activity-timeline.tsx` |
| Rate limiting | **DONE** | `src/lib/shared/rate-limit.ts`, applied to upload + auth |
| ErrorBoundary | **DONE** | Integrated in all 20 dashboard + portal pages |
| Sentry files | **DONE** | `src/lib/sentry.ts` + `src/app/global-error.tsx` |

### Truly Remaining Items (operational only)

| Item | Type | Effort | Description |
|---|---|---|---|
| **Resend env vars in production** | Ops | 10 min | Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` on EC2 |
| **RDS security group** | Ops | 10 min | Restrict port 5432 to EC2 SG only |
| **Verify Sentry DSN** | Ops | 5 min | Set `SENTRY_DSN` env var on EC2 |
| **Deploy latest code** | Ops | 5 min | Push Docker image with all recent changes |

**Total remaining roadmap effort: ~30 minutes of operational work.**

### Recommended Action on Roadmap Document

Replace `docs/plans/2026-02-15-blackgem-development-roadmap.md` with a short "completed" document that references this audit. The current 1200-line document is misleading — it creates the impression of months of work remaining when in reality only env var configuration is needed.

---

## Part 2: AI Integration Strategy

### Architecture: LLM-Agnostic Service Layer

#### Design Philosophy

Three principles from existing BlackGem patterns:

1. **Lazy-init client pattern** — identical to `src/lib/s3.ts`. LLM clients instantiated on first use; build never crashes if API keys absent
2. **Server action flow** — every AI operation follows: `'use server'` → `auth()` → `requireFundAccess()` → Zod → logic → `logAudit()` → `revalidatePath()`
3. **Pure utilities for testability** — prompt construction, response parsing, cost calculation in pure functions tested with Vitest

#### File Structure

```
src/lib/ai/
  providers/
    types.ts              # Provider-agnostic interfaces (AIProvider, AICompletionRequest/Response)
    anthropic.ts          # Claude provider (lazy-init, fetch-based)
    openai.ts             # OpenAI provider (lazy-init, fetch-based)
    registry.ts           # Provider registry + model routing
  prompts/
    document-classification.ts
    deal-memo.ts
    quarterly-narrative.ts
    communication-draft.ts
    activity-digest.ts
    dd-checklist.ts
  shared/
    token-counter.ts      # Token estimation (pure function)
    cost-tracker.ts       # Cost per model (pure function)
    prompt-builder.ts     # Template interpolation (pure function)
    response-parser.ts    # Structured output parsing (pure function)
  ai-client.ts            # Main entry: getAIClient()
  ai-config.ts            # Use case → model mapping
src/lib/actions/
  ai.ts                   # Server actions for all AI operations
```

#### Core Interfaces (`src/lib/ai/providers/types.ts`)

```typescript
interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string }

interface AICompletionRequest {
  model: string
  messages: AIMessage[]
  maxTokens: number
  temperature?: number        // default 0.3 for PE content
  responseFormat?: 'text' | 'json'
}

interface AICompletionResponse {
  content: string
  model: string
  usage: { inputTokens: number; outputTokens: number }
  cost: number                // USD
  latencyMs: number
}

interface AIProvider {
  name: string
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
  isAvailable(): boolean
}
```

#### Provider Strategy: fetch-based (no SDK)

Given the known `npm install` hang issue, all providers use direct `fetch()` calls to API endpoints. This also produces a lighter dependency footprint. The provider interface is identical regardless.

#### Model Routing (`src/lib/ai/ai-config.ts`)

| Use Case | Model | Rationale |
|---|---|---|
| Document Classification | Claude Haiku | Fast, cheap, high accuracy on classification |
| Deal Memo Generation | Claude Sonnet | Complex reasoning, PE domain knowledge |
| Quarterly Narrative | Claude Sonnet | Long-form, nuanced financial writing |
| Communication Draft | Claude Haiku | Template-based, speed matters |
| Activity Digest | Claude Haiku | Summarization, daily/weekly cadence |
| DD Checklist | Claude Sonnet | Domain expertise, industry-specific |
| Document Extraction | GPT-4o or Claude Sonnet | Structured data extraction from PDFs |
| Deal Comparison | Claude Haiku | Summarization of comparative data |

Config is a `Record<string, { provider, model }>` — changeable without touching business logic.

#### Cost Tracking via Existing AuditLog

No new Prisma models needed. All AI costs logged via `logAudit()`:

```typescript
await logAudit({
  userId, action: 'CREATE', entityType: 'AIGeneration', entityId: dealId,
  changes: { useCase: { old: null, new: 'deal_memo' }, model: { old: null, new: 'claude-3-5-sonnet' }, costUsd: { old: null, new: 0.012 } }
})
```

Enables querying `AuditLog` for total AI spend, per-use-case costs, and usage trends.

#### Rate Limiting

Extend existing `src/lib/shared/rate-limit.ts`:
- 30 AI requests per user per hour
- 100 AI requests per fund per day
- Per-use-case limits configurable

#### UI Pattern: Invisible Enhancement

AI features follow "Invisible Quality" — no new pages, no chatbot, no AI branding:

1. **Inline Suggestion** — AI auto-fills existing fields with subtle "Suggested" label (`text-[#94A3B8]`)
2. **Draft Generation** — Secondary "Draft" button next to empty editable sections; skeleton loading
3. **Summary Card** — Content appears in existing card components on dashboard

User always has final approval before AI content is saved.

---

### Prioritized Use Cases

#### Tier 1: High Impact, Lower Complexity (Start Here)

**UC1: Document Auto-Classification** — 2 days
- **Trigger:** Document upload
- **Input:** Filename + first 2000 chars of content
- **Output:** Suggested `DocumentCategory` (1 of 18 enum values)
- **Integration:** `src/app/api/documents/upload/route.ts` — pre-select category dropdown
- **Dependencies:** `pdf-parse` library for text extraction
- **Cost:** ~$0.0003/call (Haiku)

**UC2: Deal Memo / Investment Thesis Generation** — 3 days
- **Trigger:** "Draft" button on deal detail page
- **Input:** All Deal fields (financials, thesis, contacts, notes, activities)
- **Output:** Draft `investmentThesis`, `keyRisks`, `valueCreationPlan`
- **Integration:** `src/app/(dashboard)/deals/[id]/page.tsx` — editable text areas
- **Dependencies:** None (all data already in Deal model)
- **Cost:** ~$0.015/call (Sonnet)

**UC3: Quarterly Report Narrative Generation** — 3 days
- **Trigger:** "Draft Narrative" button on quarterly update builder
- **Input:** Fund metrics, portfolio data, deal pipeline summary, period
- **Output:** Narrative sections: letter, portfolio updates, looking ahead
- **Integration:** `src/lib/actions/quarterly-updates.ts` — existing editable sections
- **Dependencies:** None
- **Cost:** ~$0.025/call (Sonnet)

**UC4: Communication Draft Generation** — 2 days
- **Trigger:** "Draft" button in communication composer
- **Input:** Brief user instruction + investor context + comm history
- **Output:** Email subject + body
- **Integration:** `src/components/investors/investor-communications.tsx`
- **Dependencies:** None
- **Cost:** ~$0.001/call (Haiku)

**UC5: Activity Summary / Weekly Digest** — 2 days
- **Trigger:** Button on dashboard or scheduled
- **Input:** All activities, audit entries, stage changes, tasks from past 7 days
- **Output:** Concise narrative digest
- **Integration:** Dashboard page new section
- **Dependencies:** None
- **Cost:** ~$0.003/call (Haiku)

#### Tier 2: High Impact, Medium Complexity

**UC6: DD Checklist Auto-Population** — 3 days
- **Trigger:** "Auto-Generate" button on empty DD tab
- **Input:** Deal industry, stage, size, financials
- **Output:** Structured JSON array of DD items with category + priority
- **Integration:** `src/lib/actions/due-diligence.ts` → bulk `createDDItem()`
- **Cost:** ~$0.01/call (Sonnet)

**UC7: Document Data Extraction** — 5 days
- **Trigger:** After uploading CIM or financial statement
- **Input:** Full document text (PDF parsed)
- **Output:** Extracted revenue, EBITDA, cash flow, employee count → deal field suggestions
- **Integration:** Deal detail page — confirm-before-apply pattern
- **Dependencies:** `pdf-parse`, potentially `mammoth` for DOCX
- **Cost:** ~$0.03/call (Sonnet/GPT-4o)

**UC8: Deal Comparison / Benchmarking** — 3 days
- **Trigger:** "Compare" button on deal detail
- **Input:** Current deal metrics + all historical CLOSED_WON deals
- **Output:** Comparison narrative
- **Integration:** Deal detail page inline card
- **Cost:** ~$0.003/call (Haiku)

#### Tier 3: Strategic Intelligence (future, not in this plan)

- Deal Scoring Automation (ML on historical outcomes)
- Portfolio Health Index (multi-factor scoring)
- Capital Call Forecasting (time-series)
- Exit Timing Recommendation (market + metrics)

---

### Implementation Sequence

#### Phase A: Foundation (3 days)
Prerequisite: Set Resend + Sentry env vars on EC2 (30 min ops work)

| Day | Task | Files |
|-----|------|-------|
| 1 | Provider interfaces + Anthropic provider (fetch-based) | `src/lib/ai/providers/types.ts`, `anthropic.ts` |
| 1 | AI client entry point + config | `src/lib/ai/ai-client.ts`, `ai-config.ts` |
| 2 | Cost tracker + token counter (pure functions) | `src/lib/ai/shared/cost-tracker.ts`, `token-counter.ts` |
| 2 | Response parser + prompt builder | `src/lib/ai/shared/response-parser.ts`, `prompt-builder.ts` |
| 2 | AI rate limiter | `src/lib/ai/shared/rate-limiter.ts` |
| 3 | AI server actions shell with auth pattern | `src/lib/actions/ai.ts` |
| 3 | OpenAI provider (fetch-based) | `src/lib/ai/providers/openai.ts` |
| 3 | Tests for all pure functions | `src/__tests__/ai-*.test.ts` |
| 3 | Update `.env.example` with AI env vars | `.env.example` |

#### Phase B: Tier 1 Use Cases (12 days)

| Days | Use Case | Key Files |
|------|----------|-----------|
| 1-2 | UC1: Document Auto-Classification | `src/lib/ai/prompts/document-classification.ts`, upload route |
| 3-5 | UC2: Deal Memo Generation | `src/lib/ai/prompts/deal-memo.ts`, deal detail page |
| 6-8 | UC3: Quarterly Narrative | `src/lib/ai/prompts/quarterly-narrative.ts`, quarterly builder |
| 9-10 | UC4: Communication Drafts | `src/lib/ai/prompts/communication-draft.ts`, comm composer |
| 11-12 | UC5: Activity Digest | `src/lib/ai/prompts/activity-digest.ts`, dashboard |

#### Phase C: Tier 2 Use Cases (11 days)

| Days | Use Case | Key Files |
|------|----------|-----------|
| 1-3 | UC6: DD Checklist | `src/lib/ai/prompts/dd-checklist.ts`, DD tab |
| 4-8 | UC7: Document Extraction | `src/lib/ai/prompts/document-extraction.ts`, pdf-parse |
| 9-11 | UC8: Deal Comparison | `src/lib/ai/prompts/deal-comparison.ts`, deal detail |

**Total: 26 working days** (3 foundation + 12 Tier 1 + 11 Tier 2)

---

### Cost Model

| Use Case | Model | Est. Cost/Call | Monthly (10 deals) |
|---|---|---|---|
| Doc Classification | Haiku | $0.0003 | $0.15 |
| Deal Memo | Sonnet | $0.015 | $1.50 |
| Quarterly Narrative | Sonnet | $0.025 | $0.30 |
| Communication Draft | Haiku | $0.001 | $0.50 |
| Activity Digest | Haiku | $0.003 | $0.12 |
| DD Checklist | Sonnet | $0.010 | $1.00 |
| Doc Extraction | Sonnet | $0.030 | $1.50 |
| Deal Comparison | Haiku | $0.003 | $0.30 |

**Estimated total: $5-15/month per fund.** Budget ceiling: $50/month with alerts at $25.

---

### New Environment Variables

```env
# AI Provider Configuration
ANTHROPIC_API_KEY=          # Required for AI features
OPENAI_API_KEY=             # Optional: for document extraction
AI_RATE_LIMIT_PER_HOUR=30   # Max AI requests per user per hour
AI_MONTHLY_BUDGET_USD=50     # Monthly cost ceiling
```

---

### Risk Assessment

| Risk | Mitigation |
|---|---|
| npm install hangs for AI SDK | Use fetch-based API calls (no SDK dependency) |
| LLM hallucinations in financial content | All output is suggestions; user confirms before saving |
| Token limits on large documents | Truncate to configurable max; chunking for extraction |
| Provider pricing changes | Configurable pricing table in `cost-tracker.ts` |
| Data privacy (deal data to LLM) | Anthropic doesn't train on API data; document handling policy |
| Testing non-deterministic output | Test prompt construction (deterministic), not LLM output |

---

### Success Criteria per Use Case

| Use Case | Metric | Target |
|---|---|---|
| Doc Classification | User override rate | <15% |
| Deal Memo | Content edit ratio | <40% |
| Quarterly Narrative | Time to publish | <30 min (vs 2-4 hrs) |
| Communication Draft | Adoption rate | >80% |
| Activity Digest | Engagement | >90% read |
| DD Checklist | Coverage vs manual | >70% |
| Doc Extraction | Field accuracy | >80% |
| Deal Comparison | Usage frequency | >50% of deals |

---

## Verification Plan

### After Foundation (Phase A)
1. `npx vitest run` — all existing 187+ tests pass + new AI pure function tests
2. `npm run build` — zero errors (lazy-init ensures no crash without API keys)
3. `npm run lint` — clean

### After Each Use Case
1. Tests pass (prompt construction, parsing, cost calculation)
2. Build passes
3. Manual test: trigger AI feature, verify suggestion appears, confirm/edit, save
4. Verify AuditLog captures AI usage with cost data

### End-to-End
- Complete deal lifecycle using AI features: upload doc → auto-classify → create deal → AI draft memo → score deal → run DD → generate quarterly report → distribute to LPs
- Monthly cost under $15 for a 10-deal fund
