# BLACKGEM — Emma AI Architecture: Via Negativa Refactoring

**Strategic Architecture Decision Document**

v1.0 | March 2, 2026 | NIRO Group LLC | Strictly Confidential

| Field | Detail |
|-------|--------|
| Document Type | Architecture Decision Record |
| Purpose | Identify and remove structural ceilings before scaling Emma |
| Decision Maker | Marcus Rein (Chief Product & Strategy Advisor) |
| Authors | Rodo (CPO) + Claude (Engineering) |
| Status | DRAFT — Pending Marcus Review |

---

## 0. Why This Document Exists

We are at an inflection point. Emma shipped Phase 1 — a conversational analyst with 5 read-only tools. The roadmap calls for 30+ tools, proactive intelligence, and work product generation across Phases 1.5, 2, and 3.

The question is not **what to build next**. The question is: **what in the current architecture will collapse under the weight of what we need to build?**

This document takes a via negativa approach. Instead of proposing features, we identify the 7 structural ceilings that must be removed before any feature investment makes sense. Every ceiling is documented with exact code locations, precise coupling analysis, and the scaling point at which it breaks.

> **The hard decision:** Refactor the foundation now — before we have 30 tools, 10 context sources, and 3 LLM providers tangled into a monolith that no one can change without breaking everything else.

---

## 1. Current Architecture: What Exists Today

### 1.1 Component Map

```
src/lib/ai/
├── ai-config.ts              23 lines   Config + Anthropic provider (singleton)
├── cost-tracker.ts            60 lines   Token pricing + audit logging
├── conversation-trimmer.ts    70 lines   Context window management
├── system-prompt.ts          135 lines   Monolithic prompt builder
├── context/
│   ├── fund-context.ts        99 lines   5 parallel Prisma queries
│   └── user-context.ts        16 lines   Session → UserContext
└── tools/
    ├── index.ts                1 line    Re-export barrel
    └── read-tools.ts         314 lines   5 hardcoded tools

src/app/api/chat/route.ts    226 lines   God function orchestrator
```

**Total AI codebase: 944 lines across 8 files.**

### 1.2 Data Flow (Current)

```
POST /api/chat
  │
  ├─ 1. Auth check (session.user.id)
  ├─ 2. AI enabled check (ANTHROPIC_API_KEY exists)
  ├─ 3. Fund resolution (getActiveFundWithCurrency)
  ├─ 4. Fund access verification (requireFundAccess)
  ├─ 5. Rate limiting (30/hr, 200/day — global, per-user)
  ├─ 6. Parse request body (messages[], conversationId?)
  ├─ 7. Conversation resolution (create if missing)
  ├─ 8. Message trimming (last 30 msgs, 50K token budget)
  ├─ 9. Context assembly
  │     ├─ assembleFundContext(fundId) → 5 Prisma queries
  │     ├─ assembleUserContext(session) → name, role, id
  │     └─ buildSystemPrompt(fund, user, currency, isFirstTime)
  ├─ 10. streamText(claude-sonnet-4-6, prompt, tools, messages)
  │      └─ tools = createReadTools(fundId, currency) → flat object, 5 tools
  └─ 11. Response + fire-and-forget persistence + title generation
```

### 1.3 Tool Inventory

| Tool | Input | Prisma Models | Lines |
|------|-------|---------------|-------|
| `getPipelineSummary` | none | Deal | ~50 |
| `getDealDetails` | nameOrId | Deal | ~70 |
| `getFundFinancials` | none | Fund, Commitment, PortfolioCompany | ~60 |
| `getInvestorDetails` | nameOrId | Commitment → Investor | ~55 |
| `getPortfolioMetrics` | companyName? | PortfolioCompany, PortfolioMetric | ~70 |

**Data coverage: 5 of 27 business models. Emma operates at ~48% data visibility.**

### 1.4 Dependencies

```
@ai-sdk/anthropic: ^3.0.45
@ai-sdk/react:     ^3.0.93
ai:                ^6.0.91
```

No vector DB, no embeddings, no RAG, no queue system, no agent framework.

---

## 2. The Seven Ceilings

Each ceiling is a structural constraint that prevents scaling regardless of how many features we add. They are ordered by dependency — earlier ceilings block later ones.

### Ceiling 1: The God Function Orchestrator

**Location:** `src/app/api/chat/route.ts` — 226 lines, single `POST` handler

**The problem:** One function does authentication, rate limiting, context assembly, tool registration, LLM invocation, response streaming, message persistence, cost tracking, and title generation. Every new capability requires modifying this file.

**Coupling points:**
- Model selection: `anthropic(AI_CONFIG.model)` at line 135 — hardcoded to Anthropic SDK
- Tool registration: `createReadTools(activeFund.fundId, currency)` at line 138 — single function call, flat return
- Context assembly: `Promise.all([assembleFundContext, getConversations])` at lines 114-116 — hardcoded sources
- Prompt construction: `buildSystemPrompt(fundContext, userContext, currency, isFirstTime)` at line 122 — 4 fixed parameters
- Persistence: fire-and-forget `persistMessages()` in `onFinish` at line 163

**Scaling collapse point:** At 3 LLM providers, 10 context sources, or any conditional logic (per-role prompts, per-tier budgets), this function becomes an unmaintainable if/else tree.

**What to remove:** The "everything in one function" pattern. Replace with a pipeline of composable stages where each stage is independently testable and replaceable.

---

### Ceiling 2: The Hardcoded Tool Monolith

**Location:** `src/lib/ai/tools/read-tools.ts` — 314 lines, single function

**The problem:** `createReadTools(fundId, currency)` returns a flat object with 5 inline `tool()` definitions. No interface, no registry, no categories, no metadata. Adding tool #6 means editing the same file that defines tools #1-5.

**Coupling points:**
- Function signature: `createReadTools(fundId: string, currency: CurrencyCode)` — adding context (user tier, feature flags, API keys) requires changing the signature, which propagates to `route.ts`
- Fund isolation: every tool manually adds `where: { fundId, ...notDeleted }` — duplicated 5 times, will be duplicated 30 times
- Currency formatting: captured in closure, passed to every `formatMoney()` call — no tool-level override
- Database coupling: every tool directly imports and queries `prisma` — no data access layer, no caching, no mocking

**Scaling collapse point:** At 30 tools, this file is 2,000+ lines. No organization by domain (deals, capital, portfolio). No ability to:
- Enable/disable tools per fund or user tier
- Version tools (v1/v2 migration)
- Test tools independently (require full DB setup)
- Cache tool results (repeated calls hit Prisma every time)
- Rate-limit expensive tools differently from cheap ones
- Compose tools (tool A calls tool B)

**What to remove:** The single-function pattern. Replace with a tool registry where each tool is a self-contained module implementing a standard interface.

---

### Ceiling 3: The Prompt Monolith

**Location:** `src/lib/ai/system-prompt.ts` — 135 lines, string concatenation

**The problem:** `buildSystemPrompt()` concatenates 9 hardcoded sections into a single string. Tool descriptions are manually written in the prompt AND separately defined in `read-tools.ts` — two files to update for every tool.

**Sections (current):**
1. `[IDENTITY]` — Emma persona
2. `[PE DOMAIN KNOWLEDGE]` — lifecycle, stages, economics
3. `[USER CONTEXT]` — name, role, id
4. `[CURRENCY]` — formatting conventions
5. `[FUND ISOLATION]` — security boundary
6. `[AVAILABLE TOOLS]` — 5 tools manually described (~1,500 chars)
7. `[FORMATTING]` — output rules
8. `[FUND CONTEXT]` — dynamic data from `assembleFundContext()`
9. `[FIRST MESSAGE]` or `[CONTINUATION]` — conditional greeting

**Total prompt size:** ~6,000-8,500 characters (varies with fund data).

**Scaling collapse point:** At 30 tools, the `[AVAILABLE TOOLS]` section alone grows to ~9,000 characters. Combined with context, the prompt approaches 20,000+ characters — consuming ~5,000 tokens of the 50,000 token budget before any conversation history is loaded. The prompt eats 10% of context just describing itself.

**What to remove:** Manual tool enumeration. Tool metadata should auto-generate the prompt section. Sections should compose independently with the ability to include/exclude per role or context.

---

### Ceiling 4: No Background Execution

**Location:** `src/app/api/chat/route.ts` line 22 — `maxDuration = 300` (5 minutes)

**The problem:** Emma only executes when a user sends a message. There is zero infrastructure for:
- Scheduled analysis (daily/weekly digests)
- Event-driven alerts (deal goes stale, LP misses a capital call, portfolio metric drops)
- Long-running generation (quarterly reports that take >5 minutes)
- Asynchronous workflows (draft → review → approve → send)

**Evidence from `package.json`:** No queue system (Bull, BullMQ, Temporal), no CRON library, no event bus, no pub/sub. The only async pattern is fire-and-forget title generation within the request lifecycle.

**Phase impact:** This is the **single biggest blocker for Phase 2**. Proactive intelligence — stale deal alerts, overdue commitment warnings, weekly fund digests, portfolio anomaly detection — is architecturally impossible without a trigger mechanism that isn't "user types something."

**What to remove:** The assumption that Emma is request-response only. Needs a lightweight scheduled execution layer that can run Emma's analysis tools against fund data on a schedule and route insights to the notification system.

---

### Ceiling 5: Conversation Amnesia

**Location:** `src/lib/actions/ai-conversations.ts` — `getConversationMessages()` queries only one `conversationId`

**The problem:** Each conversation is a sealed bubble. When a new conversation starts, Emma knows nothing about previous interactions. The `Conversation` model has no cross-conversation linkage, no summary layer, no semantic index.

**Memory model:**
- `Conversation` table: fundId, userId, title, timestamps — no summary field, no tags, no embeddings
- `Message` table: content (TEXT), toolInvocations (JSON blob), tokenCount — no searchable structure
- Trimming: last 30 messages within 50K token budget, older messages dropped with `[Earlier conversation context omitted]` marker
- Cross-conversation: **zero access**. No function queries messages across conversations.

**What this prevents:**
- "You asked about Company X three times this week — here's a consolidated summary"
- "Based on your previous conversations, here are the deals you've been most focused on"
- "Last time we discussed this, you mentioned concerns about the seller's financials"
- Semantic search across conversation history
- Institutional knowledge accumulation over the fund's lifetime

**What to remove:** The assumption that conversations are disposable. At minimum, need conversation summaries persisted on completion + a cross-conversation context injection mechanism.

---

### Ceiling 6: Absolute Single-Fund Isolation

**Location:** `src/lib/ai/system-prompt.ts` lines 100-101

```
[FUND ISOLATION]
You have access ONLY to data for ${fundName} (ID: ${fundContext.fund?.id || 'unknown'}).
Never reference, compare with, or attempt to access data from other funds.
```

**The problem:** Fund isolation is hardcoded as an absolute prohibition in the system prompt. The active fund is resolved once per request from `getActiveFundWithCurrency(session.user.id)`. All 5 tools filter by single `fundId`. There is no concept of organization-level access.

**What this prevents (for a multi-fund PE firm):**
- "How does Fund I compare to Fund II on MOIC?"
- "What's our firm-wide AUM across all funds?"
- "Which fund has the most overdue capital calls?"
- "Show me all deals across funds in the Technology sector"
- Organization-level dashboards, reporting, and analytics

**What to remove:** The absolute prohibition. Fund isolation is a security feature, not a product feature. It should be **permission-based** — a FUND_ADMIN sees their fund, a SUPER_ADMIN or future ORG_ADMIN can see all funds within their organization. The system prompt and tools should respect the user's actual permission scope, not a hardcoded rule.

---

### Ceiling 7: Phantom Budget Control

**Location:** `src/lib/ai/ai-config.ts` line 8

```typescript
monthlyBudgetUSD: Number(process.env.AI_MONTHLY_BUDGET_USD) || 50,
```

**The problem:** This budget exists in configuration but is **never checked or enforced anywhere in the codebase**. Zero queries aggregate `AIInteraction` costs. Zero middleware compares running cost against the budget. The only enforcement is request-level rate limiting (30/hr, 200/day) — which controls volume, not cost.

**Cost tracking today:**
- `trackAICost()` logs individual interaction costs to `AuditLog` via `logAudit()`
- Pricing: $3/1M input tokens, $15/1M output tokens (hardcoded in `cost-tracker.ts`)
- No aggregation, no rollup, no alerting, no throttling
- No per-fund, per-org, or per-tier budget differentiation

**What this prevents:**
- Tiered pricing (Starter: $50/mo AI budget, Scale: $500/mo)
- Per-organization cost governance
- Spending alerts before budget exhaustion
- Cost-aware tool routing (use cheaper model for simple queries)

**What to remove:** The illusion of budget control. Either enforce it with real middleware (aggregate costs, compare to budget, reject or throttle when exceeded) or remove the config to avoid false security assumptions.

---

## 3. Dependency Graph: The Removal Order

These ceilings have natural dependencies. Removing them in the wrong order creates wasted work.

```
                    ┌─────────────────────────┐
                    │  Ceiling 1: God Function │  ← REMOVE FIRST
                    │  (route.ts orchestrator) │
                    └────────┬────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Ceiling 2   │  │ Ceiling 3   │  │ Ceiling 7   │
    │ Tool        │  │ Prompt      │  │ Budget      │
    │ Monolith    │  │ Monolith    │  │ Enforcement │
    └─────────────┘  └─────────────┘  └─────────────┘
              │              │
              ▼              ▼
    ┌─────────────────────────────────┐
    │  Phase 1.5 can now scale to     │
    │  30+ tools without collapsing   │
    └─────────────────────────────────┘

    ┌─────────────┐
    │ Ceiling 4   │  ← REMOVE BEFORE PHASE 2
    │ No Background│
    │ Execution   │
    └──────┬──────┘
           ▼
    ┌─────────────────────────────────┐
    │  Phase 2 (proactive intel)      │
    │  is now architecturally possible│
    └─────────────────────────────────┘

    ┌─────────────┐  ┌─────────────┐
    │ Ceiling 5   │  │ Ceiling 6   │  ← REMOVE BEFORE PHASE 3
    │ Amnesia     │  │ Single-Fund │
    └──────┬──────┘  └──────┬──────┘
           │                │
           ▼                ▼
    ┌─────────────────────────────────┐
    │  Phase 3 (operating partner)    │
    │  with context + multi-fund      │
    └─────────────────────────────────┘
```

### Critical Path

| Step | Ceilings | Unlocks | Estimated Effort |
|------|----------|---------|------------------|
| **Step 1** | 1 + 2 + 3 | Phase 1.5 at scale (30+ tools) | 5-7 days |
| **Step 2** | 7 | Enterprise pricing/governance | 2-3 days |
| **Step 3** | 4 | Phase 2 (proactive intelligence) | 3-5 days |
| **Step 4** | 5 + 6 | Phase 3 (operating partner) | 5-7 days |

---

## 4. Target Architecture

### 4.1 Component Map (After Refactor)

```
src/lib/ai/
├── core/
│   ├── engine.ts                AI engine — composable pipeline
│   ├── types.ts                 Shared interfaces (ITool, IContext, IPromptSection)
│   └── providers/
│       ├── provider-registry.ts LLM provider registry (Anthropic, OpenAI, etc.)
│       └── anthropic.ts         Anthropic provider adapter
│
├── tools/
│   ├── registry.ts              Tool registry — register, query, filter by category
│   ├── base-tool.ts             Abstract base with fundId, currency, caching, logging
│   ├── deals/
│   │   ├── get-pipeline-summary.ts
│   │   ├── get-deal-details.ts
│   │   ├── get-deal-comparison.ts
│   │   └── get-due-diligence-status.ts
│   ├── capital/
│   │   ├── get-fund-financials.ts
│   │   ├── get-capital-activity.ts
│   │   └── get-distribution-history.ts
│   ├── investors/
│   │   ├── get-investor-details.ts
│   │   ├── get-investor-concentration.ts
│   │   └── get-communication-history.ts
│   ├── portfolio/
│   │   ├── get-portfolio-metrics.ts
│   │   └── get-portfolio-trends.ts
│   └── operations/
│       ├── get-overdue-tasks.ts
│       └── get-activity-timeline.ts
│
├── context/
│   ├── context-assembler.ts     Composable context builder with fallback
│   ├── sources/
│   │   ├── fund-context.ts      Fund data (existing, cleaned)
│   │   ├── user-context.ts      User data (existing)
│   │   └── conversation-context.ts  Cross-conversation summaries (new)
│   └── cache.ts                 Context caching layer (per-request TTL)
│
├── prompt/
│   ├── prompt-composer.ts       Section-based prompt builder
│   └── sections/
│       ├── identity.ts
│       ├── domain-knowledge.ts
│       ├── formatting-rules.ts
│       ├── fund-isolation.ts    Permission-based, not absolute
│       └── tools.ts             Auto-generated from tool registry metadata
│
├── budget/
│   ├── cost-tracker.ts          Existing cost logging (cleaned)
│   └── budget-enforcer.ts       Aggregate check before each request
│
├── memory/
│   ├── conversation-trimmer.ts  Existing trimming (cleaned)
│   └── conversation-summary.ts  Post-conversation summary generation
│
└── config.ts                    Environment + per-org config lookup
```

### 4.2 Data Flow (After Refactor)

```
POST /api/chat
  │
  ├─ Middleware: auth, rate-limit, budget-check
  │
  └─ AI Engine Pipeline:
       │
       ├─ 1. Resolve context scope (fund | org | multi-fund)
       │     └─ Based on user permissions, not hardcoded rule
       │
       ├─ 2. Assemble context (composable)
       │     ├─ FundContext source
       │     ├─ UserContext source
       │     ├─ ConversationContext source (cross-conversation summaries)
       │     └─ [Future: DocumentContext, MarketContext]
       │
       ├─ 3. Resolve tools (from registry)
       │     ├─ Filter by scope (fund/org)
       │     ├─ Filter by user tier (free/paid)
       │     ├─ Filter by feature flags
       │     └─ Auto-generate prompt section from tool metadata
       │
       ├─ 4. Compose prompt (section-based)
       │     ├─ Identity section
       │     ├─ Domain knowledge section
       │     ├─ Context section (from step 2)
       │     ├─ Tools section (auto-generated from step 3)
       │     ├─ Formatting section
       │     └─ Greeting/continuation section
       │
       ├─ 5. Execute LLM (provider-agnostic)
       │     ├─ Provider from registry (Anthropic, OpenAI, etc.)
       │     ├─ Model from config (per-org or global)
       │     └─ Streaming response
       │
       └─ 6. Post-process
             ├─ Persist messages
             ├─ Track cost
             ├─ Generate title (if new)
             └─ Generate conversation summary (on completion)
```

### 4.3 Tool Interface

```typescript
// src/lib/ai/core/types.ts

export interface ToolMetadata {
  name: string
  description: string
  category: 'deals' | 'capital' | 'investors' | 'portfolio' | 'operations'
  version: number
  costTier: 'low' | 'medium' | 'high'    // For cost-aware routing
  cacheTTL?: number                        // Seconds. 0 = no cache
  requiredScope: 'fund' | 'organization'   // Permission scope
}

export interface ToolContext {
  fundId: string
  currency: CurrencyCode
  userId: string
  organizationId?: string                  // For org-scoped tools
}

export interface ITool {
  metadata: ToolMetadata
  inputSchema: ZodSchema
  execute(input: unknown, context: ToolContext): Promise<unknown>
}
```

Each tool is a self-contained module:

```typescript
// src/lib/ai/tools/deals/get-pipeline-summary.ts

import type { ITool, ToolContext } from '../../core/types'
import { z } from 'zod'

export const getPipelineSummary: ITool = {
  metadata: {
    name: 'getPipelineSummary',
    description: 'Get deal pipeline counts by stage, total value, and active deals.',
    category: 'deals',
    version: 1,
    costTier: 'low',
    cacheTTL: 60,
    requiredScope: 'fund',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx: ToolContext) {
    const deals = await prisma.deal.findMany({
      where: { fundId: ctx.fundId, ...notDeleted },
      select: { stage: true, status: true, askingPrice: true },
    })
    // ... transform and return
  },
}
```

### 4.4 Tool Registry

```typescript
// src/lib/ai/tools/registry.ts

class ToolRegistry {
  private tools = new Map<string, ITool>()

  register(tool: ITool): void
  getAll(): ITool[]
  getByCategory(category: string): ITool[]
  getByScope(scope: 'fund' | 'organization'): ITool[]
  getForContext(ctx: ToolContext, userTier?: string): ITool[]

  // Auto-generate prompt section from registered tool metadata
  generatePromptSection(): string
}

export const toolRegistry = new ToolRegistry()

// Auto-registration: each tool file registers itself on import
toolRegistry.register(getPipelineSummary)
toolRegistry.register(getDealDetails)
// ...
```

### 4.5 Prompt Composer

```typescript
// src/lib/ai/prompt/prompt-composer.ts

class PromptComposer {
  private sections: PromptSection[] = []

  addSection(section: PromptSection): this
  removeSection(name: string): this

  // Builds final prompt string respecting order and token budget
  build(tokenBudget?: number): string
}

interface PromptSection {
  name: string
  order: number          // Controls position in final prompt
  required: boolean      // If false, can be dropped under token pressure
  content: string | (() => string)  // Static or dynamic
}
```

---

## 5. What Changes, What Stays

### 5.1 Preserved (Zero Regression Risk)

| Component | Status | Rationale |
|-----------|--------|-----------|
| Fund access control (`requireFundAccess`) | **Keep as-is** | Proven, battle-tested, correct |
| Audit logging (`logAudit`) | **Keep as-is** | Already fire-and-forget, works well |
| Soft delete pattern (`notDeleted`) | **Keep as-is** | Applied everywhere, consistent |
| Conversation persistence model | **Keep schema** | Add summary field, keep structure |
| Message persistence model | **Keep schema** | Add metadata field for future use |
| AI SDK v6 streaming pattern | **Keep pattern** | `streamText()` + `toUIMessageStreamResponse()` works |
| Rate limiting (`rateLimit`) | **Keep as-is** | Add budget layer on top, don't replace |
| Cost tracking to audit log | **Keep pattern** | Add aggregation, don't change logging |

### 5.2 Refactored

| Component | From | To |
|-----------|------|----|
| `route.ts` (226 lines) | God function | Thin handler calling AI engine pipeline |
| `read-tools.ts` (314 lines) | Single function, flat object | Tool registry with per-file modules |
| `system-prompt.ts` (135 lines) | Monolithic string builder | Section-based `PromptComposer` |
| `fund-context.ts` (99 lines) | Hardcoded 5 queries | Composable context source with fallback |
| `ai-config.ts` (23 lines) | Global constants | Environment + per-org config lookup |

### 5.3 Added (New Infrastructure)

| Component | Purpose | Phase Unlocked |
|-----------|---------|----------------|
| `core/types.ts` | `ITool`, `IContext`, `IPromptSection` interfaces | 1.5 |
| `tools/registry.ts` | Dynamic tool registration and filtering | 1.5 |
| `prompt/prompt-composer.ts` | Section-based prompt composition | 1.5 |
| `budget/budget-enforcer.ts` | Aggregate cost check middleware | 1.5 (enterprise) |
| `memory/conversation-summary.ts` | Post-conversation summary persistence | 2 |
| Background execution layer (CRON/EventBridge) | Scheduled Emma runs | 2 |
| `context/sources/conversation-context.ts` | Cross-conversation context | 3 |

---

## 6. Migration Strategy: Zero-Downtime Refactor

The refactor follows a strangler fig pattern — new architecture grows alongside old, old components are replaced one at a time, and at no point does the system break.

### Phase R1: Foundation (Ceilings 1 + 2 + 3)

**Goal:** Decompose the monolith into composable components. Emma's external behavior is unchanged.

| Step | Action | Validation |
|------|--------|------------|
| R1.1 | Extract `ITool` interface and `ToolContext` type into `core/types.ts` | TypeScript compiles |
| R1.2 | Create `ToolRegistry` class in `tools/registry.ts` | Unit tests pass |
| R1.3 | Migrate each of the 5 existing tools into individual files implementing `ITool` | Each tool unit-testable, registry.getAll() returns 5 |
| R1.4 | Create `PromptComposer` in `prompt/prompt-composer.ts` | Generates identical prompt to current `buildSystemPrompt()` |
| R1.5 | Create AI engine pipeline in `core/engine.ts` that orchestrates context → tools → prompt → LLM | Integration test: same response for same input |
| R1.6 | Rewrite `route.ts` as thin handler delegating to engine | All existing E2E chat tests pass |
| R1.7 | Delete old `read-tools.ts`, `system-prompt.ts` | Verify no imports reference deleted files |

**Validation gate:** Deploy to staging, run full conversation suite, verify identical behavior.

### Phase R2: Budget Enforcement (Ceiling 7)

| Step | Action | Validation |
|------|--------|------------|
| R2.1 | Add cost aggregation query: SUM of `AIInteraction` costs per org per month | Query returns correct totals |
| R2.2 | Create `budget-enforcer.ts` middleware: check aggregate before each request | Returns 429 when budget exceeded |
| R2.3 | Add per-org AI config to Organization model (optional `aiMonthlyBudgetUSD` field) | Prisma migration, default to global config |

### Phase R3: Background Execution (Ceiling 4)

| Step | Action | Validation |
|------|--------|------------|
| R3.1 | Evaluate execution options: Vercel CRON, AWS EventBridge + Lambda, or EC2 CRON | Decision documented |
| R3.2 | Create scheduled analysis endpoint (`/api/ai/scheduled/[type]`) | Endpoint callable, runs Emma tools without user message |
| R3.3 | Create digest generation pipeline | Generates fund digest, routes to notification system |
| R3.4 | Create alert detection pipeline (stale deals, overdue calls) | Detects anomalies, creates notifications |

### Phase R4: Memory + Multi-Fund (Ceilings 5 + 6)

| Step | Action | Validation |
|------|--------|------------|
| R4.1 | Add `summary` field to `Conversation` model | Prisma migration |
| R4.2 | Create post-conversation summary generation (Haiku, fire-and-forget) | Summaries persisted on conversation end |
| R4.3 | Create `conversation-context.ts` source: inject recent conversation summaries | System prompt includes cross-conversation context |
| R4.4 | Add permission-based fund scope resolution (fund vs. org) | SUPER_ADMIN/ORG_ADMIN can access multi-fund tools |
| R4.5 | Create org-scoped tool variants where applicable | `getFirmWideAUM`, `compareFunds` tools |

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Refactor breaks existing chat flow | Medium | High | Strangler fig: old code works until new code is validated |
| Tool registry adds startup latency | Low | Low | Tools are statically imported, registry is in-memory |
| Prompt composer generates different prompt | Medium | Medium | Snapshot test: compare old vs. new prompt output character-by-character |
| Budget enforcement blocks paying users | Low | High | Generous defaults, admin override, grace period before hard block |
| Background execution increases costs | Medium | Medium | Start with daily (not hourly), per-fund opt-in |
| Cross-conversation context leaks sensitive info | Low | High | Summaries are fund-scoped, same access controls apply |

---

## 8. What We Explicitly Do NOT Build

Via negativa means removing, not just adding. These are capabilities we **reject** at this stage:

| Rejected | Reason |
|----------|--------|
| Vector DB / RAG / embeddings | Premature optimization. Cross-conversation summaries solve 80% of the memory problem at 5% of the complexity. Revisit when we have 1000+ conversations per fund. |
| Multi-model routing (GPT + Claude) | One excellent model beats two mediocre ones. Stay with Claude until a specific use case demands a different provider. The registry supports it architecturally, but we don't build the routing logic now. |
| Real-time event streaming | WebSocket infrastructure is heavy. CRON-based scheduled runs (daily/weekly) cover 90% of Phase 2 use cases. Event-driven alerts can trigger on the next CRON tick, not real-time. |
| Document content analysis | Requires OCR, PDF parsing, and potentially fine-tuned models. Phase 3+ at earliest. The architecture supports it (new context source), but we don't build the pipeline now. |
| Custom tool authoring by users | Power-user feature with massive security surface. Reject entirely. Tools are authored by engineering only. |
| Agent-to-agent orchestration | Multi-agent frameworks (CrewAI, AutoGen) add complexity without proven ROI for our use case. Emma is one agent with many tools, not a team of agents. |

---

## 9. Success Criteria

The refactor is complete when:

| Criterion | Measurement |
|-----------|-------------|
| **Behavioral parity** | Existing conversations produce identical responses before and after refactor |
| **Tool modularity** | Adding a new tool requires creating one file + one `registry.register()` call. Zero changes to route.ts, system-prompt, or any other tool. |
| **Prompt composability** | Adding a prompt section requires one file. Removing a section requires deleting one file. |
| **Budget enforcement** | Exceeding monthly budget returns 429 with clear error message |
| **Independent testability** | Each tool has unit tests that run without database or LLM |
| **Build passes** | `npm run build` + `npm run lint` + full test suite green |

---

## 10. Decision Required

**Marcus:** This document presents the case for refactoring Emma's architecture before scaling to Phase 1.5+. The core thesis is that 7 structural ceilings in the current 944-line AI codebase will collapse under the weight of 30+ tools, proactive intelligence, and work product generation.

The refactor follows a strangler fig pattern — zero downtime, behavioral parity at every step, and each phase unlocks a specific scaling capability.

**The question for you:**

1. **Do you agree with the via negativa diagnosis?** Are there ceilings we missed or ceilings we're over-indexing on?

2. **Do you agree with the removal order?** The critical path is Ceilings 1-3 first (unlocks Phase 1.5), then Ceiling 7 (enterprise pricing), then Ceiling 4 (unlocks Phase 2), then Ceilings 5-6 (unlocks Phase 3).

3. **Do you agree with what we explicitly do NOT build?** Specifically: no vector DB, no multi-model routing, no real-time events, no document analysis, no custom tools, no multi-agent orchestration.

4. **Green light to execute Phase R1 (foundation refactor)?** Estimated 5-7 engineering days, zero behavioral change to users, unlocks scalable tool and prompt architecture.

---

*"The purpose of abstraction is not to be vague, but to create a new semantic level in which one can be absolutely precise."*
— Edsger W. Dijkstra

---

*— END OF DOCUMENT —*
