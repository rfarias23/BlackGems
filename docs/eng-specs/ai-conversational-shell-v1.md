# ENGINEERING SPECIFICATION
## AI Conversational Shell — Phase 1
### The Onboarding-to-Copilot Bridge

**v1.1 — Implementation-Ready (AI SDK v6 Verified)**

NIRO Group LLC — Strictly Confidential | February 2026

---

| Field | Value |
|-------|-------|
| Status | READY FOR IMPLEMENTATION |
| Version | 1.1 — AI SDK v6 Verified |
| Priority | P0 — Core Product Differentiator |
| Prerequisites | Phase 2 Onboarding Wizard (✅ merged), Multi-Fund + Multi-Currency (✅ shipped) |
| Schema Changes | +2 Prisma models (Conversation, Message), 1 migration |
| Estimated Effort | 12 working days across 3 sprints |
| Companion Docs | Technical PRD v1.0, Copilot Corrections v2, Onboarding Wizard Spec v3 |

---

## 0. Why This Document Exists

BlackGem has three approved documents that define the AI copilot: the Product PRD v3.0 (strategic/experiential), the Technical PRD v1.0 (architecture/tools), and the Copilot Plan Corrections v2 (gap analysis). Together they total ~15,000 words across overlapping concerns.

This spec consolidates all three into a **single implementation-ready document** that an engineer can execute against. It incorporates every correction from the Corrections v2 document, resolves all open questions, and sequences the work into concrete phases with gate requirements.

The scope is deliberately bounded: **the conversational shell + onboarding integration**. Not all 20 tools. Not Phase 3 autopilot. The minimum viable copilot that (a) replaces the Getting Started card with a living AI interaction, (b) establishes the full conversation infrastructure (persistence, token management, fund isolation), and (c) delivers enough read tools to demonstrate the AI-native value proposition in a user's first 5 minutes.

---

## 1. Strategic Context

### 1.1 The Core Thesis

From the Product PRD v3.0:

> "BlackGem is not software you use. It is an AI operating partner that runs your fund."

The onboarding wizard (now shipped) creates the Organization → Fund → User → FundMember hierarchy and lands the user on their subdomain dashboard. Today, that dashboard is empty. The Getting Started card (deferred from onboarding spec v3, §8.2) was designed as a static checklist. This spec replaces that checklist with the AI copilot's first interaction — making the **terminal onboarding experience a conversation, not a checkbox list**.

### 1.2 JTBD — Job to Be Done

> "I just created my fund on BlackGem 30 seconds ago. I have zero data. I need to understand what this platform can do for me and feel confident it was built for someone like me — not a generic SaaS dashboard with an AI chatbot glued on."

The first copilot interaction IS the onboarding. The agent:
1. Greets the user by name (from registration data)
2. Acknowledges the fund type and configuration
3. Guides the user through first actions (configure fund, add a deal, invite LPs)
4. Demonstrates domain intelligence (knows PE terminology, search fund lifecycle)
5. Sets the tone: institutional, precise, never guesses

### 1.3 Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | New user has first AI interaction within 60 seconds of registration | Time from dashboard load to copilot greeting |
| 2 | Conversation persists across page navigation, refresh, and next-day login | Conversation retrieval from DB |
| 3 | 5 read tools return accurate fund data via natural language | Tool execution accuracy |
| 4 | Token budget respected at 50K tokens per request | Trimmer unit test |
| 5 | Fund isolation: zero cross-fund data leakage | 3-layer guardrail verification |
| 6 | Streaming error recovery: retry button, partial response preserved | Error flow manual test |
| 7 | Cost tracked per interaction (prompt tokens, completion tokens, USD) | AuditLog entries |
| 8 | Mobile: graceful degradation (hidden < 1024px, Phase 2 full-screen) | Responsive test |
| 9 | All existing 485 tests pass + 35-45 new AI tests | Test suite |
| 10 | Cmd+K / Ctrl+K toggles panel | Keyboard shortcut test |

### 1.4 The Governing Principle

From the Copilot Corrections v2:

> "If a search fund principal uses ChatGPT for 30 minutes before opening BlackGem, and our copilot feels worse, we have failed regardless of how clean the architecture is."

The standard is ChatGPT, Claude, and Perplexity — not Juniper Square's JunieAI.

---

## 2. Architecture

### 2.1 Four-Layer Model (from Technical PRD v1.0)

| Layer | Name | Status | Description |
|-------|------|--------|-------------|
| 4 | Conversation UI | **THIS SPEC** | React component. Chat panel, rich rendering, Stealth Wealth. |
| 3 | Agent Orchestration | **THIS SPEC** | Claude API via AI SDK. Tool definitions wrapping server actions. |
| 2 | Context Assembly | **THIS SPEC** | Fund state queries, system prompt, token management. |
| 1 | Deterministic Core | EXISTS (✅) | 27 Prisma models, 100+ server actions, business rules. |
| 0 | Data | EXISTS (✅) | PostgreSQL (Neon). 485 tests passing. |

**Key Principle:** The AI agent (probabilistic) NEVER performs calculations, generates financial numbers, or modifies data directly. It translates natural language into calls to the deterministic layer.

### 2.2 System Flow

```
User types message in copilot panel
  │
  ├─ Client: useChat({ transport }) sends UIMessages to /api/chat
  │    └─ No fundId in body — resolved server-side from cookie
  │    └─ useChat manages input state externally (v6 pattern)
  │
  ├─ API Route: /api/chat (POST)
  │    ├─ ① Auth: session = await auth()
  │    ├─ ② Fund resolution: getActiveFundWithCurrency() from cookie
  │    ├─ ③ Fund access: requireFundAccess(userId, fund.id)
  │    ├─ ④ Conversation: create or load conversationId
  │    ├─ ⑤ Convert: convertToModelMessages(messages) for streamText
  │    ├─ ⑥ Token trim: conversationTrimmer(modelMessages, 50_000)
  │    ├─ ⑦ Context assembly: assembleFundContext(fund.id)
  │    ├─ ⑧ streamText({ model, instructions, messages, tools })
  │    │    └─ onFinish: trackAICost() (fire-and-forget, usage.inputTokens)
  │    ├─ ⑨ toUIMessageStreamResponse({ onFinish: persistMessages() })
  │    │    └─ onFinish receives UIMessage[] — persist to DB here
  │    └─ ⑩ Return: createUIMessageStreamResponse with conversationId header
  │
  └─ Client: stream renders, message appears character by character
```

### 2.3 Fund Resolution (Correction 3 — Cookie-Based)

The API route calls `getActiveFundWithCurrency()` to resolve the active fund from the `blackgem-active-fund` cookie. The client does NOT send fundId. This is simpler and more secure.

When the user switches funds in the sidebar:
1. Copilot detects fund change (cookie/context update)
2. Current conversation saved and closed
3. New conversation created, scoped to new fund
4. Inline message: "Switched to {Fund Name} ({currency}). Starting a new conversation."
5. Conversation list filters to active fund only

### 2.4 Cross-Fund Isolation (Correction 7 — Three Layers)

**Layer 1: Deterministic (Tool Level)**
Every tool receives fundId from the Conversation record (immutable after creation). All Prisma queries filter by this fundId. Tools physically cannot return data from another fund.

**Layer 2: Communicative (System Prompt)**
```
"You are scoped to {fundName} ({currency}). If the user asks about a different fund, deal, investor, or entity that does not belong to this fund, you must NOT attempt to answer, search, or speculate. Instead, respond: 'That information belongs to a different fund. I recommend switching funds in the sidebar and opening a new conversation to keep your fund data properly isolated.' Never mix data from different funds. This is a compliance requirement."
```

**Layer 3: Behavioral (Fund Switch UX)**
Fund switch → auto-new conversation → previous fund conversations hidden until that fund is active again.

---

## 3. New Dependencies

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| ai | ^6.x | Vercel AI SDK core — streamText, tool definitions | ~120KB |
| @ai-sdk/anthropic | ^1.x | Claude provider | ~25KB |
| @ai-sdk/react | ^1.x | useChat, useCompletion hooks | ~40KB |
| zod | ^4.x | EXISTS — tool parameter schemas | 0 (existing) |

### Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...          # Required for AI
AI_MODEL=claude-sonnet-4-5-20250929   # Default model
AI_RATE_LIMIT_PER_HOUR=30             # Per user per hour
AI_RATE_LIMIT_PER_DAY=200             # Per fund per day
AI_MONTHLY_BUDGET_USD=50              # Cost ceiling, alert at $25
```

**Graceful degradation:** If `ANTHROPIC_API_KEY` is absent, build succeeds, AI features show "unavailable" state. AI toggle hidden. No crash.

### AI SDK v6 Breaking Changes (Verified Feb 2026)

The Technical PRD v1.0 and Copilot Corrections v2 were written against AI SDK v4 patterns. AI SDK v6 (current stable) introduces several breaking changes that this spec incorporates:

| v4/v5 Pattern | v6 Pattern | Impact |
|---------------|-----------|--------|
| `result.toDataStreamResponse()` | `result.toUIMessageStreamResponse()` | **CRITICAL.** Stream protocol changed. UIMessage streams support tool parts, metadata, persistence natively. |
| `useChat({ api })` | `useChat({ transport: new DefaultChatTransport({ api }) })` | Transport-based architecture. `body` no longer dynamically updates. |
| `append(message)` | `sendMessage({ text })` | Input method renamed. Input state managed externally (not by hook). |
| `onFinish` in `streamText` for persistence | `onFinish` in `toUIMessageStreamResponse` for persistence | **CRITICAL.** Message persistence happens in the stream response callback, which receives complete `UIMessage[]`. Cost tracking remains in `streamText.onFinish`. |
| `usage.promptTokens` / `completionTokens` | `usage.inputTokens` / `usage.outputTokens` | Token field names changed. `totalTokens` unchanged. |
| `messages` array directly to `streamText` | `convertToModelMessages(messages)` | UIMessages must be converted to ModelMessages before passing to `streamText`. |
| `CoreMessage` type | Removed in v6 | Use `UIMessage` (frontend) and `ModelMessage` (backend) types. |
| `needsApproval: true` + `addToolApprovalResponse({ toolCallId, result })` | `needsApproval: true` + `addToolApprovalResponse({ id: approvalId, approved: boolean })` | Phase 2 concern. API signature slightly changed. Also supports dynamic `needsApproval: (input) => boolean`. |
| N/A | `sendAutomaticallyWhen` on `useChat` | New: auto-send after tool approval responses. Required for Phase 2 approval flow. |

---

## 4. Schema Changes

### 4.1 New Prisma Models

```prisma
model Conversation {
  id          String    @id @default(cuid())
  fund        Fund      @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  title       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  archivedAt  DateTime?
  messages    Message[]

  @@index([fundId])
  @@index([userId])
  @@index([updatedAt])
}

model Message {
  id               String       @id @default(cuid())
  conversation     Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  conversationId   String
  role             String       // 'user' | 'assistant' | 'system' | 'tool'
  content          String       @db.Text
  toolInvocations  Json?        // AI SDK tool call/result data
  tokenCount       Int?         // Estimated tokens for this message
  createdAt        DateTime     @default(now())

  @@index([conversationId])
  @@index([createdAt])
}
```

### 4.2 Model Relationships

Add to existing models:
```prisma
model Fund {
  // ... existing fields
  conversations Conversation[]
}

model User {
  // ... existing fields
  conversations Conversation[]
}
```

### 4.3 Migration

```bash
npx prisma migrate dev --name add_ai_conversations
```

One migration. No data transformation. Pure additive.

---

## 5. File Manifest

### 5.1 New Files (18)

| File | Purpose |
|------|---------|
| **API** | |
| `src/app/api/chat/route.ts` | POST handler: auth, fund resolution, stream, persist |
| **AI Core** | |
| `src/lib/ai/ai-config.ts` | Model selection, rate limits, feature flags |
| `src/lib/ai/system-prompt.ts` | Dynamic system prompt with PE domain knowledge |
| `src/lib/ai/cost-tracker.ts` | Token → USD logging via AuditLog |
| `src/lib/ai/conversation-trimmer.ts` | Sliding window: 50K token budget |
| **AI Context** | |
| `src/lib/ai/context/fund-context.ts` | Assemble fund state from Prisma |
| `src/lib/ai/context/user-context.ts` | User role, permissions, preferences |
| **AI Tools** | |
| `src/lib/ai/tools/read-tools.ts` | 5 read-only tool definitions (Phase 1) |
| `src/lib/ai/tools/index.ts` | Tool registry export |
| **Server Actions** | |
| `src/lib/actions/ai-conversations.ts` | CRUD: create, get, list, archive conversations |
| **UI Components** | |
| `src/components/ai/ai-copilot.tsx` | Main chat interface with useChat |
| `src/components/ai/ai-copilot-provider.tsx` | Context: conversationId, conversations state |
| `src/components/ai/ai-message.tsx` | Message renderer (text + rich tool results) |
| `src/components/ai/ai-tool-result.tsx` | Inline component renderer for tool data |
| `src/components/ai/ai-toggle.tsx` | Panel show/hide control (header button) |
| **Tests** | |
| `src/__tests__/ai-tools.test.ts` | Tool schema validation |
| `src/__tests__/ai-context.test.ts` | Context assembly |
| `src/__tests__/ai-conversations.test.ts` | Conversation CRUD |

### 5.2 Modified Files (4)

| File | Change |
|------|--------|
| `prisma/schema.prisma` | +2 models (Conversation, Message) + Fund/User relations |
| `src/app/(dashboard)/layout.tsx` | Add AICopilot panel + AICopilotProvider |
| `.env.example` | Add AI environment variables |
| `package.json` | Add ai, @ai-sdk/anthropic, @ai-sdk/react |

### 5.3 Files NOT Touched

All 100+ existing server actions, all existing UI components, all business logic. The AI layer consumes them as-is.

---

## 6. System Prompt Architecture

### 6.1 Structure

| Section | Content | Source | Tokens (~) |
|---------|---------|--------|-----------|
| Identity | BlackGem agent role, communication style | Static | ~200 |
| PE Domain | Search fund lifecycle, LP/GP economics, capital calls, DD categories, waterfalls | Static | ~800 |
| Fund Context | AUM, stage, pipeline summary, LP count, recent activity | Dynamic (Prisma) | ~400 |
| User Context | Name, role, permissions, timezone | Dynamic (session) | ~100 |
| Currency | Fund currency, formatting instructions | Dynamic (fund) | ~50 |
| Fund Isolation | Cross-fund guardrail | Static | ~100 |
| Tool Instructions | When to use each tool, how to present financial data | Static | ~500 |
| Formatting | Stealth Wealth voice, monospace for numbers, no emojis | Static | ~200 |

**Total: ~2,350 tokens.** Leaves ~125K for conversation + tool results on Claude Sonnet.

### 6.2 Fund Context Assembly

```typescript
// src/lib/ai/context/fund-context.ts
export async function assembleFundContext(fundId: string) {
  const [fund, dealCounts, investorSummary, capitalStatus, portfolio] =
    await Promise.all([
      prisma.fund.findUnique({ where: { id: fundId } }),
      prisma.deal.groupBy({
        by: ['stage'], where: { fundId, deletedAt: null }, _count: true
      }),
      prisma.commitment.aggregate({
        where: { fundId }, _sum: { amount: true, paidAmount: true }
      }),
      prisma.capitalCall.findMany({
        where: { fundId }, orderBy: { createdAt: 'desc' }, take: 3
      }),
      prisma.portfolioCompany.findMany({
        where: { fundId, deletedAt: null },
        include: { metrics: { take: 1, orderBy: { period: 'desc' } } }
      }),
    ]);
  return { fund, dealCounts, investorSummary, capitalStatus, portfolio };
}
```

### 6.3 Multi-Currency Instructions

```
"This fund operates in {currency} ({currencySymbol}). Format ALL monetary values with the correct symbol and locale. Never use a different currency symbol. Tool results are already formatted correctly — match their formatting in your narrative text."
```

### 6.4 First-Time User Greeting

When the conversation is the user's first ever (0 previous conversations for this fund), the system prompt includes:

```
"This is the user's first interaction with BlackGem AI. Their fund was just created and has no data yet. Greet them by name, acknowledge their fund ({fundName}), and guide them through their first steps: (1) Configure fund settings, (2) Add their first deal, (3) Invite their LPs. Be warm but institutional. This is their first impression of BlackGem's AI operating partner."
```

---

## 7. Conversation Persistence (Correction 1)

### 7.1 Server Actions

```typescript
// src/lib/actions/ai-conversations.ts
'use server'

// Pattern: auth() → requireFundAccess() → query → return

export async function getConversations(fundId: string)
  // Returns last 20 conversations for this fund, ordered by updatedAt desc

export async function getConversationMessages(conversationId: string)
  // Verify conversation.fundId access → return messages

export async function createConversation(fundId: string, title?: string)
  // auth() → requireFundAccess() → create → return id

export async function archiveConversation(id: string)
  // auth() → verify ownership → set archivedAt
```

### 7.2 API Route Persistence

On each request to `/api/chat`:
1. If no `conversationId` in request, call `createConversation()`, return ID in response headers
2. Persist user message to Message table (fire-and-forget, never block stream)
3. In `onFinish`: persist assistant response including `toolInvocations` JSON
4. Auto-generate conversation title from first user message (truncated to 60 chars)

### 7.3 Frontend Persistence

- `ai-copilot.tsx`: Load `initialMessages` from server when mounting with existing `conversationId`
- `ai-copilot.tsx`: Conversation list dropdown in panel header (last 20)
- `ai-copilot.tsx`: "New conversation" button
- `ai-copilot-provider.tsx`: `currentConversationId` and `conversations` in context
- `currentConversationId` persisted in localStorage for panel resume

### 7.4 UX Scope

| Must Have (Phase 1) | Can Wait (Phase 2) | Never Do |
|---------------------|---------------------|----------|
| Survives page navigation | Full-text search | Expose GP conversations to LP portal |
| Survives browser refresh | Rename/organize | Cross-fund conversation references |
| Accessible next day | Share with team | Let agent reference other users' conversations |
| List of recent (last 20) | Bulk archive/delete | |
| New conversation button | Export | |

---

## 8. Conversation Token Management (Correction 2)

### 8.1 The Problem

After 20-30 exchanges with tool calls, the messages array can exceed 50K tokens. Cost scales linearly. Response quality degrades beyond ~100K tokens.

### 8.2 The Solution

```typescript
// src/lib/ai/conversation-trimmer.ts

const TOKEN_BUDGET = 50_000;
const CHARS_PER_TOKEN = 4; // Rough heuristic

export function trimConversation(messages: Message[]): Message[] {
  // 1. Estimate total tokens
  // 2. If under budget, return as-is
  // 3. Keep first message (context) + last 30 messages
  // 4. If still over budget, drop oldest (keeping first)
  // 5. Inject summary marker: "[Earlier conversation context omitted]"
}
```

### 8.3 Phase 1 Simplification

Keep the last 30 messages in the request. Older messages exist in the database but are not sent to Claude. Pure function, fully testable.

---

## 9. Phase 1 Tools (5 Read-Only)

### 9.1 Tool Registry

| # | Tool | Description | Wraps |
|---|------|-------------|-------|
| 1 | `getPipelineSummary` | Deal counts by stage, total pipeline value, velocity | `getDealsByFund()` |
| 2 | `getDealDetails` | Full details for a specific deal by name or ID | `getDealById()` |
| 3 | `getFundFinancials` | Fund financial summary: committed, called, distributed, MOIC | `getFundById()` + `getCommitments()` |
| 4 | `getInvestorDetails` | LP details with commitment, paid-in, contact info | `getInvestorsByFund()` |
| 5 | `getPortfolioMetrics` | Portfolio company metrics: revenue, EBITDA, margins | `getPortfolioCompaniesByFund()` |

### 9.2 Tool Implementation Pattern

```typescript
// src/lib/ai/tools/read-tools.ts
import { z } from 'zod';
import { getDealsByFund } from '@/lib/actions/deals';

export function readTools(fundId: string) {
  return {
    getPipelineSummary: {
      description: 'Get current deal pipeline with counts by stage, total pipeline value, and velocity metrics.',
      parameters: z.object({}),
      execute: async () => {
        const deals = await getDealsByFund(fundId);
        const byStage = deals.reduce((acc, d) => {
          acc[d.stage] = (acc[d.stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        return {
          totalDeals: deals.length,
          activeDeals: deals.filter(d => d.status === 'ACTIVE').length,
          byStage,
          totalPipelineValue: deals.reduce((s, d) => s + (d.askingPrice || 0), 0),
        };
      },
    },
    // ... 4 more tools following same pattern
  };
}
```

### 9.3 Why Only 5 Tools in Phase 1

The Copilot Corrections v2 defines 20 tools total (10 read + 10 write). Phase 1 ships 5 read tools — enough to:
- Answer pipeline questions ("How many deals are in DD?")
- Show fund financials ("What's my paid-in percentage?")
- Look up LPs ("Show me David Chen's commitment")
- Display portfolio metrics ("How is revenue trending?")
- Demonstrate the AI-native value proposition in under 5 minutes

Write tools (Phase 2) require the `needsApproval` UI which adds 2-3 days. Ship read-only first, prove the conversation is valuable, then add write capabilities.

---

## 10. API Route

### 10.1 Route Handler

```typescript
// src/app/api/chat/route.ts
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { auth } from '@/lib/auth';
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access';
import { requireFundAccess } from '@/lib/shared/fund-access';
import { readTools } from '@/lib/ai/tools/read-tools';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { assembleFundContext } from '@/lib/ai/context/fund-context';
import { trackAICost } from '@/lib/ai/cost-tracker';
import { trimConversation } from '@/lib/ai/conversation-trimmer';
import { persistMessages } from '@/lib/actions/ai-conversations';

export async function POST(req: Request) {
  // 1. Auth
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  // 2. Parse + fund resolution from cookie
  const { messages, conversationId } = await req.json();
  const fund = await getActiveFundWithCurrency();
  if (!fund) return new Response('No active fund', { status: 400 });

  // 3. Fund access guard
  await requireFundAccess(session.user.id, fund.id);

  // 4. Rate limiting (per-user per-hour)
  // ... rateLimit(session.user.id, AI_RATE_LIMIT_PER_HOUR, 3600_000)

  // 5. Conversation persistence (create or load)
  // ... resolve or create conversationId via server actions

  // 6. Convert UIMessages → ModelMessages + trim
  const modelMessages = await convertToModelMessages(messages);
  const trimmedMessages = trimConversation(modelMessages);

  // 7. Context assembly
  const fundContext = await assembleFundContext(fund.id);
  const userContext = { name: session.user.name, role: session.user.role };

  // 8. Stream — cost tracking in streamText.onFinish
  const result = streamText({
    model: anthropic(process.env.AI_MODEL || 'claude-sonnet-4-5-20250929'),
    instructions: buildSystemPrompt(fundContext, userContext, fund),
    messages: trimmedMessages,
    tools: { ...readTools(fund.id) },
    onFinish: async ({ usage }) => {
      // Fire-and-forget cost tracking
      // v6: usage.inputTokens / usage.outputTokens (not promptTokens)
      trackAICost(session.user.id, fund.id, usage)
        .catch(err => console.error('Cost tracking error:', err));
    },
  });

  // 9. Return UIMessage stream — persistence in stream.onFinish
  return result.toUIMessageStreamResponse({
    onFinish: async ({ messages: allMessages }: { messages: UIMessage[] }) => {
      // Persist complete conversation (UIMessage format) to DB
      // This callback receives ALL messages including the new assistant response
      persistMessages(conversationId, allMessages)
        .catch(err => console.error('Persistence error:', err));
    },
  });
}
```

### 10.2 Auth & Authorization

Every request through the same pipeline as existing server actions:
- Session via `auth()` (NextAuth v5 JWT)
- Fund membership via `requireFundAccess()`
- Phase 1: all authenticated users get read tools (LP roles get read-only subset in Phase 2)

### 10.3 Rate Limiting

- Per user: 30 requests per hour
- Per fund: 200 requests per day
- Monthly budget ceiling: $50 USD with Sentry alert at $25

---

## 11. Frontend Components

### 11.1 Layout Integration

The AICopilot panel integrates into the dashboard layout as a resizable right sidebar:
- **Default state:** Collapsed (icon button in header)
- **Expanded state:** 400px wide, pushes main content left
- **Persistent:** Lives in dashboard layout, survives navigation
- **State:** Open/closed in localStorage
- **Keyboard:** Cmd+K / Ctrl+K to toggle
- **Mobile:** Hidden below 1024px (Phase 1). Full-screen sheet (Phase 2).

### 11.2 Component Hierarchy

```
<DashboardLayout>
  <AICopilotProvider>          <!-- Context: conversationId, conversations -->
    <MainContent />            <!-- Existing dashboard -->
    <AICopilot>                <!-- Right panel, conditionally rendered -->
      <ConversationHeader />   <!-- Title, conversation list, new button -->
      <MessageList>            <!-- Scrollable message area -->
        <AIMessage />          <!-- Per-message: text or rich component -->
        <AIToolResult />       <!-- Inline tool result rendering -->
      </MessageList>
      <ChatInput />            <!-- Input field + send button -->
      <ErrorRecovery />        <!-- Retry button, connection status -->
    </AICopilot>
    <AIToggle />               <!-- Header button, hidden on mobile -->
  </AICopilotProvider>
</DashboardLayout>
```

### 11.3 Rich Tool Result Rendering

| Tool Result | Rendered Component | Source |
|-------------|-------------------|--------|
| Pipeline summary | Mini stage chart (horizontal bars) | Adapted from deals/pipeline-analytics |
| Deal details | Deal card (compact) | Adapted from deals/deal-table row |
| Fund financials | Metrics grid (committed/called/distributed/MOIC) | Adapted from dashboard metrics |
| LP details | Investor card with commitment summary | Adapted from investors/investor-table row |
| Portfolio metrics | Revenue/EBITDA mini-table | Adapted from portfolio page |

### 11.4 Stealth Wealth Design

| Element | Specification |
|---------|---------------|
| Panel background | `bg-[#080A0F]` |
| Message bubbles | User: `bg-[#1E2432]`. Assistant: transparent, `text-[#E2E8F0]` |
| Input field | `bg-[#0F1218] border-[#1E293B] focus:border-[#3E5CFF]` |
| Financial numbers | `font-mono` — always monospace for numerical data |
| Tool result cards | `bg-[#111827] border-[#1E293B] rounded-lg` |
| Send button | `bg-[#3E5CFF]` icon only |
| Toggle button | Ghost style in header. Active: `text-[#3E5CFF]` |
| No emojis | Ever. Institutional tone. |
| No spinners | "Thinking..." text with subtle pulse on assistant avatar |

### 11.5 Streaming Error Recovery (Correction 4)

1. `useChat` `onError` catches error, sets local error state
2. Inline error: "Connection interrupted. Your previous messages are saved."
3. "Retry" button re-sends last user message
4. Partial assistant response preserved (not discarded)
5. Input field NEVER blocked — user can always type
6. After 3 consecutive failures: "BlackGem AI is temporarily unavailable. Your Cockpit is fully functional."

---

## 12. Onboarding Integration

### 12.1 The Bridge

The onboarding wizard success step currently shows "Your account is ready" and redirects to the dashboard. With this spec, the dashboard loads with the copilot panel auto-opened and the first-time greeting pre-loaded.

### 12.2 First-Time Detection

```typescript
// In AICopilotProvider, on mount:
const conversations = await getConversations(fundId);
if (conversations.length === 0) {
  // First time: auto-open panel, create conversation, trigger greeting
  setIsOpen(true);
  const conv = await createConversation(fundId, 'Welcome');
  // The system prompt's first-time instruction generates the greeting
  // Send an empty user message or use initialMessages pattern
}
```

### 12.3 First Interaction Flow

```
[Panel auto-opens on first visit]

AI: "Welcome to BlackGem, Sofia. Your fund Andes Capital is set up
    and ready.

    I'm your AI operating partner. I can help you manage your pipeline,
    track LP commitments, monitor portfolio performance, and prepare
    investor reports.

    Here's what I'd suggest first:

    1. Configure your fund settings — fees, dates, legal details
    2. Add your first deal to the pipeline
    3. Invite your investors

    What would you like to start with?"

Sofia: "How do I add a deal?"

AI: "To add a deal, navigate to the Deals section in the sidebar, or I
    can walk you through the information I'll need once write operations
    are enabled. For now, you can click 'Deals' → 'New Deal' in the
    sidebar.

    A typical search fund deal entry includes: company name, industry,
    location, asking price, EBITDA, and your initial assessment of fit.

    Would you like me to explain what information is most important for
    your pipeline tracking?"
```

### 12.4 Replacing the Getting Started Card

The Getting Started card (Onboarding Spec v3, §8.2) is **no longer needed as a separate component**. The copilot's first interaction covers the same checklist items conversationally:

| Getting Started Card Item | Copilot Equivalent |
|---------------------------|-------------------|
| ☐ Configure fund settings | Agent suggests as first step |
| ☐ Add first deal | Agent explains process |
| ☐ Invite investors/LPs | Agent guides through invitation |
| ☐ Upload documents | Agent mentions document management |
| ☐ Invite team members | Agent explains team features |

The copilot IS the onboarding. No separate card needed.

---

## 13. Cost Tracking (Correction 5)

### 13.1 Implementation

```typescript
// src/lib/ai/cost-tracker.ts
export async function trackAICost(
  userId: string,
  fundId: string,
  // AI SDK v6: inputTokens/outputTokens (not promptTokens/completionTokens)
  usage: { inputTokens: number; outputTokens: number; totalTokens: number }
) {
  const cost = calculateCost(usage); // Based on model pricing table
  await logAudit({
    userId,
    action: 'CREATE',
    entityType: 'AIInteraction',
    entityId: fundId,
    changes: {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      costUSD: cost,
      model: process.env.AI_MODEL,
    },
  });
}
```

### 13.2 Fire-and-Forget

- Wrap in try/catch
- Never await in the response pipeline
- .catch() with Sentry logging
- Cost tracking failure must NEVER affect user experience

---

## 14. Implementation Sequence

### Sprint 1: Foundation (Days 1-5)

| Day | Tasks | Files | Gate |
|-----|-------|-------|------|
| 1 | Install AI SDK + Anthropic. Create API route shell with auth. Create ai-config.ts with model selection + feature flags. | package.json, api/chat/route.ts, ai-config.ts | `npm run build` passes. Route returns 401 without auth. |
| 2 | Prisma migration (Conversation + Message). 4 server actions for conversation CRUD. conversation-trimmer.ts (pure function). | schema.prisma, ai-conversations.ts, conversation-trimmer.ts | Migration runs clean. Actions work with test data. Trimmer passes unit tests. |
| 3 | Implement 5 read tools wrapping existing actions. Create fund-context assembly. Write system prompt (with currency, isolation, first-time greeting). | read-tools.ts, fund-context.ts, user-context.ts, system-prompt.ts | Tool schemas validate. Context assembles from seed data. System prompt < 3K tokens. |
| 4 | Cost tracker. Rate limiter extension for AI. Wire everything in API route: persistence, trimming, tools, cost tracking. | cost-tracker.ts, rate-limit.ts (extended) | Full pipeline: message → trim → tools → stream → persist → cost log. |
| 5 | Write all foundation tests: tool schemas, context assembly, trimmer, cost tracker, conversation actions. | 5 test files | All new tests pass. Existing 485 pass. |

### Sprint 2: UI + Integration (Days 6-9)

| Day | Tasks | Files | Gate |
|-----|-------|-------|------|
| 6 | Build AICopilot component with useChat. AICopilotProvider with conversation context. AIToggle button. | ai-copilot.tsx, ai-copilot-provider.tsx, ai-toggle.tsx | Panel renders. Messages stream. Toggle works. |
| 7 | AIMessage renderer (text + rich components). AIToolResult inline rendering (pipeline chart, metrics grid, deal card). Stealth Wealth styling. | ai-message.tsx, ai-tool-result.tsx | Tool results render as styled components, not raw JSON. |
| 8 | Layout integration. Conversation list UI (dropdown, last 20, filtered by fund). New conversation button. Fund-switch auto-new-conversation. Error recovery (retry, partial preserve). | layout.tsx (modified), ai-copilot.tsx (updated) | Full conversation lifecycle works. Fund switch creates new conversation. Error recovery tested. |
| 9 | First-time onboarding integration: auto-open panel, first-time greeting, welcome flow. Keyboard shortcut Cmd+K. Mobile hide below 1024px. | ai-copilot-provider.tsx (updated) | New registration → auto-open → greeting → user can interact. |

### Sprint 3: Test + Ship (Days 10-12)

| Day | Tasks | Files | Gate |
|-----|-------|-------|------|
| 10 | Write UI integration tests. Edge cases: empty fund, no deals, error states, loading states. System prompt refinement. | Test files, system-prompt.ts refinement | All tests pass. Graceful empty states. |
| 11 | End-to-end testing with seed data. Full cycle: register → onboard → copilot greeting → ask questions → get answers → switch funds → new conversation. | — | Full E2E verified. |
| 12 | Docker verification. Environment variable validation. Build + deploy test. Documentation update. | Dockerfile env, README | Docker builds clean. Prod env vars validated. Deployed and functional. |

### Gate Requirements

Each sprint gate must pass before proceeding:

| Sprint | Gate | Verification |
|--------|------|-------------|
| 1 | Foundation | `npm test` passes all 485 + ~35 new. API route streams with mock data. |
| 2 | UI | Chat panel renders. Full conversation lifecycle. Fund isolation verified. |
| 3 | Ship | E2E register → copilot → interaction works. Docker deploys. |

---

## 15. Testing Strategy

### 15.1 Targets

| Layer | What | Framework | Approach | Count |
|-------|------|-----------|----------|-------|
| Tool definitions | Zod schemas, descriptions, action mapping | Vitest | Unit: validate schemas parse expected inputs | ~10 |
| Context assembly | Prisma queries return expected shape | Vitest | Unit: mock Prisma, verify aggregation | ~5 |
| Conversation trimmer | Token budget respected | Vitest | Unit: N messages with known sizes, verify output | ~5 |
| Cost tracker | Token → USD accuracy | Vitest | Unit: pure function with known inputs | ~3 |
| Conversation CRUD | Create, list, archive, fund-scoped | Vitest | Unit: mock Prisma, verify fund filtering | ~8 |
| Rate limiter | AI-specific limits | Vitest | Unit: simulate requests | ~3 |
| System prompt | Template interpolation, currency, isolation | Vitest | Unit: verify assembly | ~3 |
| API route | Auth, fund access, streaming | Manual + E2E | Integration: full pipeline | Manual |
| UI components | Rendering, conversation flow, toggle | Manual | Visual: Stealth Wealth compliance | Manual |
| End-to-end | Register → copilot → interaction | Manual | Full cycle with seed data | Manual |

**Total new tests: ~37.** Existing 485 must continue passing.

### 15.2 What We Don't Test

LLM output quality. We test prompt construction (deterministic), not Claude's responses (non-deterministic). We test that the right tools are available, not what the agent chooses to call.

---

## 16. Risk Register

| Risk | Likelihood | Severity | Mitigation |
|------|-----------|----------|------------|
| npm install hangs for AI SDK | Low | High | AI SDK is well-maintained. Fallback: fetch-based calls (no SDK). |
| LLM hallucinations in financial content | Medium | High | Agent NEVER calculates — tools return deterministic data. System prompt forbids speculation. |
| Token costs exceed budget | Medium | Medium | Rate limiting + monthly budget ceiling + Sentry alerts at $25. |
| API key leaked in client bundle | Low | Critical | Key only in server-side route.ts. Never in client components. |
| Cross-fund data leakage | Very Low | Critical | 3-layer isolation (deterministic + prompt + UX). |
| Streaming disconnect mid-response | Medium | Medium | Retry button, partial response preserved, input never blocked. |
| Conversation DB growth | Low | Low | Cascade delete on fund/user. Archive old conversations. |
| Claude API downtime | Low | Medium | Graceful degradation: "AI temporarily unavailable. Cockpit fully functional." |
| System prompt too large | Low | Low | Currently ~2,350 tokens. Budget for growth. Monitor per-request. |
| Performance: context assembly latency | Medium | Medium | 5 parallel Prisma queries. Cache fund context for session. |

---

## 17. Scope Boundaries

### 17.1 In Scope (This Spec)

Conversational shell (panel, input, message rendering). 5 read-only tools. Conversation persistence (2 Prisma models, CRUD actions). Token management (sliding window trimmer). Fund context assembly + dynamic system prompt. Cookie-based fund resolution (no client fundId). Cross-fund isolation (3 layers). Cost tracking via AuditLog. Rate limiting (per-user, per-fund). Streaming error recovery. First-time onboarding greeting (replaces Getting Started card). Keyboard shortcut (Cmd+K). Mobile: hidden below 1024px. Stealth Wealth design compliance.

### 17.2 Phase 2 (Next Spec)

10 write tools with `needsApproval: true`. AIApprovalCard component. Write operation audit trail. LP-role tool restrictions. Mobile full-screen sheet.

### 17.3 Phase 3 (Future)

Proactive morning briefings. Anomaly detection. Document auto-classification. Deal memo generation. Quarterly narrative drafting. Network data effects.

### 17.4 Out of Scope (Never)

Expose GP conversations to LP portal. Cross-fund conversation references. Agent generating financial calculations independently. Storing PII in system prompt.

---

## 18. Appendix

### 18.1 Patterns Followed

| Pattern | Reference | Usage |
|---------|-----------|-------|
| Auth pipeline | `src/lib/auth.ts` | auth() → requireFundAccess() |
| Audit logging | `src/lib/shared/audit.ts` | logAudit() for cost tracking |
| Rate limiting | `src/lib/shared/rate-limit.ts` | Extended for AI limits |
| Fund cookie | Multi-fund plan | getActiveFundWithCurrency() |
| Currency formatting | `src/lib/shared/formatters.ts` | formatMoney(value, currency) |
| Soft deletes | Multiple models | archivedAt on Conversation |
| Fire-and-forget | `onboarding.ts` welcome email | Cost tracking, message persistence |

### 18.2 Phase 1.5 Bridge — Use Cases as Tools

After Phase 1 ships (Day 12), the highest-value AI use cases from the roadmap audit plan become additional tools:

| Use Case | Conversational Trigger | Original Est. | As Tool |
|----------|----------------------|---------------|---------|
| Document classification | Upload CIM → agent classifies | 2 days | 1 day |
| Deal memo generation | "Draft an investment thesis for TechServ" | 3 days | 2 days |
| Quarterly narrative | "Draft the Q4 LP letter" | 3 days | 2 days |
| Communication drafts | "Draft a follow-up to David Chen" | 2 days | 1 day |
| Activity digest | "Summarize this week's activity" | 2 days | 1 day |
| DD checklist | "Generate a DD checklist for this deal" | 3 days | 2 days |

The architecture is built once. Every future capability is an additional tool definition.

### 18.3 Deferred Items from Onboarding Spec v3

| Item | Original Spec | New Status |
|------|--------------|------------|
| Getting Started card (§8.2) | Deferred to next sprint | **REPLACED** by copilot first interaction |
| Funnel tracking (§9) | Deferred — needs anonymous audit API | Remains deferred. Independent workstream. |

---

*Document version 1.0 — February 2026*
*Implementation-Ready — Consolidated from Technical PRD v1.0 + Copilot Corrections v2*
*NIRO Group LLC — Strictly Confidential*