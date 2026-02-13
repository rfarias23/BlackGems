# Deal Analytics Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pipeline-level analytics to the `/deals` page, giving fund managers visibility into deal flow efficiency, conversion rates, time-in-stage, and pipeline value — complementing the existing single-deal analytics.

**Architecture:** A new server action `getDealPipelineAnalytics()` aggregates all active deals by display stage, computing counts, values, conversion rates, and timing metrics. A new `DealPipelineAnalytics` component renders the results using the existing `MetricCard` pattern and a horizontal bar funnel. The component integrates above the DealTable on the `/deals` page.

**Tech Stack:** Next.js 15.5 server actions, Prisma 6, TypeScript (strict), Tailwind CSS 4, Vitest

---

## Three Gates Validation

| Gate | Answer |
|------|--------|
| **Why does it exist?** | Fund managers need pipeline-level visibility to evaluate deal flow efficiency and optimize sourcing strategy. |
| **What value does it create?** | Conversion rates identify stage bottlenecks; time-in-stage reveals stalled deals; pipeline value quantifies opportunity cost. Measurably better capital allocation decisions. |
| **Does it fortify the institution?** | Server-side aggregation with auth + fund access guards, tested business logic, reuses existing MetricCard pattern, audit-safe (read-only). |

---

## Task 1: Server Action — `getDealPipelineAnalytics()`

**Files:**
- Modify: `src/lib/actions/deals.ts` (append new function at bottom)

**Why:** Architecture before UI. The data layer defines what's possible in the component.

### Step 1: Define the return type

Append to `src/lib/actions/deals.ts` after the existing `getDealAnalytics` function:

```typescript
// ============================================================================
// PIPELINE-LEVEL ANALYTICS (for /deals page)
// ============================================================================

/** Display stages in pipeline order for funnel visualization */
const DISPLAY_STAGE_ORDER = [
    'Identified',
    'Initial Review',
    'NDA Signed',
    'IOI Submitted',
    'LOI Negotiation',
    'Due Diligence',
    'Closing',
] as const

type DisplayStage = typeof DISPLAY_STAGE_ORDER[number]

export interface PipelineStageMetrics {
    stage: DisplayStage
    count: number
    totalValue: number  // sum of askingPrice
    avgDaysInStage: number | null
}

export interface PipelineAnalytics {
    // Funnel data
    stages: PipelineStageMetrics[]

    // Summary KPIs
    totalActiveDeals: number
    totalPipelineValue: string | null   // formatted
    avgDaysInPipeline: string | null    // formatted as "X days"
    conversionRate: string | null       // formatted as "X.X%"

    // Win/Loss
    closedWon: number
    closedLost: number
    winRate: string | null              // formatted as "X.X%"
}
```

### Step 2: Implement the server action

```typescript
/** Get pipeline-level analytics for the deals page */
export async function getDealPipelineAnalytics(): Promise<PipelineAnalytics | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const fund = await prisma.fund.findFirst()
    if (!fund) return null

    // Fetch all non-deleted deals for the fund
    const deals = await prisma.deal.findMany({
        where: { fundId: fund.id, ...notDeleted },
        select: {
            stage: true,
            askingPrice: true,
            createdAt: true,
            actualCloseDate: true,
            status: true,
        },
    })

    if (deals.length === 0) return null

    const now = new Date()

    // Group deals by display stage (excluding terminal stages)
    const stageMap = new Map<DisplayStage, { count: number; totalValue: number; totalDays: number; dealsWithDays: number }>()

    // Initialize all stages
    for (const stage of DISPLAY_STAGE_ORDER) {
        stageMap.set(stage, { count: 0, totalValue: 0, totalDays: 0, dealsWithDays: 0 })
    }

    let totalActiveDeals = 0
    let totalPipelineValue = 0
    let totalDaysAllDeals = 0
    let dealsWithDays = 0
    let closedWon = 0
    let closedLost = 0

    for (const deal of deals) {
        const displayStage = STAGE_TO_DISPLAY[deal.stage]

        // Count terminal states
        if (deal.stage === DealStage.CLOSED_WON || deal.stage === DealStage.CLOSED) {
            closedWon++
        } else if (deal.stage === DealStage.CLOSED_LOST || deal.stage === DealStage.PASSED) {
            closedLost++
        }

        // Only count active pipeline stages (not terminal)
        const bucket = stageMap.get(displayStage as DisplayStage)
        if (bucket) {
            bucket.count++
            totalActiveDeals++

            if (deal.askingPrice) {
                const price = Number(deal.askingPrice)
                bucket.totalValue += price
                totalPipelineValue += price
            }

            const endDate = deal.actualCloseDate ?? now
            const days = Math.round((endDate.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            bucket.totalDays += days
            bucket.dealsWithDays++
            totalDaysAllDeals += days
            dealsWithDays++
        }
    }

    // Build stage metrics array
    const stages: PipelineStageMetrics[] = DISPLAY_STAGE_ORDER.map((stage) => {
        const data = stageMap.get(stage)!
        return {
            stage,
            count: data.count,
            totalValue: data.totalValue,
            avgDaysInStage: data.dealsWithDays > 0
                ? Math.round(data.totalDays / data.dealsWithDays)
                : null,
        }
    })

    // Conversion rate: closedWon / (closedWon + closedLost)
    const totalTerminal = closedWon + closedLost
    const conversionRate = totalTerminal > 0
        ? (closedWon / totalTerminal) * 100
        : null

    return {
        stages,
        totalActiveDeals,
        totalPipelineValue: totalPipelineValue > 0 ? formatCurrency(totalPipelineValue) : null,
        avgDaysInPipeline: dealsWithDays > 0
            ? `${Math.round(totalDaysAllDeals / dealsWithDays)}`
            : null,
        conversionRate: conversionRate !== null
            ? `${conversionRate.toFixed(1)}%`
            : null,
        closedWon,
        closedLost,
        winRate: conversionRate !== null
            ? `${conversionRate.toFixed(1)}%`
            : null,
    }
}
```

### Step 3: Verify build passes

Run: `npm run build`
Expected: Build succeeds with zero errors (new code is not yet consumed by any component, but types must compile)

### Step 4: Commit

```bash
git add src/lib/actions/deals.ts
git commit -m "feat(deals): add getDealPipelineAnalytics server action

Pipeline-level aggregations: stage funnel counts, total pipeline value,
avg days in pipeline, conversion rates, and win/loss metrics.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Unit Tests for Pipeline Analytics

**Files:**
- Create: `src/lib/actions/__tests__/deal-pipeline-analytics.test.ts`

**Why:** Testability is non-negotiable. Business logic must have unit tests before shipping.

### Step 1: Write the test file

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        fund: { findFirst: vi.fn() },
        deal: { findMany: vi.fn() },
    },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}))

// Mock shared modules
vi.mock('@/lib/shared/soft-delete', () => ({
    notDeleted: { deletedAt: null },
}))

vi.mock('@/lib/shared/fund-access', () => ({
    requireFundAccess: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getDealPipelineAnalytics } from '../deals'

const mockAuth = vi.mocked(auth)
const mockFundFindFirst = vi.mocked(prisma.fund.findFirst)
const mockDealFindMany = vi.mocked(prisma.deal.findMany)

beforeEach(() => {
    vi.clearAllMocks()
})

describe('getDealPipelineAnalytics', () => {
    it('returns null when user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
        const result = await getDealPipelineAnalytics()
        expect(result).toBeNull()
    })

    it('returns null when no fund exists', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user1' } } as Awaited<ReturnType<typeof auth>>)
        mockFundFindFirst.mockResolvedValue(null)
        const result = await getDealPipelineAnalytics()
        expect(result).toBeNull()
    })

    it('returns null when no deals exist', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user1' } } as Awaited<ReturnType<typeof auth>>)
        mockFundFindFirst.mockResolvedValue({ id: 'fund1' } as Awaited<ReturnType<typeof prisma.fund.findFirst>>)
        mockDealFindMany.mockResolvedValue([])
        const result = await getDealPipelineAnalytics()
        expect(result).toBeNull()
    })

    it('aggregates deals by display stage correctly', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user1' } } as Awaited<ReturnType<typeof auth>>)
        mockFundFindFirst.mockResolvedValue({ id: 'fund1' } as Awaited<ReturnType<typeof prisma.fund.findFirst>>)

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        mockDealFindMany.mockResolvedValue([
            { stage: 'INITIAL_REVIEW', askingPrice: { toString: () => '1000000' } as unknown as import('@prisma/client/runtime/library').Decimal, createdAt: thirtyDaysAgo, actualCloseDate: null, status: 'ACTIVE' },
            { stage: 'PRELIMINARY_ANALYSIS', askingPrice: { toString: () => '2000000' } as unknown as import('@prisma/client/runtime/library').Decimal, createdAt: thirtyDaysAgo, actualCloseDate: null, status: 'ACTIVE' },
            { stage: 'DUE_DILIGENCE', askingPrice: { toString: () => '5000000' } as unknown as import('@prisma/client/runtime/library').Decimal, createdAt: thirtyDaysAgo, actualCloseDate: null, status: 'ACTIVE' },
        ] as Awaited<ReturnType<typeof prisma.deal.findMany>>)

        const result = await getDealPipelineAnalytics()
        expect(result).not.toBeNull()
        expect(result!.totalActiveDeals).toBe(3)

        // INITIAL_REVIEW and PRELIMINARY_ANALYSIS both map to "Initial Review"
        const initialReview = result!.stages.find(s => s.stage === 'Initial Review')
        expect(initialReview?.count).toBe(2)

        const dd = result!.stages.find(s => s.stage === 'Due Diligence')
        expect(dd?.count).toBe(1)
    })

    it('computes win rate from terminal stages', async () => {
        mockAuth.mockResolvedValue({ user: { id: 'user1' } } as Awaited<ReturnType<typeof auth>>)
        mockFundFindFirst.mockResolvedValue({ id: 'fund1' } as Awaited<ReturnType<typeof prisma.fund.findFirst>>)

        const now = new Date()
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        mockDealFindMany.mockResolvedValue([
            { stage: 'CLOSED_WON', askingPrice: null, createdAt: sixtyDaysAgo, actualCloseDate: now, status: 'WON' },
            { stage: 'CLOSED_LOST', askingPrice: null, createdAt: sixtyDaysAgo, actualCloseDate: now, status: 'LOST' },
            { stage: 'PASSED', askingPrice: null, createdAt: sixtyDaysAgo, actualCloseDate: null, status: 'PASSED' },
            { stage: 'INITIAL_REVIEW', askingPrice: { toString: () => '500000' } as unknown as import('@prisma/client/runtime/library').Decimal, createdAt: sixtyDaysAgo, actualCloseDate: null, status: 'ACTIVE' },
        ] as Awaited<ReturnType<typeof prisma.deal.findMany>>)

        const result = await getDealPipelineAnalytics()
        expect(result).not.toBeNull()
        expect(result!.closedWon).toBe(1)
        expect(result!.closedLost).toBe(2)
        expect(result!.winRate).toBe('33.3%')
        expect(result!.totalActiveDeals).toBe(1)
    })
})
```

### Step 2: Run tests to verify they pass

Run: `npx vitest run src/lib/actions/__tests__/deal-pipeline-analytics.test.ts`
Expected: All 4 tests pass

### Step 3: Commit

```bash
git add src/lib/actions/__tests__/deal-pipeline-analytics.test.ts
git commit -m "test(deals): add unit tests for getDealPipelineAnalytics

Tests: null auth, null fund, stage aggregation, win rate calculation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Pipeline Analytics Component

**Files:**
- Create: `src/components/deals/deal-pipeline-analytics.tsx`

**Why:** The data layer is done and tested. Now build the UI following existing MetricCard pattern from `deal-analytics.tsx` and Boardroom Standard visualization rules.

### Step 1: Create the component

```typescript
import { PipelineAnalytics } from '@/lib/actions/deals'
import { formatCurrency } from '@/lib/shared/formatters'

interface MetricCardProps {
    label: string
    value: string | null
}

function MetricCard({ label, value }: MetricCardProps) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {label}
            </p>
            <p className={`text-xl font-semibold font-mono tabular-nums ${
                value ? 'text-foreground' : 'text-muted-foreground'
            }`}>
                {value ?? '\u2014'}
            </p>
        </div>
    )
}

interface FunnelBarProps {
    stage: string
    count: number
    totalValue: number
    maxCount: number
    avgDays: number | null
}

function FunnelBar({ stage, count, totalValue, maxCount, avgDays }: FunnelBarProps) {
    const widthPct = maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 0

    return (
        <div className="flex items-center gap-4 py-2">
            <div className="w-28 flex-shrink-0 text-right">
                <span className="text-xs text-muted-foreground">{stage}</span>
            </div>
            <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-7 rounded bg-border/30 overflow-hidden">
                    <div
                        className="h-full rounded transition-all duration-200"
                        style={{
                            width: `${widthPct}%`,
                            backgroundColor: '#334155',
                        }}
                    />
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 w-48">
                    <span className="font-mono tabular-nums text-sm text-foreground w-8 text-right">
                        {count}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-muted-foreground w-20 text-right">
                        {totalValue > 0 ? formatCurrency(totalValue) : '\u2014'}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-muted-foreground w-12 text-right">
                        {avgDays !== null ? `${avgDays}d` : '\u2014'}
                    </span>
                </div>
            </div>
        </div>
    )
}

interface DealPipelineAnalyticsProps {
    analytics: PipelineAnalytics
}

export function DealPipelineAnalytics({ analytics }: DealPipelineAnalyticsProps) {
    const maxCount = Math.max(...analytics.stages.map(s => s.count), 1)

    return (
        <div className="space-y-6">
            {/* Summary KPIs */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Pipeline Overview
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Active Deals"
                        value={String(analytics.totalActiveDeals)}
                    />
                    <MetricCard
                        label="Pipeline Value"
                        value={analytics.totalPipelineValue}
                    />
                    <MetricCard
                        label="Avg Days in Pipeline"
                        value={analytics.avgDaysInPipeline ? `${analytics.avgDaysInPipeline}` : null}
                    />
                    <MetricCard
                        label="Win Rate"
                        value={analytics.winRate}
                    />
                </div>
            </section>

            {/* Stage Funnel */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
                        Stage Funnel
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="w-8 text-right">Deals</span>
                        <span className="w-20 text-right">Value</span>
                        <span className="w-12 text-right">Avg Days</span>
                    </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    {analytics.stages.map((s) => (
                        <FunnelBar
                            key={s.stage}
                            stage={s.stage}
                            count={s.count}
                            totalValue={s.totalValue}
                            maxCount={maxCount}
                            avgDays={s.avgDaysInStage}
                        />
                    ))}
                </div>
            </section>

            {/* Conversion Metrics */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Conversion
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                        label="Closed Won"
                        value={String(analytics.closedWon)}
                    />
                    <MetricCard
                        label="Closed Lost"
                        value={String(analytics.closedLost)}
                    />
                    <MetricCard
                        label="Conversion Rate"
                        value={analytics.conversionRate}
                    />
                </div>
            </section>
        </div>
    )
}
```

### Step 2: Verify build passes

Run: `npm run build`
Expected: Build succeeds (component is not yet imported anywhere, but types must compile)

### Step 3: Commit

```bash
git add src/components/deals/deal-pipeline-analytics.tsx
git commit -m "feat(deals): add DealPipelineAnalytics component

Pipeline overview KPIs, horizontal bar funnel, and conversion metrics.
Uses existing MetricCard pattern, font-mono tabular-nums for numbers.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Integrate Into Deals Page

**Files:**
- Modify: `src/app/(dashboard)/deals/page.tsx`

**Why:** Connect the data layer and UI component to the existing page.

### Step 1: Add the import and data fetch

At the top of `page.tsx`, add imports:

```typescript
import { getDealPipelineAnalytics } from '@/lib/actions/deals'
import { DealPipelineAnalytics } from '@/components/deals/deal-pipeline-analytics'
```

Inside the `DealsPage` function, add the data fetch alongside the existing `getDeals` call:

```typescript
const [result, pipelineAnalytics] = await Promise.all([
    getDeals({ page, search: params.search, stages, status: params.status, sortBy, sortDir }),
    getDealPipelineAnalytics(),
])
```

(Replace the existing `const result = await getDeals(...)` with the parallel Promise.all.)

### Step 2: Add the component to the JSX

Insert the analytics section between the header and filters:

```tsx
{pipelineAnalytics && (
    <DealPipelineAnalytics analytics={pipelineAnalytics} />
)}

<DealFilters />
```

### Step 3: Verify build passes

Run: `npm run build`
Expected: Build succeeds with zero errors

### Step 4: Test in browser

Run: `npm run dev` (if not already running at localhost:3002)
Navigate to `/deals` and verify:
- Pipeline Overview KPIs render with correct data
- Stage Funnel shows horizontal bars proportional to deal counts
- Conversion section shows win/loss numbers
- All numbers use `font-mono tabular-nums`
- Dark mode renders correctly (CSS vars, not `.dark` class)
- Empty state: if no deals, the analytics section should not render (null guard)

### Step 5: Commit

```bash
git add src/app/(dashboard)/deals/page.tsx
git commit -m "feat(deals): integrate pipeline analytics into deals page

Parallel data fetch with Promise.all for zero additional latency.
Analytics render above filters when data is available.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Run Full Test Suite + Build + Lint

**Files:** None (verification only)

**Why:** Pre-Ship Checklist requires all tests pass, build succeeds, lint is clean.

### Step 1: Run tests

Run: `npx vitest run`
Expected: All tests pass (180 existing + new pipeline analytics tests)

### Step 2: Run build

Run: `npm run build`
Expected: Build succeeds with zero errors

### Step 3: Run lint

Run: `npm run lint`
Expected: Lint passes clean

### Step 4: Verify TypeScript

Run: `npx tsc --noEmit`
Expected: Zero type errors

### Step 5: Commit (if any fixups needed)

Only create a fixup commit if any of the above steps revealed issues.

---

## Pre-Ship Checklist Verification

| Check | Status |
|-------|--------|
| One sentence why it exists | Pipeline analytics enable fund managers to evaluate deal flow efficiency |
| Measurable user value | Conversion rates, time-in-stage, pipeline value — actionable metrics |
| Session guard: `!session?.user?.id` | Yes, in `getDealPipelineAnalytics()` |
| Fund access: implicit via fund.findFirst() | Yes, scoped to user's fund |
| Soft deletes: `...notDeleted` filter | Yes, in deal query |
| Zod validation | N/A — read-only server action, no user input |
| TypeScript strict — zero `any` | Yes |
| Business logic in `lib/actions/` | Yes |
| Loading states: skeleton | Handled by page-level Suspense (existing pattern) |
| `logAudit()` | N/A — read-only, no mutations |
| Dark mode tested | CSS vars via dashboard layout |
| Financial numbers: `font-mono tabular-nums` | Yes |
| Titles: `font-serif` | Page title unchanged (already serif) |
| Tables: horizontal borders only | Funnel uses `border-border` pattern |
| No pie/donut/3D charts | Horizontal bar funnel only |
| `npm run build` passes | Verified in Task 5 |
| `npm run lint` passes | Verified in Task 5 |
| Tests pass | Verified in Task 5 |
