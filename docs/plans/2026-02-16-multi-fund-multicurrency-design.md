# Multi-Fund & Multicurrency — Design Document

**Date:** 2026-02-16
**Author:** Rodolfo Farias + Claude
**Status:** Approved
**Approach:** Foundation First (Enfoque A)

---

## 1. Overview

Two improvements to BlackGem's fund management infrastructure:

1. **Multi-Fund:** Enable users to create and manage multiple funds, with a sidebar switcher for the active fund
2. **Multicurrency:** Each fund operates in a single base currency (USD, EUR, or GBP), with all monetary values displayed in that currency

These are treated as a single initiative because they are architecturally coupled — multi-fund without per-fund currency is incomplete.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Currency scope | One currency per fund | Industry standard for PE/Search Funds. Cross-currency is $500M+ fund territory. |
| Fund switcher location | Sidebar dropdown | Standard SaaS multi-tenant pattern (Linear, Notion). Minimal friction. |
| Active fund persistence | httpOnly cookie | Server-side native in Next.js App Router. No route restructuring. Persists between sessions. |
| Currency immutability | Set at creation, read-only after | Prevents data integrity issues from mid-lifecycle currency changes. |

---

## 2. Data Model Changes

### 2.1 New Prisma Enum

```prisma
enum Currency {
  USD
  EUR
  GBP
}
```

### 2.2 Fund Model Change

```prisma
// BEFORE
currency String @default("USD")

// AFTER
currency Currency @default(USD)
```

### 2.3 Production Migration SQL

```sql
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');
ALTER TABLE "Fund" ALTER COLUMN "currency" TYPE "Currency" USING "currency"::"Currency";
ALTER TABLE "Fund" ALTER COLUMN "currency" SET DEFAULT 'USD';
```

No new models. No new relations. The existing `FundMember` model already supports multi-fund membership.

---

## 3. Currency Infrastructure

### 3.1 Central Formatter Rewrite

**File:** `src/lib/shared/formatters.ts`

The three core functions become currency-aware with backwards-compatible defaults:

```typescript
type CurrencyCode = 'USD' | 'EUR' | 'GBP'

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '\u20ac', locale: 'de-DE' },
  GBP: { symbol: '\u00a3', locale: 'en-GB' },
}

export function formatCurrency(value: NumericValue, currency: CurrencyCode = 'USD'): string | null
export function formatMoney(value: NumericValue, currency: CurrencyCode = 'USD'): string
export function formatCompact(value: NumericValue, currency: CurrencyCode = 'USD'): string
export function parseMoney(value: string): number  // strips $, \u20ac, \u00a3
```

Key changes:
- All format functions accept optional `currency` parameter (default `'USD'` for backwards compatibility)
- New `formatCompact()` centralizes the M/K abbreviation pattern used by charts
- `parseMoney()` regex updated: `/[$\u20ac\u00a3,]/g` to strip all three symbols
- `CurrencyCode` type exported for use across codebase

### 3.2 Duplicate Elimination

19 instances of hardcoded currency formatting exist outside the central formatter:

| Category | Files | Instances | Action |
|----------|-------|-----------|--------|
| Chart local `formatCurrency()` | 4 chart components | 4 identical functions | Delete, import `formatCompact` from formatters |
| Portal `Intl.NumberFormat('USD')` | 2 portal pages | 2 functions | Delete, import from formatters |
| Server action inline `` `$${...}` `` | capital-calls.ts, distributions.ts | 2 inline | Replace with `formatMoney(value, currency)` |
| Page-level inline `` `$${...}` `` | 5 dashboard/component pages | 11 inline | Replace with `formatMoney(value, currency)` |

### 3.3 Currency Flow Through Server Actions

Every server action that formats monetary values for display needs the fund's currency:

```typescript
// BEFORE
const fund = await prisma.fund.findFirst()
return { askingPrice: formatMoney(deal.askingPrice) }

// AFTER
const { fundId, currency } = await getActiveFundWithCurrency(userId)
return { askingPrice: formatMoney(deal.askingPrice, currency) }
```

Affected action files (8): `deals.ts`, `investors.ts`, `capital-calls.ts`, `distributions.ts`, `portfolio.ts`, `portfolio-monitoring.ts`, `reports.ts`, `chart-data.ts`

---

## 4. Active Fund Resolution

### 4.1 Cookie Persistence

**New file:** `src/lib/shared/active-fund.ts`

```typescript
const ACTIVE_FUND_COOKIE = 'blackgem-active-fund'

export async function getActiveFundId(): Promise<string | null>
  // Reads from cookies()

export async function setActiveFundId(fundId: string): Promise<void>
  // Sets httpOnly, secure, sameSite:lax, path:/, maxAge:1year
```

### 4.2 Rewritten `getAuthorizedFundId()`

**File:** `src/lib/shared/fund-access.ts`

Current behavior: `prisma.fund.findFirst()` — assumes single fund.

New behavior:
1. Read `fundId` from cookie
2. Validate user has active `FundMember` record for that fund (or is SUPER_ADMIN/FUND_ADMIN)
3. If cookie invalid/missing: fallback to first fund user has membership in
4. Update cookie with resolved fundId
5. Throw if user has zero fund access

### 4.3 Helper: `getActiveFundWithCurrency()`

Returns `{ fundId, currency }` in a single call — avoids double-query in server actions.

### 4.4 Migration of 13 `prisma.fund.findFirst()` Calls

All 13 instances across 11 files replaced with `getAuthorizedFundId()` or `getActiveFundWithCurrency()`:

| File | Instances | Resolution method |
|------|-----------|-------------------|
| `fund-access.ts` | 1 | Rewritten (see 4.2) |
| `chart-data.ts` | 2 | `getActiveFundWithCurrency()` |
| `reports.ts` | 3 | `getActiveFundWithCurrency()` |
| `settings.ts` | 1 | `getActiveFundWithCurrency()` |
| `deals.ts` | 3 | `getActiveFundWithCurrency()` |
| `quarterly-updates.ts` | 1 | Already receives fundId param |

---

## 5. Fund Switcher UI

### 5.1 Sidebar Fund Switcher

**New component:** `src/components/layout/fund-switcher.tsx`

- Popover-based dropdown at top of sidebar, above navigation
- Shows active fund name + currency badge (`EUR`, `USD`, `GBP`)
- Lists all funds user has access to
- Calls `switchActiveFund()` server action on selection
- "+ New Fund" button at bottom (FUND_ADMIN/SUPER_ADMIN only)
- If user has only 1 fund: displays as static info (no dropdown arrow)

Visual spec:
- Background: `#1E293B` (sidebar surface)
- Border: `#334155`
- Active indicator: `#3E5CFF` filled dot
- Currency badge: `text-[10px] font-mono` outline
- Hover: `bg-[#334155]`

### 5.2 Sidebar Integration

**Modified:** `src/components/layout/sidebar.tsx`

Fund switcher placed as first element in sidebar, before navigation links.

**Modified:** `src/app/(dashboard)/layout.tsx`

Layout loads fund data and passes to sidebar:
```typescript
const [funds, activeFundId] = await Promise.all([
  getUserFunds(session.user.id),
  getActiveFundId()
])
```

### 5.3 Create Fund Dialog

**New component:** `src/components/layout/create-fund-dialog.tsx`

Modal form (same pattern as add-task-button, add-contact-button):

| Field | Type | Required |
|-------|------|----------|
| Fund Name | text | Yes |
| Currency | select (USD/EUR/GBP) | Yes |
| Fund Type | select (6 FundType options) | Yes |
| Target Size | money input (dynamic symbol) | Yes |
| Vintage | number (year) | No |

Optional fields (Legal Name, Hard Cap, Fees) configured later in Settings.

---

## 6. Server Actions (New File)

**New file:** `src/lib/actions/funds.ts`

| Function | Purpose |
|----------|---------|
| `getUserFunds(userId)` | Returns all funds user has access to (admins see all) |
| `switchActiveFund(fundId)` | Validates access, sets cookie, revalidates layout |
| `createFund(formData)` | Creates fund + FundMember in transaction, auto-switches |

All follow standard BlackGem pattern: `auth()` -> `requireFundAccess()` -> Zod -> logic -> `logAudit()` -> `revalidatePath()`

---

## 7. Portal (LP) Handling

LPs don't have an "active fund" — they see data from all funds where they have commitments.

Currency resolution for LPs: derived from each commitment's fund. If an LP has commitments in funds with different currencies, each section displays in its own currency. No cross-currency aggregation.

---

## 8. Edge Cases

| Edge Case | Handling |
|-----------|---------|
| User has 0 funds | `getAuthorizedFundId()` throws -> page-level catch -> empty state with "Create your first fund" |
| Cookie points to inaccessible fund | Fallback to first accessible fund, update cookie |
| Currency changed after creation | Not allowed — currency is immutable post-creation. Settings shows read-only badge. |
| LP with multi-currency commitments | Portal shows per-fund sections, each in its own currency |
| Super admin creates fund | Auto-creates FundMember with PRINCIPAL role in transaction |
| parseMoney with non-USD input | Updated regex strips $, \u20ac, \u00a3 |

---

## 9. Testing

| Test File | Coverage |
|-----------|----------|
| `__tests__/formatters.test.ts` (expanded) | `formatCurrency/formatMoney/formatCompact` with USD/EUR/GBP, `parseMoney` with all symbols |
| `__tests__/active-fund.test.ts` (new) | Cookie read/write, fallback behavior, invalid cookie |

All 288 existing tests must pass — formatter changes are backwards-compatible (default `'USD'`).

---

## 10. File Change Summary

| Category | New | Modified |
|----------|-----|----------|
| Schema | -- | `prisma/schema.prisma` |
| Core utilities | `src/lib/shared/active-fund.ts` | `src/lib/shared/formatters.ts`, `src/lib/shared/fund-access.ts` |
| Server actions | `src/lib/actions/funds.ts` | 8 existing action files |
| Layout | -- | `src/app/(dashboard)/layout.tsx` |
| Components | `fund-switcher.tsx`, `create-fund-dialog.tsx` | `sidebar.tsx`, 4 charts, 2 portal pages, 5 dashboard pages, 3 components |
| Tests | `__tests__/active-fund.test.ts` | `__tests__/formatters.test.ts` |
| Seed | -- | `prisma/seed.ts` |

**Totals: 4 new files, ~24 modified files**
