# Multi-Fund & Multicurrency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable BlackGem to support multiple funds per user, each with its own base currency (USD, EUR, GBP), with a sidebar switcher and cookie-based active fund persistence.

**Architecture:** Foundation First — currency-aware formatters and active fund resolution are built before any UI. Every server action that formats monetary values receives the fund's currency. Cookie-based fund persistence replaces the current `prisma.fund.findFirst()` pattern.

**Tech Stack:** Next.js 15 App Router, Prisma 6, TypeScript strict, httpOnly cookies, Radix Popover, Vitest

**Design Doc:** `docs/plans/2026-02-16-multi-fund-multicurrency-design.md`

---

## Phase 1: Currency Infrastructure

### Task 1: Prisma Schema — Currency Enum

**Files:**
- Modify: `prisma/schema.prisma:89-125`

**Step 1: Add Currency enum and update Fund model**

In `prisma/schema.prisma`, add the `Currency` enum after the existing `FundStatus` enum (around line 82), and change the `currency` field on the `Fund` model from `String` to `Currency`:

```prisma
enum Currency {
  USD
  EUR
  GBP
}
```

Change line 102 from:
```prisma
  currency          String     @default("USD")
```
to:
```prisma
  currency          Currency   @default(USD)
```

**Step 2: Regenerate Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" success message

**Step 3: Update seed file**

In `prisma/seed.ts`, change line 61 from:
```typescript
currency: 'USD',
```
to:
```typescript
currency: Currency.USD,
```

Add `Currency` to the import from `@prisma/client` at the top of the file.

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds (Currency is backwards-compatible in existing code since the string `'USD'` matches the enum value)

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: add Currency enum to Prisma schema

Replace Fund.currency String field with Currency enum (USD, EUR, GBP).
Update seed to use Currency.USD enum value.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Currency-Aware Formatters + Tests

**Files:**
- Modify: `src/lib/shared/formatters.ts`
- Create: `src/__tests__/formatters.test.ts`

**Step 1: Write the failing tests**

Create `src/__tests__/formatters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatMoney,
  formatCompact,
  parseMoney,
} from '@/lib/shared/formatters'

describe('formatCurrency', () => {
  it('returns null for falsy values', () => {
    expect(formatCurrency(null)).toBeNull()
    expect(formatCurrency(undefined)).toBeNull()
    expect(formatCurrency(0)).toBeNull()
  })

  it('formats USD by default', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })

  it('formats EUR with euro symbol', () => {
    expect(formatCurrency(1234567, 'EUR')).toBe('€1.234.567')
  })

  it('formats GBP with pound symbol', () => {
    expect(formatCurrency(1234567, 'GBP')).toBe('£1,234,567')
  })

  it('handles string input', () => {
    expect(formatCurrency('50000', 'EUR')).toBe('€50.000')
  })
})

describe('formatMoney', () => {
  it('returns currency zero for falsy values', () => {
    expect(formatMoney(null)).toBe('$0')
    expect(formatMoney(null, 'EUR')).toBe('€0')
    expect(formatMoney(null, 'GBP')).toBe('£0')
  })

  it('formats with correct currency symbol', () => {
    expect(formatMoney(1000)).toBe('$1,000')
    expect(formatMoney(1000, 'EUR')).toBe('€1.000')
    expect(formatMoney(1000, 'GBP')).toBe('£1,000')
  })
})

describe('formatCompact', () => {
  it('abbreviates millions', () => {
    expect(formatCompact(5000000)).toBe('$5.0M')
    expect(formatCompact(5000000, 'EUR')).toBe('€5.0M')
    expect(formatCompact(5000000, 'GBP')).toBe('£5.0M')
  })

  it('abbreviates thousands', () => {
    expect(formatCompact(250000)).toBe('$250K')
    expect(formatCompact(250000, 'EUR')).toBe('€250K')
  })

  it('formats small numbers without abbreviation', () => {
    expect(formatCompact(500)).toBe('$500')
    expect(formatCompact(500, 'GBP')).toBe('£500')
  })

  it('handles zero and null', () => {
    expect(formatCompact(0)).toBe('$0')
    expect(formatCompact(null, 'EUR')).toBe('€0')
  })
})

describe('parseMoney', () => {
  it('parses USD strings', () => {
    expect(parseMoney('$1,234,567')).toBe(1234567)
  })

  it('parses EUR strings', () => {
    expect(parseMoney('€1.234.567')).toBe(1234567)
  })

  it('parses GBP strings', () => {
    expect(parseMoney('£1,234,567')).toBe(1234567)
  })

  it('handles empty string', () => {
    expect(parseMoney('')).toBe(0)
  })

  it('handles plain numbers', () => {
    expect(parseMoney('50000')).toBe(50000)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/formatters.test.ts`
Expected: FAIL — `formatCompact` is not exported, `formatCurrency` doesn't accept second arg

**Step 3: Implement currency-aware formatters**

Replace `src/lib/shared/formatters.ts` entirely:

```typescript
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * Shared formatters for currency, percentages, and multiples.
 * Used across all server actions and components.
 *
 * Accepts Prisma Decimal, number, string, null, or undefined.
 */

type NumericValue = Decimal | number | string | null | undefined

/**
 * Supported fund currencies. Each fund operates in exactly one currency.
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP'

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '\u20ac', locale: 'de-DE' },
  GBP: { symbol: '\u00a3', locale: 'en-GB' },
}

/**
 * Formats a numeric value as a currency string.
 * Returns null if value is falsy.
 */
export function formatCurrency(value: NumericValue, currency: CurrencyCode = 'USD'): string | null {
  if (!value) return null
  const { symbol, locale } = CURRENCY_CONFIG[currency]
  return `${symbol}${Number(value).toLocaleString(locale)}`
}

/**
 * Formats a numeric value as a currency string, defaulting to symbol + '0'.
 */
export function formatMoney(value: NumericValue, currency: CurrencyCode = 'USD'): string {
  if (!value) return `${CURRENCY_CONFIG[currency].symbol}0`
  const { symbol, locale } = CURRENCY_CONFIG[currency]
  return `${symbol}${Number(value).toLocaleString(locale)}`
}

/**
 * Formats a numeric value with M/K abbreviations for chart axes and compact displays.
 */
export function formatCompact(value: NumericValue, currency: CurrencyCode = 'USD'): string {
  const { symbol } = CURRENCY_CONFIG[currency]
  const num = Number(value) || 0
  if (num >= 1_000_000) return `${symbol}${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${symbol}${(num / 1_000).toFixed(0)}K`
  return `${symbol}${num.toFixed(0)}`
}

/**
 * Returns the raw numeric string representation of a Decimal.
 */
export function formatDecimalRaw(value: NumericValue): string | null {
  if (!value) return null
  return Number(value).toString()
}

/**
 * Formats a decimal ratio (0.351) as a percentage string ("35.1%").
 * Returns null if value is falsy.
 */
export function formatPercentage(value: NumericValue): string | null {
  if (!value) return null
  return `${(Number(value) * 100).toFixed(1)}%`
}

/**
 * Formats a decimal ratio as a percentage, defaulting to '0%'.
 */
export function formatPercent(value: NumericValue): string {
  if (!value) return '0%'
  return `${(Number(value) * 100).toFixed(1)}%`
}

/**
 * Formats a numeric value as a multiple (e.g., "2.50x").
 */
export function formatMultiple(value: NumericValue): string {
  if (!value) return '-'
  return `${Number(value).toFixed(2)}x`
}

/**
 * Parses a currency string ("$1,234,567" or "\u20ac1.234.567" or "\u00a31,234,567") into a number.
 */
export function parseMoney(value: string): number {
  if (!value) return 0
  return parseFloat(value.replace(/[$\u20ac\u00a3.,]/g, '')) || 0
}

/**
 * Parses a percentage string ("85%" or "0.85") into a decimal.
 * Values > 1 are treated as whole-number percentages (e.g., 85 -> 0.85).
 */
export function parsePercent(value: string): number {
  if (!value) return 0
  const num = parseFloat(value.replace(/%/g, ''))
  return num > 1 ? num / 100 : num
}
```

**Step 4: Run formatter tests**

Run: `npx vitest run src/__tests__/formatters.test.ts`
Expected: ALL PASS

Note: The `parseMoney` function now strips dots as well (used as thousands separator in EUR locale). The tests for EUR parsing like `'€1.234.567'` should parse correctly. If there are edge cases with decimal dots (e.g., `'€1.234,56'`), these won't occur in BlackGem because we format without decimals in the UI.

**Step 5: Run ALL tests to verify backwards compatibility**

Run: `npx vitest run`
Expected: All 288 tests pass (existing tests call `formatCurrency(value)` without currency param — defaults to USD)

**Step 6: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 7: Commit**

```bash
git add src/lib/shared/formatters.ts src/__tests__/formatters.test.ts
git commit -m "feat: currency-aware formatters with USD/EUR/GBP support

Add CurrencyCode type, CURRENCY_CONFIG map, formatCompact() for charts.
All functions backwards-compatible with default 'USD'.
parseMoney strips $, €, £ symbols.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Active Fund Cookie Utility

**Files:**
- Create: `src/lib/shared/active-fund.ts`

**Step 1: Create the active fund cookie utility**

Create `src/lib/shared/active-fund.ts`:

```typescript
import { cookies } from 'next/headers'

const ACTIVE_FUND_COOKIE = 'blackgem-active-fund'

/**
 * Reads the active fund ID from the httpOnly cookie.
 * Returns null if no cookie is set.
 */
export async function getActiveFundId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_FUND_COOKIE)?.value ?? null
}

/**
 * Sets the active fund ID in an httpOnly cookie.
 * Persists for 1 year. Secure in production.
 */
export async function setActiveFundId(fundId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_FUND_COOKIE, fundId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}

/**
 * Clears the active fund cookie.
 */
export async function clearActiveFundId(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_FUND_COOKIE)
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero errors (the file is not imported yet, so no impact)

**Step 3: Commit**

```bash
git add src/lib/shared/active-fund.ts
git commit -m "feat: active fund cookie persistence utility

httpOnly cookie for storing active fund ID.
Secure in production, 1-year maxAge, sameSite: lax.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Rewrite Fund Access — Cookie-Based Resolution

**Files:**
- Modify: `src/lib/shared/fund-access.ts`

**Step 1: Rewrite getAuthorizedFundId and add getActiveFundWithCurrency**

Replace `src/lib/shared/fund-access.ts` with:

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveFundId, setActiveFundId } from '@/lib/shared/active-fund'
import type { CurrencyCode } from '@/lib/shared/formatters'

/**
 * Verifies the current user is authenticated and returns session info.
 * Throws an error if not authenticated.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Returns true if the user role is SUPER_ADMIN or FUND_ADMIN.
 */
async function isAdminRole(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FUND_ADMIN'
}

/**
 * Verifies the current user has access to the specified fund.
 * Checks that the user is either a SUPER_ADMIN/FUND_ADMIN or has an active
 * FundMember record for the given fund.
 */
export async function requireFundAccess(userId: string, fundId: string) {
  if (await isAdminRole(userId)) {
    return true
  }

  const membership = await prisma.fundMember.findUnique({
    where: {
      fundId_userId: { fundId, userId },
    },
    select: { isActive: true },
  })

  if (!membership?.isActive) {
    throw new Error('Access denied: you do not have access to this fund')
  }

  return true
}

/**
 * Returns the active fund ID for the current user.
 *
 * Resolution order:
 * 1. Cookie value (if user still has access)
 * 2. First fund the user has membership in
 * 3. First fund in DB (for admins with no memberships)
 * 4. Throws if no fund exists
 */
export async function getAuthorizedFundId(userId: string): Promise<string> {
  // 1. Try cookie
  const cookieFundId = await getActiveFundId()

  if (cookieFundId) {
    // Validate user still has access to this fund
    const isAdmin = await isAdminRole(userId)

    if (isAdmin) {
      // Verify fund exists
      const fundExists = await prisma.fund.findUnique({
        where: { id: cookieFundId },
        select: { id: true },
      })
      if (fundExists) return cookieFundId
    } else {
      const membership = await prisma.fundMember.findUnique({
        where: { fundId_userId: { fundId: cookieFundId, userId } },
        select: { isActive: true },
      })
      if (membership?.isActive) return cookieFundId
    }
  }

  // 2. Fallback: first fund user has membership in
  const membership = await prisma.fundMember.findFirst({
    where: { userId, isActive: true },
    select: { fundId: true },
    orderBy: { createdAt: 'asc' },
  })

  if (membership) {
    await setActiveFundId(membership.fundId)
    return membership.fundId
  }

  // 3. Fallback for admins with no memberships: first fund in DB
  if (await isAdminRole(userId)) {
    const fund = await prisma.fund.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })
    if (fund) {
      await setActiveFundId(fund.id)
      return fund.id
    }
  }

  throw new Error('No fund found. Please create a fund first.')
}

/**
 * Returns the active fund ID and its currency in a single call.
 * Avoids double-querying in server actions that need both.
 */
export async function getActiveFundWithCurrency(userId: string): Promise<{
  fundId: string
  currency: CurrencyCode
}> {
  const fundId = await getAuthorizedFundId(userId)
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    select: { currency: true },
  })
  return { fundId, currency: (fund?.currency ?? 'USD') as CurrencyCode }
}
```

**Step 2: Run ALL tests**

Run: `npx vitest run`
Expected: All 288 tests pass (function signatures are backwards-compatible)

**Step 3: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 4: Commit**

```bash
git add src/lib/shared/fund-access.ts
git commit -m "feat: cookie-based active fund resolution

Replace prisma.fund.findFirst() with cookie → membership → admin fallback.
Add getActiveFundWithCurrency() helper for server actions.
Backwards-compatible with single-fund deployments.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 2: Server Action Currency Propagation

### Task 5: Fund Server Actions (New File)

**Files:**
- Create: `src/lib/actions/funds.ts`

**Step 1: Create funds server action file**

Create `src/lib/actions/funds.ts`:

```typescript
'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { setActiveFundId } from '@/lib/shared/active-fund'
import { logAudit } from '@/lib/shared/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { CurrencyCode } from '@/lib/shared/formatters'

// ============================================================================
// TYPES
// ============================================================================

export interface FundSummary {
  id: string
  name: string
  currency: string
  status: string
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createFundSchema = z.object({
  name: z.string().min(1, 'Fund name is required').max(200),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  type: z.enum([
    'TRADITIONAL_SEARCH_FUND',
    'SELF_FUNDED_SEARCH',
    'ACCELERATOR_FUND',
    'ACQUISITION_FUND',
    'PE_FUND',
    'HOLDING_COMPANY',
  ]),
  targetSize: z.string().min(1, 'Target size is required'),
  vintage: z.string().optional(),
})

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Returns all funds the user has access to.
 * SUPER_ADMIN and FUND_ADMIN see all funds.
 * Other users see only funds with active FundMember records.
 */
export async function getUserFunds(userId: string): Promise<FundSummary[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'SUPER_ADMIN' || user?.role === 'FUND_ADMIN') {
    return prisma.fund.findMany({
      select: { id: true, name: true, currency: true, status: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  const memberships = await prisma.fundMember.findMany({
    where: { userId, isActive: true },
    select: {
      fund: {
        select: { id: true, name: true, currency: true, status: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return memberships.map((m) => m.fund)
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Switches the user's active fund.
 * Validates the user has access to the target fund.
 */
export async function switchActiveFund(
  fundId: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    await requireFundAccess(session.user.id, fundId)
  } catch {
    return { error: 'Access denied' }
  }

  await setActiveFundId(fundId)
  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Creates a new fund with the current user as PRINCIPAL.
 * Only FUND_ADMIN and SUPER_ADMIN can create funds.
 */
export async function createFund(
  formData: FormData
): Promise<{ error?: string; success?: boolean; fundId?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  // Role check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'FUND_ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return { error: 'Only fund administrators can create funds' }
  }

  const raw = {
    name: formData.get('name') as string,
    currency: formData.get('currency') as string,
    type: formData.get('type') as string,
    targetSize: formData.get('targetSize') as string,
    vintage: formData.get('vintage') as string | null,
  }

  const parsed = createFundSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { name, currency, type, targetSize, vintage } = parsed.data

  try {
    // Parse target size (strip currency symbols)
    const targetSizeNum = parseFloat(targetSize.replace(/[$€£,]/g, ''))
    if (isNaN(targetSizeNum) || targetSizeNum <= 0) {
      return { error: 'Target size must be a positive number' }
    }

    // Create fund + membership in a transaction
    const fund = await prisma.$transaction(async (tx) => {
      const newFund = await tx.fund.create({
        data: {
          name,
          currency: currency as CurrencyCode,
          type: type as import('@prisma/client').FundType,
          status: 'RAISING',
          targetSize: targetSizeNum,
          vintage: vintage ? parseInt(vintage, 10) : new Date().getFullYear(),
          managementFee: 0.02,
          carriedInterest: 0.20,
        },
      })

      await tx.fundMember.create({
        data: {
          fundId: newFund.id,
          userId: session.user.id!,
          role: 'PRINCIPAL',
          isActive: true,
        },
      })

      return newFund
    })

    // Auto-switch to new fund
    await setActiveFundId(fund.id)

    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Fund',
      entityId: fund.id,
      changes: {
        name: { old: null, new: name },
        currency: { old: null, new: currency },
        type: { old: null, new: type },
        targetSize: { old: null, new: targetSizeNum },
      },
    })

    revalidatePath('/', 'layout')
    return { success: true, fundId: fund.id }
  } catch (error) {
    console.error('Failed to create fund:', error)
    return { error: 'Failed to create fund' }
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 3: Commit**

```bash
git add src/lib/actions/funds.ts
git commit -m "feat: fund server actions — getUserFunds, switchActiveFund, createFund

New funds.ts with full auth, access checks, Zod validation, audit logging.
createFund creates Fund + FundMember in transaction, auto-switches.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Propagate Currency to Server Actions (8 files)

**Files:**
- Modify: `src/lib/actions/deals.ts`
- Modify: `src/lib/actions/investors.ts`
- Modify: `src/lib/actions/capital-calls.ts`
- Modify: `src/lib/actions/distributions.ts`
- Modify: `src/lib/actions/portfolio.ts`
- Modify: `src/lib/actions/portfolio-monitoring.ts`
- Modify: `src/lib/actions/reports.ts`
- Modify: `src/lib/actions/chart-data.ts`
- Modify: `src/lib/actions/settings.ts`
- Modify: `src/lib/actions/quarterly-updates.ts`

This is the largest task — mechanical but wide. The pattern is identical across all files:

**The Pattern (apply to each file):**

1. Add import: `import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'`
2. Add import (if not already): `import type { CurrencyCode } from '@/lib/shared/formatters'`
3. Find every `prisma.fund.findFirst()` call and replace with `getActiveFundWithCurrency(session.user.id!)`
4. Find every `formatMoney(value)` and replace with `formatMoney(value, currency)`
5. Find every `formatCurrency(value)` and replace with `formatCurrency(value, currency)`
6. Find every inline `` `$${...toLocaleString()}` `` and replace with `formatMoney(value, currency)`

**Step 1: Apply the pattern to all 10 files**

For each file, the change follows this structure:

```typescript
// BEFORE (example from deals.ts)
const fund = await prisma.fund.findFirst()
if (!fund) return null
// ... later ...
askingPrice: formatCurrency(deal.askingPrice)

// AFTER
const { fundId, currency } = await getActiveFundWithCurrency(session.user.id!)
// ... later ...
askingPrice: formatCurrency(deal.askingPrice, currency)
```

**Critical hotspots (inline $ that are NOT using the central formatter):**

- `src/lib/actions/capital-calls.ts` line ~317: `` `$${parseMoney(data.totalAmount).toLocaleString()}` `` → `formatMoney(parseMoney(data.totalAmount), currency)`
- `src/lib/actions/distributions.ts` line ~342: same pattern → `formatMoney(parseMoney(data.totalAmount), currency)`

**Step 2: Run ALL tests**

Run: `npx vitest run`
Expected: All 288 tests pass

**Step 3: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 4: Run lint**

Run: `npm run lint`
Expected: Zero errors

**Step 5: Commit**

```bash
git add src/lib/actions/
git commit -m "feat: propagate fund currency to all server actions

Replace prisma.fund.findFirst() with getActiveFundWithCurrency().
Pass currency to formatMoney/formatCurrency in 10 action files.
Eliminate 2 inline hardcoded $ formatting instances.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Eliminate Chart & Portal Currency Duplicates

**Files:**
- Modify: `src/components/charts/waterfall-chart.tsx`
- Modify: `src/components/charts/capital-account-chart.tsx`
- Modify: `src/components/charts/capital-deployment-chart.tsx`
- Modify: `src/components/charts/sector-allocation-chart.tsx`
- Modify: `src/app/(portal)/portal/page.tsx`
- Modify: `src/app/(portal)/portal/capital/page.tsx`

**Step 1: Update chart components**

For each of the 4 chart components, the change is identical:

1. Delete the local `formatCurrency()` function (lines 35-39 in each)
2. Add import: `import { formatCompact, type CurrencyCode } from '@/lib/shared/formatters'`
3. Add `currency?: CurrencyCode` to the component's props interface
4. Replace all calls to local `formatCurrency(value)` with `formatCompact(value, currency)`

Example for `waterfall-chart.tsx`:

```typescript
// BEFORE
function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[]
  theme?: ChartTheme
  height?: number
}

// AFTER
import { formatCompact, type CurrencyCode } from '@/lib/shared/formatters'

interface WaterfallChartProps {
  data: WaterfallDataPoint[]
  theme?: ChartTheme
  height?: number
  currency?: CurrencyCode
}

// Usage: formatCompact(value, currency) instead of formatCurrency(value)
```

**Step 2: Update portal pages**

For both portal pages, delete the local `formatCurrency()` function that uses `Intl.NumberFormat` and import `formatMoney` from the central formatters instead. The portal pages will need to receive currency from the server action that loads their data.

**Step 3: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 4: Commit**

```bash
git add src/components/charts/ src/app/\(portal\)/
git commit -m "refactor: eliminate 6 duplicate currency formatters

Replace 4 chart-local formatCurrency() with shared formatCompact().
Replace 2 portal-local Intl.NumberFormat() with shared formatMoney().
All currency display now flows through src/lib/shared/formatters.ts.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Eliminate Dashboard/Component Inline $ Formatting

**Files:**
- Modify: `src/app/(dashboard)/capital/page.tsx`
- Modify: `src/app/(dashboard)/capital/calls/[id]/page.tsx`
- Modify: `src/app/(dashboard)/capital/distributions/[id]/page.tsx`
- Modify: `src/app/(dashboard)/investors/[id]/page.tsx`
- Modify: `src/components/capital/record-payment-button.tsx`
- Modify: `src/components/deals/convert-deal-dialog.tsx`
- Modify: `src/components/portfolio/portfolio-valuation-history.tsx`

**Step 1: Apply changes**

For each file:
1. Import `formatMoney` (and `formatCompact` where M/K abbreviations are used) from `@/lib/shared/formatters`
2. Import `type CurrencyCode` from `@/lib/shared/formatters`
3. Delete any local `formatCompact()` function
4. Replace all `` `$${value.toLocaleString()}` `` with `formatMoney(value, currency)`
5. For components that receive data as props, add `currency?: CurrencyCode` to their props interface

The currency value flows from:
- Server components (pages): resolved via `getActiveFundWithCurrency()` in the page's data-loading function
- Client components (buttons, dialogs): received as a prop from the parent page

**Step 2: Run ALL tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/ src/components/capital/ src/components/deals/ src/components/portfolio/
git commit -m "refactor: replace 14 inline hardcoded $ with shared formatters

All monetary display now uses formatMoney(value, currency) or
formatCompact(value, currency) from shared/formatters.ts.
Zero hardcoded $ symbols remain in the codebase.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 3: Fund Switcher UI

### Task 9: Fund Switcher Component

**Files:**
- Create: `src/components/layout/fund-switcher.tsx`

**Step 1: Create the fund switcher component**

Create `src/components/layout/fund-switcher.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { switchActiveFund } from '@/lib/actions/funds'
import { ChevronsUpDown, Plus, Check } from 'lucide-react'
import type { FundSummary } from '@/lib/actions/funds'

interface FundSwitcherProps {
  funds: FundSummary[]
  activeFundId: string
  userRole?: string
}

const CURRENCY_BADGE: Record<string, string> = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
}

export function FundSwitcher({ funds, activeFundId, userRole }: FundSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'FUND_ADMIN'

  const activeFund = funds.find((f) => f.id === activeFundId)
  const hasMultipleFunds = funds.length > 1 || isAdmin

  const handleSwitch = (fundId: string) => {
    if (fundId === activeFundId) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      await switchActiveFund(fundId)
      setOpen(false)
    })
  }

  return (
    <div className="px-3 py-3 border-b border-[#334155]">
      <button
        type="button"
        onClick={() => hasMultipleFunds && setOpen(!open)}
        disabled={isPending}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
          hasMultipleFunds
            ? 'hover:bg-[#334155] cursor-pointer'
            : 'cursor-default'
        } ${isPending ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2 w-2 rounded-full bg-[#3E5CFF] flex-shrink-0" />
          <span className="text-sm font-medium text-[#F8FAFC] truncate">
            {activeFund?.name ?? 'No Fund'}
          </span>
          {activeFund && (
            <span className="text-[10px] font-mono text-[#94A3B8] border border-[#334155] rounded px-1 py-0.5 flex-shrink-0">
              {CURRENCY_BADGE[activeFund.currency] ?? activeFund.currency}
            </span>
          )}
        </div>
        {hasMultipleFunds && (
          <ChevronsUpDown className="h-4 w-4 text-[#64748B] flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="mt-1 rounded-md border border-[#334155] bg-[#1E293B] overflow-hidden">
          {funds.map((fund) => (
            <button
              key={fund.id}
              type="button"
              onClick={() => handleSwitch(fund.id)}
              disabled={isPending}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#334155] transition-colors"
            >
              {fund.id === activeFundId ? (
                <Check className="h-3.5 w-3.5 text-[#3E5CFF] flex-shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span
                className={`truncate ${
                  fund.id === activeFundId
                    ? 'text-[#F8FAFC] font-medium'
                    : 'text-[#94A3B8]'
                }`}
              >
                {fund.name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] border border-[#334155]/50 rounded px-1 py-0.5 flex-shrink-0 ml-auto">
                {CURRENCY_BADGE[fund.currency] ?? fund.currency}
              </span>
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="border-t border-[#334155]" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  // CreateFundDialog will be triggered by parent
                  document.dispatchEvent(new CustomEvent('open-create-fund'))
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                New Fund
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 3: Commit**

```bash
git add src/components/layout/fund-switcher.tsx
git commit -m "feat: fund switcher sidebar component

Popover-style dropdown showing active fund + currency badge.
Fund list with checkmark indicator, New Fund button for admins.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Create Fund Dialog

**Files:**
- Create: `src/components/layout/create-fund-dialog.tsx`

**Step 1: Create the dialog component**

Create `src/components/layout/create-fund-dialog.tsx`:

```typescript
'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFund } from '@/lib/actions/funds'

const dark = {
  dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
  input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
  cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
  saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
  select: 'bg-[#11141D] border-[#334155] text-[#F8FAFC]',
} as const

const FUND_TYPES = [
  { value: 'TRADITIONAL_SEARCH_FUND', label: 'Traditional Search Fund' },
  { value: 'SELF_FUNDED_SEARCH', label: 'Self-Funded Search' },
  { value: 'ACCELERATOR_FUND', label: 'Accelerator Fund' },
  { value: 'ACQUISITION_FUND', label: 'Acquisition Fund' },
  { value: 'PE_FUND', label: 'PE Fund' },
  { value: 'HOLDING_COMPANY', label: 'Holding Company' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '\u20ac' },
  { value: 'GBP', label: 'GBP — British Pound', symbol: '\u00a3' },
]

export function CreateFundDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState('USD')

  // Listen for custom event from fund switcher
  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener('open-create-fund', handler)
    return () => document.removeEventListener('open-create-fund', handler)
  }, [])

  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.symbol ?? '$'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createFund(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setError(null)
    }}>
      <DialogContent className={`sm:max-w-[500px] ${dark.dialog}`}>
        <DialogHeader>
          <DialogTitle className="text-[#F8FAFC]">Create Fund</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fund Name */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Fund Name</Label>
            <Input
              name="name"
              placeholder="Apex Fund I"
              required
              className={dark.input}
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Currency</Label>
            <Select
              name="currency"
              value={currency}
              onValueChange={setCurrency}
            >
              <SelectTrigger className={dark.select}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#64748B]">
              Currency cannot be changed after creation.
            </p>
          </div>

          {/* Fund Type */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Fund Type</Label>
            <Select name="type" defaultValue="TRADITIONAL_SEARCH_FUND">
              <SelectTrigger className={dark.select}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                {FUND_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Size */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Target Size</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-mono text-sm">
                {currencySymbol}
              </span>
              <Input
                name="targetSize"
                type="text"
                inputMode="numeric"
                placeholder="50,000,000"
                required
                className={`${dark.input} pl-7 font-mono tabular-nums`}
              />
            </div>
          </div>

          {/* Vintage */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Vintage Year</Label>
            <Input
              name="vintage"
              type="number"
              placeholder={String(new Date().getFullYear())}
              className={`${dark.input} font-mono tabular-nums`}
            />
          </div>

          {error && (
            <div className="rounded-md p-2 text-sm bg-[#DC2626]/15 text-[#DC2626]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className={dark.cancelBtn}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={dark.saveBtn}
            >
              {isPending ? 'Creating...' : 'Create Fund'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 3: Commit**

```bash
git add src/components/layout/create-fund-dialog.tsx
git commit -m "feat: create fund dialog with currency selection

Modal form for fund creation: name, currency (immutable), type, target size, vintage.
Dynamic currency symbol on target size input. Follows Cockpit dark mode pattern.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Integrate Fund Switcher into Sidebar & Layout

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: Update sidebar to accept and render fund switcher**

In `src/components/layout/sidebar.tsx`:
1. Add import for `FundSwitcher` and `CreateFundDialog`
2. Add `funds`, `activeFundId` to `SidebarProps`
3. Render `<FundSwitcher>` before the navigation `<nav>` and `<CreateFundDialog />` at the end

The sidebar props become:
```typescript
interface SidebarProps {
  userRole?: string
  funds: FundSummary[]
  activeFundId: string
}
```

Add after the logo `<div>` and before `<nav>`:
```typescript
<FundSwitcher funds={funds} activeFundId={activeFundId} userRole={userRole} />
```

Add before closing `</div>`:
```typescript
<CreateFundDialog />
```

**Step 2: Update layout to load fund data**

In `src/app/(dashboard)/layout.tsx`:
1. Add imports for `getUserFunds` and `getActiveFundId`
2. After auth check, load fund data
3. Pass `funds` and `activeFundId` to `<Sidebar>`

Add after `const unreadCount = await getUnreadCount()`:
```typescript
const { getUserFunds } = await import('@/lib/actions/funds')
const { getActiveFundId } = await import('@/lib/shared/active-fund')
const [funds, activeFundId] = await Promise.all([
  getUserFunds(session.user.id!),
  getActiveFundId(),
])
```

Update the Sidebar render:
```typescript
<Sidebar
  userRole={session?.user?.role as string | undefined}
  funds={funds}
  activeFundId={activeFundId ?? funds[0]?.id ?? ''}
/>
```

**Step 3: Run ALL tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 4: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 5: Run lint**

Run: `npm run lint`
Expected: Zero errors

**Step 6: Commit**

```bash
git add src/components/layout/sidebar.tsx src/app/\(dashboard\)/layout.tsx
git commit -m "feat: integrate fund switcher into sidebar and dashboard layout

Layout loads user funds and active fund ID, passes to sidebar.
Fund switcher renders above navigation with create fund dialog.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Phase 4: Settings & Final Polish

### Task 12: Currency Read-Only Badge in Settings

**Files:**
- Modify: `src/components/settings/fund-config-form.tsx`

**Step 1: Add currency display as read-only badge**

In the fund config form, add a read-only currency badge near the fund name field (same pattern as the existing read-only Fund Type badge):

```typescript
<div className="space-y-2">
  <Label className="text-[#94A3B8]">Currency</Label>
  <Badge variant="outline" className="text-[#94A3B8] border-[#334155]">
    {fund.currency}
  </Badge>
  <p className="text-xs text-[#64748B]">
    Fund currency is set at creation and cannot be changed.
  </p>
</div>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 3: Commit**

```bash
git add src/components/settings/fund-config-form.tsx
git commit -m "feat: display currency as read-only badge in fund settings

Currency is immutable after creation. Shown alongside fund type badge.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Final Verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All 288+ tests pass (including new formatter tests)

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero errors, zero warnings

**Step 3: Run lint**

Run: `npm run lint`
Expected: Zero errors

**Step 4: Verify no hardcoded $ symbols remain**

Search for remaining hardcoded `$` in display formatting (should find zero outside of CSS selectors, comments, and the central formatter):

Run: `grep -rn '\$\${' src/ --include='*.tsx' --include='*.ts' | grep -v node_modules | grep -v formatters.ts | grep -v '\.test\.'`
Expected: Zero results (or only CSS template literals like `${className}`)

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification — multi-fund & multicurrency complete

All tests pass. Build clean. Lint clean.
Zero hardcoded currency symbols outside central formatter.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Production Deployment Notes

After merging to main, run these SQL statements on the Neon production database:

```sql
-- Create Currency enum type
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- Migrate existing column
ALTER TABLE "Fund" ALTER COLUMN "currency" TYPE "Currency" USING "currency"::"Currency";
ALTER TABLE "Fund" ALTER COLUMN "currency" SET DEFAULT 'USD';
```

---

## Task Summary

| Task | Phase | Description | Files |
|------|-------|-------------|-------|
| 1 | Schema | Currency enum + Fund model | 2 modified |
| 2 | Foundation | Currency-aware formatters + tests | 1 modified, 1 created |
| 3 | Foundation | Active fund cookie utility | 1 created |
| 4 | Foundation | Rewrite fund-access.ts | 1 modified |
| 5 | Actions | New funds.ts server actions | 1 created |
| 6 | Actions | Propagate currency to 10 action files | 10 modified |
| 7 | Cleanup | Eliminate chart/portal duplicates | 6 modified |
| 8 | Cleanup | Eliminate dashboard inline $ | 7 modified |
| 9 | UI | Fund switcher component | 1 created |
| 10 | UI | Create fund dialog | 1 created |
| 11 | UI | Integrate into sidebar + layout | 2 modified |
| 12 | Polish | Currency badge in settings | 1 modified |
| 13 | Verify | Full test/build/lint verification | 0 |

**Totals: 4 new files, ~24 modified files, 13 tasks**
