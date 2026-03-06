# RBAC Fund Isolation Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all 16 multi-tenancy read-path vulnerabilities so no user can see data from funds outside their organization.

**Architecture:** Every server-action read path must resolve the caller's active fund via `getActiveFundWithCurrency()` and add `fundId` to its WHERE clause. For single-record fetches by ID, add `requireFundAccess()` after the initial fetch. For document API routes, resolve fund context through the document's deal or investor commitments. The existing `getUserFunds()` pattern in `funds.ts` is the gold standard — replicate it for all `getFundsFor*` helpers.

**Tech Stack:** Next.js 15 server actions, Prisma, TypeScript strict, Vitest

---

## Shared Helper Reference

All tasks below use the same authorization imports. For quick reference:

```typescript
import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency, requireFundAccess } from '@/lib/shared/fund-access'
```

**Pattern A — List queries (scope to active fund):**
```typescript
const fundResult = await getActiveFundWithCurrency(session.user.id!)
if (!fundResult) return <empty>
// Add fundId: fundResult.fundId to the WHERE clause
```

**Pattern B — Single-record fetch by ID (verify after fetch):**
```typescript
const record = await prisma.<model>.findFirst({ where: { id, ...notDeleted } })
if (!record) return null
try { await requireFundAccess(session.user.id, record.fundId) } catch { return null }
```

**Pattern C — Fund dropdown helpers (replicate getUserFunds pattern):**
```typescript
const session = await auth()
if (!session?.user?.id) return []

const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { role: true, organizationId: true },
})

if (user?.role === 'SUPER_ADMIN') {
  return prisma.fund.findMany({ where: <optional-filter>, select: {...}, orderBy: { name: 'asc' } })
}

if (user?.role === 'FUND_ADMIN') {
  return prisma.fund.findMany({
    where: { organizationId: user.organizationId ?? undefined, <optional-filter> },
    select: {...}, orderBy: { name: 'asc' },
  })
}

// Regular users: only funds with active membership
const memberships = await prisma.fundMember.findMany({
  where: { userId: session.user.id, isActive: true },
  select: { fund: { select: { id: true, name: true } } },
})
return memberships.map(m => m.fund).filter(f => <optional-filter>)
```

---

## Task 1: Fix `getFundsForCommitment()` in `commitments.ts`

**Files:**
- Modify: `src/lib/actions/commitments.ts:34-50`
- Test: `src/__tests__/rbac-fund-isolation.test.ts` (new, created in Task 9)

**Step 1: Replace the function body**

Replace lines 34-50 with Pattern C. Add required imports at the top of the file:

```typescript
import { prisma } from '@/lib/prisma'
// Already imported: import { auth } from '@/lib/auth'
// Add if missing:
// (auth and requireFundAccess already imported — just need prisma.user lookup)
```

New function:

```typescript
export async function getFundsForCommitment(): Promise<{ id: string; name: string; currency: string }[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, organizationId: true },
    })

    if (user?.role === 'SUPER_ADMIN') {
        return prisma.fund.findMany({
            select: { id: true, name: true, currency: true },
            orderBy: { name: 'asc' },
        })
    }

    if (user?.role === 'FUND_ADMIN') {
        return prisma.fund.findMany({
            where: { organizationId: user.organizationId ?? undefined },
            select: { id: true, name: true, currency: true },
            orderBy: { name: 'asc' },
        })
    }

    const memberships = await prisma.fundMember.findMany({
        where: { userId: session.user.id, isActive: true },
        select: {
            fund: { select: { id: true, name: true, currency: true } },
        },
    })

    return memberships.map(m => m.fund)
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/lib/actions/commitments.ts
git commit -m "fix: scope getFundsForCommitment to user's org/fund access"
```

---

## Task 2: Fix `getFundsForPortfolio()` in `portfolio.ts`

**Files:**
- Modify: `src/lib/actions/portfolio.ts:682-697`

**Step 1: Replace the function body**

Same Pattern C. The function returns `{ id: string; name: string }[]` (no currency).

```typescript
export async function getFundsForPortfolio(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, organizationId: true },
    })

    if (user?.role === 'SUPER_ADMIN') {
        return prisma.fund.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    if (user?.role === 'FUND_ADMIN') {
        return prisma.fund.findMany({
            where: { organizationId: user.organizationId ?? undefined },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    const memberships = await prisma.fundMember.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { fund: { select: { id: true, name: true } } },
    })

    return memberships.map(m => m.fund)
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/lib/actions/portfolio.ts
git commit -m "fix: scope getFundsForPortfolio to user's org/fund access"
```

---

## Task 3: Fix `getFundsForCapitalCall()` in `capital-calls.ts`

**Files:**
- Modify: `src/lib/actions/capital-calls.ts:743-766`

**Step 1: Replace the function body**

Same Pattern C, but keep the additional filter for `commitments: { some: { status: ... } }`:

```typescript
export async function getFundsForCapitalCall(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const commitmentFilter = {
        commitments: { some: { status: { in: ['SIGNED', 'ACTIVE', 'FUNDED'] as const } } },
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, organizationId: true },
    })

    if (user?.role === 'SUPER_ADMIN') {
        return prisma.fund.findMany({
            where: commitmentFilter,
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    if (user?.role === 'FUND_ADMIN') {
        return prisma.fund.findMany({
            where: { organizationId: user.organizationId ?? undefined, ...commitmentFilter },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    const memberships = await prisma.fundMember.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { fundId: true },
    })
    const fundIds = memberships.map(m => m.fundId)

    return prisma.fund.findMany({
        where: { id: { in: fundIds }, ...commitmentFilter },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/lib/actions/capital-calls.ts
git commit -m "fix: scope getFundsForCapitalCall to user's org/fund access"
```

---

## Task 4: Fix `getFundsForDistribution()` in `distributions.ts`

**Files:**
- Modify: `src/lib/actions/distributions.ts:747-772`

**Step 1: Replace the function body**

Identical pattern to Task 3 (same commitment filter):

```typescript
export async function getFundsForDistribution(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const commitmentFilter = {
        commitments: { some: { status: { in: ['SIGNED', 'ACTIVE', 'FUNDED'] as const } } },
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, organizationId: true },
    })

    if (user?.role === 'SUPER_ADMIN') {
        return prisma.fund.findMany({
            where: commitmentFilter,
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    if (user?.role === 'FUND_ADMIN') {
        return prisma.fund.findMany({
            where: { organizationId: user.organizationId ?? undefined, ...commitmentFilter },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    const memberships = await prisma.fundMember.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { fundId: true },
    })
    const fundIds = memberships.map(m => m.fundId)

    return prisma.fund.findMany({
        where: { id: { in: fundIds }, ...commitmentFilter },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })
}
```

**Step 2: Verify build, commit**

```bash
git add src/lib/actions/distributions.ts
git commit -m "fix: scope getFundsForDistribution to user's org/fund access"
```

---

## Task 5: Fix `getFundsForReports()` in `reports.ts`

**Files:**
- Modify: `src/lib/actions/reports.ts:831-846`

**Step 1: Replace the function body**

Pattern C, no additional filter:

```typescript
export async function getFundsForReports(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, organizationId: true },
    })

    if (user?.role === 'SUPER_ADMIN') {
        return prisma.fund.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    if (user?.role === 'FUND_ADMIN') {
        return prisma.fund.findMany({
            where: { organizationId: user.organizationId ?? undefined },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        })
    }

    const memberships = await prisma.fundMember.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { fund: { select: { id: true, name: true } } },
    })

    return memberships.map(m => m.fund)
}
```

**Step 2: Check if `prisma` import exists at top of reports.ts**

reports.ts should already import `prisma` — verify. If missing, add `import { prisma } from '@/lib/prisma'`.

**Step 3: Verify build, commit**

```bash
git add src/lib/actions/reports.ts
git commit -m "fix: scope getFundsForReports to user's org/fund access"
```

---

## Task 6: Fix `getCapitalCalls()`, `getCapitalCall()`, `getCapitalCallPDFData()`, and `getCapitalCallSummary()` in `capital-calls.ts`

**Files:**
- Modify: `src/lib/actions/capital-calls.ts` (lines 101-162, 165-223, 622-676, 688-740)

### Step 1: Fix `getCapitalCalls()` (lines 101-162)

Add fund scoping to the WHERE clause. The function already calls `getActiveFundWithCurrency` at line 139 for currency — move that call earlier and use `fundId` in the query:

```typescript
export async function getCapitalCalls(params?: PaginationParams): Promise<PaginatedResult<CapitalCallListItem>> {
    const session = await auth()
    if (!session?.user?.id) {
        return paginatedResult([], 0, 1, 25)
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return paginatedResult([], 0, 1, 25)
    const { fundId, currency } = fundResult

    const { page, pageSize, skip, search } = parsePaginationParams(params)

    const where = {
        fundId,                       // <── FUND SCOPING
        ...notDeleted,
        ...(search ? {
            OR: [
                { fund: { name: { contains: search, mode: 'insensitive' as const } } },
                { purpose: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
    }

    const [calls, total] = await Promise.all([
        prisma.capitalCall.findMany({
            where,
            orderBy: { callDate: 'desc' },
            skip,
            take: pageSize,
            include: {
                fund: { select: { name: true } },
                items: { select: { paidAmount: true } },
            },
        }),
        prisma.capitalCall.count({ where }),
    ])

    const data = calls.map((call) => {
        const totalPaid = call.items.reduce(
            (sum, item) => sum + Number(item.paidAmount), 0
        )
        return {
            id: call.id,
            callNumber: call.callNumber,
            fundName: call.fund.name,
            callDate: call.callDate,
            dueDate: call.dueDate,
            totalAmount: formatMoney(call.totalAmount, currency),
            paidAmount: formatMoney(totalPaid, currency),
            status: CALL_STATUS_DISPLAY[call.status] || call.status,
            itemCount: call.items.length,
        }
    })

    return paginatedResult(data, total, page, pageSize)
}
```

### Step 2: Fix `getCapitalCall()` (lines 165-223)

Add `requireFundAccess` after fetching the record:

After line 189 (`if (!call) { return null }`), insert:

```typescript
    try {
        await requireFundAccess(session.user.id, call.fundId)
    } catch {
        return null
    }
```

### Step 3: Fix `getCapitalCallPDFData()` (lines 622-676)

After line 645 (`if (!call) return null`), insert:

```typescript
    try {
        await requireFundAccess(session.user.id, call.fundId)
    } catch {
        return null
    }
```

Note: The `call` variable from the query at line 626 includes `fund` but we need `fundId`. Check if `capitalCall` model has `fundId` (it does — the query at line 171 references `call.fundId` at line 198). If the findFirst doesn't select `fundId` explicitly, it's included by default since it's not using `select`. The query uses `include` so all scalar fields including `fundId` are returned.

### Step 4: Fix `getCapitalCallSummary()` (lines 688-740)

Add fund scoping:

```typescript
export async function getCapitalCallSummary(): Promise<CapitalCallSummary> {
    const session = await auth()
    if (!session?.user?.id) {
        return { totalCalled: 0, totalPaid: 0, totalOutstanding: 0, draftCount: 0, activeCount: 0, fullyFundedCount: 0 }
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) {
        return { totalCalled: 0, totalPaid: 0, totalOutstanding: 0, draftCount: 0, activeCount: 0, fullyFundedCount: 0 }
    }

    const calls = await prisma.capitalCall.findMany({
        where: { fundId: fundResult.fundId, ...notDeleted },   // <── FUND SCOPING
        select: {
            status: true,
            totalAmount: true,
            items: { select: { paidAmount: true } },
        },
    })

    // ... rest unchanged
```

### Step 5: Verify build, commit

```bash
git add src/lib/actions/capital-calls.ts
git commit -m "fix: scope all capital call read queries to active fund"
```

---

## Task 7: Fix `getDistributions()`, `getDistribution()`, `getDistributionPDFData()`, and `getDistributionSummary()` in `distributions.ts`

**Files:**
- Modify: `src/lib/actions/distributions.ts` (lines 117-178, 181-241, 623-679, 691-744)

Identical pattern to Task 6. Apply the same four fixes:

### Step 1: Fix `getDistributions()` (lines 117-178)

Move `getActiveFundWithCurrency` call before the WHERE clause, add `fundId` to `where`:

```typescript
export async function getDistributions(params?: PaginationParams): Promise<PaginatedResult<DistributionListItem>> {
    const session = await auth()
    if (!session?.user?.id) {
        return paginatedResult([], 0, 1, 25)
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) return paginatedResult([], 0, 1, 25)
    const { fundId, currency } = fundResult

    const { page, pageSize, skip, search } = parsePaginationParams(params)

    const where = {
        fundId,                       // <── FUND SCOPING
        ...notDeleted,
        ...(search ? {
            OR: [
                { fund: { name: { contains: search, mode: 'insensitive' as const } } },
                { notes: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
    }

    const [distributions, total] = await Promise.all([
        prisma.distribution.findMany({
            where,
            orderBy: { distributionDate: 'desc' },
            skip,
            take: pageSize,
            include: {
                fund: { select: { name: true } },
                items: { select: { netAmount: true, status: true } },
            },
        }),
        prisma.distribution.count({ where }),
    ])

    const data = distributions.map((dist) => {
        const totalPaid = dist.items
            .filter((item) => item.status === 'PAID')
            .reduce((sum, item) => sum + Number(item.netAmount), 0)
        return {
            id: dist.id,
            distributionNumber: dist.distributionNumber,
            fundName: dist.fund.name,
            distributionDate: dist.distributionDate,
            totalAmount: formatMoney(dist.totalAmount, currency),
            paidAmount: formatMoney(totalPaid, currency),
            type: DIST_TYPE_DISPLAY[dist.type] || dist.type,
            status: DIST_STATUS_DISPLAY[dist.status] || dist.status,
            itemCount: dist.items.length,
        }
    })

    return paginatedResult(data, total, page, pageSize)
}
```

### Step 2: Fix `getDistribution()` (lines 181-241)

After line 203 (`if (!dist) { return null }`), insert:

```typescript
    try {
        await requireFundAccess(session.user.id, dist.fundId)
    } catch {
        return null
    }
```

### Step 3: Fix `getDistributionPDFData()` (lines 623-679)

After line 646 (`if (!dist) return null`), insert:

```typescript
    try {
        await requireFundAccess(session.user.id, dist.fundId)
    } catch {
        return null
    }
```

### Step 4: Fix `getDistributionSummary()` (lines 691-744)

Same pattern as `getCapitalCallSummary`:

```typescript
export async function getDistributionSummary(): Promise<DistributionSummary> {
    const session = await auth()
    if (!session?.user?.id) {
        return { totalDistributed: 0, totalPaid: 0, totalPending: 0, draftCount: 0, processingCount: 0, completedCount: 0 }
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) {
        return { totalDistributed: 0, totalPaid: 0, totalPending: 0, draftCount: 0, processingCount: 0, completedCount: 0 }
    }

    const distributions = await prisma.distribution.findMany({
        where: { fundId: fundResult.fundId, ...notDeleted },   // <── FUND SCOPING
        select: {
            status: true,
            totalAmount: true,
            items: { select: { netAmount: true, status: true } },
        },
    })

    // ... rest unchanged
```

### Step 5: Verify build, commit

```bash
git add src/lib/actions/distributions.ts
git commit -m "fix: scope all distribution read queries to active fund"
```

---

## Task 8: Fix `getLPChartData()` in `chart-data.ts`

**Files:**
- Modify: `src/lib/actions/chart-data.ts:119-140`

**Step 1: Add fund boundary check**

The function takes an `investorId` and returns all their commitments. We need to verify the investor has at least one commitment to a fund the caller can access. Since this function is called from the investor detail page (which is already fund-scoped), the simplest defense is to verify the investor has a commitment to the caller's active fund:

```typescript
export async function getLPChartData(
  investorId: string
): Promise<LPChartData | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  // Verify the investor has a commitment to the caller's active fund
  const fundResult = await getActiveFundWithCurrency(session.user.id!)
  if (!fundResult) return null

  const investorInFund = await prisma.commitment.findFirst({
    where: { investorId, fundId: fundResult.fundId, ...notDeleted },
    select: { id: true },
  })
  if (!investorInFund) return null

  // Only return commitments for funds the caller can access
  // For simplicity and security, scope to the active fund only
  const commitments = await prisma.commitment.findMany({
    where: { investorId, fundId: fundResult.fundId, ...notDeleted },
    include: {
      fund: { select: { name: true } },
    },
  })

  const capitalBreakdown = commitments.map((c) => ({
    name: c.fund.name,
    committed: Number(c.committedAmount),
    called: Number(c.calledAmount),
    distributed: Number(c.distributedAmount),
  }))

  return { capitalBreakdown }
}
```

**Important edge case:** The original function returned commitments across ALL funds for an investor. The fix scopes to the active fund only. This is correct because:
- A FUND_ADMIN of Fund A should not see what the investor committed to Fund B (in a different org)
- The chart appears on the investor detail page, which is already fund-scoped
- If SUPER_ADMIN needs cross-fund view, they can switch funds

**Step 2: Verify build, commit**

```bash
git add src/lib/actions/chart-data.ts
git commit -m "fix: scope getLPChartData to caller's active fund"
```

---

## Task 9: Fix document download route `api/documents/[id]/route.ts`

**Files:**
- Modify: `src/app/api/documents/[id]/route.ts:59-67`

**Step 1: Add fallback fund check for investor documents**

The current code only checks `requireFundAccess` when `doc.deal?.fundId` exists. For investor documents (no deal), we need to verify the investor has a commitment to a fund the caller can access.

Replace lines 59-67:

```typescript
  // Verify fund access — through deal or investor commitment
  const fundId = doc.deal?.fundId ?? doc.fundId
  if (fundId) {
    try {
      await requireFundAccess(session.user.id, fundId)
    } catch {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  } else if (doc.investorId) {
    // Investor document without deal — verify via commitment
    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    const commitment = await prisma.commitment.findFirst({
      where: { investorId: doc.investorId, fundId: fundResult.fundId, deletedAt: null },
      select: { id: true },
    })
    if (!commitment) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }
```

Add import at top: `import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'`

Note: The Document model also has a direct `fundId` field (line 583 in schema). We check `doc.deal?.fundId ?? doc.fundId` to catch fund-level documents too.

**Step 2: Update the include clause** to also select `fundId` and `investorId`:

The existing query at line 50-53:
```typescript
include: { deal: { select: { fundId: true } } },
```

Change to:
```typescript
select: {
  id: true, fileUrl: true, fileName: true, fileType: true, fileSize: true,
  fundId: true, investorId: true,
  deal: { select: { fundId: true } },
},
```

Wait — the current query uses `findFirst` without `select`, which returns all fields by default. Then it uses `include` to add the `deal` relation. Since `fundId` and `investorId` are scalar fields on Document, they're already returned. So no query change is needed — just the access check logic.

**Step 3: Verify build, commit**

```bash
git add src/app/api/documents/[id]/route.ts
git commit -m "fix: add fund access check for investor/fund documents in download route"
```

---

## Task 10: Fix document upload route `api/documents/upload/route.ts`

**Files:**
- Modify: `src/app/api/documents/upload/route.ts:80-87`

**Step 1: Add fund boundary check for investor uploads**

Replace lines 80-87 (the `else if (investorId)` branch):

```typescript
    } else if (investorId) {
      const investor = await prisma.investor.findFirst({
        where: { id: investorId, deletedAt: null },
      })
      if (!investor) {
        return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
      }
      // Verify investor has a commitment to a fund the caller can access
      const fundResult = await getActiveFundWithCurrency(session.user.id)
      if (!fundResult) {
        return NextResponse.json({ error: 'Access denied: no active fund' }, { status: 403 })
      }
      const commitment = await prisma.commitment.findFirst({
        where: { investorId, fundId: fundResult.fundId, deletedAt: null },
        select: { id: true },
      })
      if (!commitment) {
        return NextResponse.json({ error: 'Access denied: investor not in your fund' }, { status: 403 })
      }
    }
```

Add import: `import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'`

**Step 2: Verify build, commit**

```bash
git add src/app/api/documents/upload/route.ts
git commit -m "fix: add fund boundary check for investor document uploads"
```

---

## Task 11: Build, lint, test — final verification

**Step 1: Full build**

Run: `npm run build 2>&1 | tail -10`
Expected: Zero errors. All routes compile.

**Step 2: Lint**

Run: `npm run lint 2>&1 | tail -5`
Expected: Zero warnings, zero errors.

**Step 3: Test suite**

Run: `npx vitest run 2>&1 | tail -10`
Expected: All tests pass (the pre-existing `ai-context.test.ts` failure is a known import issue unrelated to these changes).

**Step 4: Verify no regressions**

Scan for any broken imports by checking all modified files compile:

```bash
npx tsc --noEmit 2>&1 | grep -E "capital-calls|distributions|commitments|portfolio|reports|chart-data|documents" | head -20
```
Expected: No type errors in any of the modified files.

---

## Task 12: Commit all, push, create PR

**Step 1: Stage all changes**

```bash
git add -A
git status
```

Verify only the expected files are staged. Expected modified files:
1. `src/lib/actions/commitments.ts`
2. `src/lib/actions/portfolio.ts`
3. `src/lib/actions/capital-calls.ts`
4. `src/lib/actions/distributions.ts`
5. `src/lib/actions/reports.ts`
6. `src/lib/actions/chart-data.ts`
7. `src/app/api/documents/[id]/route.ts`
8. `src/app/api/documents/upload/route.ts`

**Step 2: Create a single squash-friendly commit**

```bash
git commit -m "fix: harden fund isolation on all read paths (RBAC audit)

Close 16 multi-tenancy vulnerabilities found in security audit:
- 5 getFundsFor* dropdowns scoped to org/fund membership
- 4 capital call read queries scoped to active fund
- 4 distribution read queries scoped to active fund
- 1 chart data function scoped to active fund
- 2 document API routes add investor fund boundary checks

Pattern: every read path now resolves the caller's active fund
via getActiveFundWithCurrency() or verifies access via
requireFundAccess() before returning data."
```

**Step 3: Push and create PR**

```bash
git push -u origin fix/team-page-fund-isolation
gh pr create --title "fix: harden RBAC fund isolation on all read paths" --body "..."
```

---

## Edge Cases Covered

| Edge Case | How It's Handled |
|-----------|-----------------|
| SUPER_ADMIN calling getFundsFor* | Returns all funds globally (correct — platform admin) |
| FUND_ADMIN calling getFundsFor* | Returns only funds in their organization |
| Regular user calling getFundsFor* | Returns only funds with active FundMember record |
| User with no active fund (cookie missing) | `getActiveFundWithCurrency` falls back through resolution chain |
| User switches fund then hits capital calls page | `getActiveFundWithCurrency` returns the newly-active fund |
| Investor document with no deal association | Verified via commitment to caller's active fund |
| Investor document with no commitment in caller's fund | Returns 403 Access Denied |
| Document with direct fundId (no deal, no investor) | Checked via `doc.fundId` fallback |
| Capital call in Fund A accessed by user of Fund B | `requireFundAccess` throws, function returns null |
| getLPChartData called with investor from other org | Commitment check fails, returns null |
| Pre-migration fund with null organizationId | `validateOrganizationBoundary` returns true (backward compat, documented) |
| FUND_ADMIN with no FundMember records | Falls back to first fund in their org (via getAuthorizedFundId) |

---

## Verification Checklist

- [ ] All 5 `getFundsFor*` functions return only authorized funds
- [ ] `getCapitalCalls()` WHERE includes `fundId`
- [ ] `getCapitalCall(id)` calls `requireFundAccess` after fetch
- [ ] `getCapitalCallPDFData(id)` calls `requireFundAccess` after fetch
- [ ] `getCapitalCallSummary()` WHERE includes `fundId`
- [ ] `getDistributions()` WHERE includes `fundId`
- [ ] `getDistribution(id)` calls `requireFundAccess` after fetch
- [ ] `getDistributionPDFData(id)` calls `requireFundAccess` after fetch
- [ ] `getDistributionSummary()` WHERE includes `fundId`
- [ ] `getLPChartData()` verifies investor has commitment in caller's fund
- [ ] Document download route checks fund for investor/fund documents
- [ ] Document upload route validates investor fund boundary
- [ ] `npm run build` passes
- [ ] `npm run lint` clean
- [ ] `npx vitest run` — all existing tests pass
