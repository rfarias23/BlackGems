# Fix Fund Resolution Cookie Crash — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.
>
> **Classification:** P0 BLOCKER — Every RSC page that queries fund-scoped data returns empty results.

**Goal:** Make `getAuthorizedFundId()` return the correct fund ID even when called from Server Component render context, where Next.js 15 forbids cookie writes.

**Architecture:** Extract cookie writes from the resolution function into a best-effort helper that silently skips in RSC context. No caller changes needed.

**Tech Stack:** Next.js 15 (App Router), TypeScript, `next/headers` cookies API

---

## Root Cause

`getAuthorizedFundId()` in `src/lib/shared/fund-access.ts` calls `setActiveFundId()` (cookie write) at 4 points in its resolution chain (lines 145, 170, 181, 194). Next.js 15 throws `"Cookies can only be modified in a Server Action or Route Handler"` when this runs during RSC render. The outer `catch` block (line 200) swallows the error and returns `null` — so **no fund is ever resolved** and all queries return empty results.

**Crash sites (7 RSC pages):**
- `src/app/(dashboard)/deals/[id]/page.tsx:72`
- `src/app/(dashboard)/investors/[id]/page.tsx:51`
- `src/app/(dashboard)/portfolio/[id]/page.tsx:66`
- `src/app/(dashboard)/capital/page.tsx:27`
- `src/app/(dashboard)/capital/calls/[id]/page.tsx:86`
- `src/app/(dashboard)/capital/distributions/[id]/page.tsx:97`
- Any page calling `getDeals()`, `getInvestors()`, etc. during render (these Server Actions call `getActiveFundWithCurrency()` internally)

**Safe callers (unaffected):**
- All `src/lib/actions/*.ts` files — Server Actions can write cookies
- All `src/app/api/*/route.ts` files — Route Handlers can write cookies

---

## The Fix

Create a private `trySaveActiveFundId()` helper in `fund-access.ts` that wraps `setActiveFundId()` with a try/catch. Replace all 4 calls inside `getAuthorizedFundId()`.

**Why this approach:**
- Single file change, 1 new helper + 4 line replacements
- Does NOT change `setActiveFundId()` itself (other callers keep strict behavior)
- Does NOT require changes to any RSC page or Server Action
- Fund ID is still resolved correctly; cookie is written when context allows, silently skipped when not

---

## Task 1: Add `trySaveActiveFundId` helper and replace calls

**File:** `src/lib/shared/fund-access.ts`

**Step 1: Add the helper function** (after the existing `getFundSlugFromHeaders()` function, around line 45)

```typescript
/**
 * Best-effort cookie persistence for the active fund.
 * In Server Actions / Route Handlers the cookie is written normally.
 * In RSC render context (where cookie writes are forbidden by Next.js 15),
 * the write is silently skipped — the fund ID is still returned to the caller.
 * The cookie will be set on the user's next Server Action invocation.
 */
async function trySaveActiveFundId(fundId: string): Promise<void> {
  try {
    await setActiveFundId(fundId)
  } catch {
    // Expected in RSC render context — safe to ignore.
  }
}
```

**Step 2: Replace all 4 `setActiveFundId` calls inside `getAuthorizedFundId`**

| Line | Before | After |
|------|--------|-------|
| 145 | `await setActiveFundId(fund.id)` | `await trySaveActiveFundId(fund.id)` |
| 170 | `await setActiveFundId(membership.fundId)` | `await trySaveActiveFundId(membership.fundId)` |
| 181 | `await setActiveFundId(fund.id)` | `await trySaveActiveFundId(fund.id)` |
| 194 | `await setActiveFundId(fund.id)` | `await trySaveActiveFundId(fund.id)` |

**Step 3: Verify no other callers of `setActiveFundId` exist inside this file**

```bash
grep -n "setActiveFundId" src/lib/shared/fund-access.ts
```

Expected: Only the import (line 3) and the 4 replaced calls. The helper calls through to `setActiveFundId` internally.

---

## Task 2: Build, Lint, Test

```bash
npm run build         # Zero errors
npm run lint          # Clean
npx vitest run        # All existing tests pass
```

The change is purely defensive — behavior is identical when called from Server Actions (cookie is written). When called from RSC, the only difference is the function returns a valid fund ID instead of `null`.

---

## Task 3: Commit, Push, PR, Merge

**Modified files:**
1. `src/lib/shared/fund-access.ts` — `trySaveActiveFundId` helper + 4 call replacements

**Commit message:**

```
fix(fund-access): prevent cookie write from crashing fund resolution in RSC

getAuthorizedFundId() called setActiveFundId() which throws in
Server Component render context (Next.js 15 restriction). The outer
catch returned null, making all fund-scoped queries return empty.

Add trySaveActiveFundId() best-effort wrapper: writes cookie in
Server Actions, silently skips in RSC. Fund ID resolves correctly
in both contexts.

Fixes: deals, investors, portfolio, capital pages showing no data.
```

---

## Post-Deploy Verification

1. Log in as `test@testfund.com`
2. Verify deals page shows 6 deals
3. Click into a deal detail page — should render with correct currency
4. Navigate to Capital, Investors, Portfolio — all should show data (or correct empty states)
5. Check server logs: `getAuthorizedFundId failed:` messages should stop appearing
