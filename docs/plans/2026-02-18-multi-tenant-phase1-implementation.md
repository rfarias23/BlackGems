# Multi-Tenant Phase 1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Organization (PE Firm) model, subdomain routing middleware, Fund field expansion, and cross-subdomain auth to transform BlackGem from single-instance to multi-tenant.

**Architecture:** New `Organization` model as tenant parent above `Fund`. Middleware parses subdomain from hostname, resolves to Fund via `slug`, injects `x-fund-slug` header. NextAuth cookie domain changed to `.blackgem.ai` for cross-subdomain sessions. All existing `requireFundAccess()` calls gain an Organization boundary check.

**Tech Stack:** Prisma 6.19, Next.js 15.1 middleware, NextAuth v5 beta.30, Vitest 4, PostgreSQL

**Design Doc:** `docs/plans/2026-02-18-multi-tenant-architecture-design.md`

**Current test baseline:** 385 tests passing across 19 files

---

## Task 1: Organization Model + Enums in Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma` (add Organization model + 4 new enums after line 8)

**Step 1: Add Organization model and enums to schema.prisma**

Insert after the `datasource db` block (after line 8), before the `// USER & AUTHENTICATION` section comment:

```prisma
// ============================================================================
// ORGANIZATION (PE FIRM / TENANT)
// ============================================================================

model Organization {
  id                String   @id @default(cuid())

  // Identity
  name              String
  slug              String   @unique
  legalName         String?
  type              OrganizationType

  // Legal
  entityType        OrgEntityType?
  jurisdictionOfFormation String?
  dateOfFormation   DateTime?
  taxId             String?
  leiCode           String?
  regulatoryStatus  RegulatoryStatus?
  secFileNumber     String?

  // Contact
  primaryContactName  String?
  primaryContactEmail String?
  primaryContactPhone String?
  investorRelationsEmail String?
  websiteUrl        String?
  logoUrl           String?

  // Address
  addressLine1      String?
  addressLine2      String?
  city              String?
  state             String?
  country           String   @default("USA")
  postalCode        String?

  // Operational
  baseCurrency      Currency @default(USD)
  fiscalYearEnd     String?
  reportingFrequency ReportingFrequency?
  baseTimeZone      String?

  // Strategy (firm-level defaults)
  firmStrategies    String[]
  targetGeographies String[]
  targetSectors     String[]

  // Status
  isActive          Boolean  @default(true)
  onboardingCompleted Boolean @default(false)

  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  funds             Fund[]
  users             User[]

  @@index([slug])
}

enum OrganizationType {
  SEARCH_FUND
  MICRO_PE
  MID_PE
  CONSOLIDATED_PE
}

enum OrgEntityType {
  LLC
  LP
  C_CORP
  S_CORP
  SICAV
  LTD
  SARL
  OTHER
}

enum RegulatoryStatus {
  REGISTERED
  EXEMPT
  NON_REGISTERED
}

enum ReportingFrequency {
  MONTHLY
  QUARTERLY
  SEMI_ANNUAL
  ANNUAL
}
```

**Step 2: Add `organizationId` FK to User model**

In the `User` model (currently starting at line 14), add after the `updatedAt` field (line 24):

```prisma
  // Tenant scope
  organization   Organization? @relation(fields: [organizationId], references: [id])
  organizationId String?
```

And add an index at the end of the User model relations:

```prisma
  @@index([organizationId])
```

**Step 3: Add `organizationId` FK + new fields to Fund model**

In the `Fund` model (currently starting at line 89), add after the `slug` field (line 92):

```prisma
  // Tenant scope
  organization      Organization? @relation(fields: [organizationId], references: [id])
  organizationId    String?
```

Add after the `catchUpRate` field (line 108):

```prisma
  // Strategy & Focus
  strategy          String?    @db.Text
  investmentStages  String[]
  targetSectors     String[]
  targetGeographies String[]
  checkSizeMin      Decimal?   @db.Decimal(15, 2)
  checkSizeMax      Decimal?   @db.Decimal(15, 2)

  // Lifecycle Dates
  fundLaunchDate       DateTime?
  firstCloseDate       DateTime?
  finalCloseDate       DateTime?
  investmentPeriodEnd  DateTime?
  fundTermYears        Int?

  // Legal
  fundEntityType    OrgEntityType?
  jurisdiction      String?
  taxId             String?

  // Operational Config
  capitalCallNoticeDays    Int?
  distributionNoticeDays   Int?
```

Add an index at the end of the Fund model:

```prisma
  @@index([organizationId])
```

**Step 4: Run Prisma generate to validate schema**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` with no errors.

**Step 5: Verify build still passes**

Run: `npm run build`
Expected: Build succeeds. New nullable columns don't break existing code.

**Step 6: Run existing tests**

Run: `npm test`
Expected: All 385 tests pass (no regressions).

**Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Organization model and Fund field expansion to schema

Adds Organization (PE Firm) as tenant parent entity with 40+ fields
covering legal, contact, operational, and strategy configuration.
Adds organizationId FK to User and Fund models (nullable for migration).
Expands Fund with strategy, lifecycle dates, legal, and config fields.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: NextAuth Type Extensions for Organization

**Files:**
- Modify: `src/types/next-auth.d.ts`

**Step 1: Add `organizationId` to NextAuth type declarations**

Replace the entire file content:

```typescript
import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            investorId?: string | null
            organizationId?: string | null
        } & DefaultSession["user"]
    }
    interface User {
        role: UserRole
        investorId?: string | null
        organizationId?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: UserRole
        investorId?: string | null
        organizationId?: string | null
    }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build passes. Type extension is additive and optional.

**Step 3: Commit**

```bash
git add src/types/next-auth.d.ts
git commit -m "feat: extend NextAuth types with organizationId

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Auth Config — JWT + Session with organizationId

**Files:**
- Modify: `src/lib/auth.ts` (authorize callback — add organizationId to returned user)
- Modify: `src/lib/auth.config.ts` (jwt + session callbacks — propagate organizationId)

**Step 1: Modify auth.ts authorize to include organizationId**

In `src/lib/auth.ts`, change the user query at line 33 to include `organizationId`:

```typescript
                    const user = await prisma.user.findUnique({
                        where: { email },
                        include: {
                            investor: { select: { id: true } },
                        },
                    })
```

And change the returned object at line 48 to include `organizationId`:

```typescript
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        investorId: user.investor?.id ?? null,
                        organizationId: user.organizationId ?? null,
                    }
```

**Step 2: Modify auth.config.ts JWT callback to propagate organizationId**

In `src/lib/auth.config.ts`, update the `jwt` callback (line 54-59):

```typescript
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.sub = user.id
                token.investorId = user.investorId ?? null
                token.organizationId = user.organizationId ?? null
            }
            return token
        },
```

**Step 3: Modify auth.config.ts session callback to expose organizationId**

Update the `session` callback (line 67-73):

```typescript
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string
                session.user.role = token.role as UserRole
                session.user.investorId = token.investorId as string | null
                session.user.organizationId = token.organizationId as string | null
            }
            return session
        },
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build passes. organizationId is nullable so existing users (with null) work fine.

**Step 5: Run tests**

Run: `npm test`
Expected: All 385 tests pass.

**Step 6: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.config.ts
git commit -m "feat: propagate organizationId through JWT and session

Authorize callback now queries and returns organizationId from User.
JWT and session callbacks propagate it to all server-side contexts.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Tenant Resolution Utility

**Files:**
- Create: `src/lib/shared/tenant.ts`
- Create: `src/lib/shared/__tests__/tenant.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/shared/__tests__/tenant.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractSubdomain, isRootDomain } from '../tenant'

describe('extractSubdomain', () => {
  const ROOT_DOMAIN = 'blackgem.ai'

  it('extracts subdomain from fund.blackgem.ai', () => {
    expect(extractSubdomain('martha-fund.blackgem.ai', ROOT_DOMAIN)).toBe('martha-fund')
  })

  it('extracts subdomain from multi-word slug', () => {
    expect(extractSubdomain('andes-capital-fund-i.blackgem.ai', ROOT_DOMAIN)).toBe('andes-capital-fund-i')
  })

  it('returns null for root domain blackgem.ai', () => {
    expect(extractSubdomain('blackgem.ai', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for www.blackgem.ai', () => {
    expect(extractSubdomain('www.blackgem.ai', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for localhost', () => {
    expect(extractSubdomain('localhost:3002', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for localhost without port', () => {
    expect(extractSubdomain('localhost', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractSubdomain('', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for unrelated domain', () => {
    expect(extractSubdomain('example.com', ROOT_DOMAIN)).toBeNull()
  })

  it('strips port from hostname before extracting', () => {
    expect(extractSubdomain('martha-fund.blackgem.ai:443', ROOT_DOMAIN)).toBe('martha-fund')
  })
})

describe('isRootDomain', () => {
  const ROOT_DOMAIN = 'blackgem.ai'

  it('returns true for blackgem.ai', () => {
    expect(isRootDomain('blackgem.ai', ROOT_DOMAIN)).toBe(true)
  })

  it('returns true for www.blackgem.ai', () => {
    expect(isRootDomain('www.blackgem.ai', ROOT_DOMAIN)).toBe(true)
  })

  it('returns true for localhost', () => {
    expect(isRootDomain('localhost:3002', ROOT_DOMAIN)).toBe(true)
  })

  it('returns false for subdomain', () => {
    expect(isRootDomain('martha-fund.blackgem.ai', ROOT_DOMAIN)).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/shared/__tests__/tenant.test.ts`
Expected: FAIL — module `../tenant` not found.

**Step 3: Implement tenant.ts**

Create `src/lib/shared/tenant.ts`:

```typescript
/**
 * Tenant resolution utilities for multi-subdomain routing.
 *
 * Subdomains map to Fund slugs: martha-fund.blackgem.ai → Fund.slug = "martha-fund"
 * The Organization is inferred from the Fund's organizationId.
 */

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'blackgem.ai'

/**
 * Extracts the subdomain from a hostname.
 * Returns null for root domain, www, or localhost.
 *
 * Examples:
 *   "martha-fund.blackgem.ai" → "martha-fund"
 *   "blackgem.ai" → null
 *   "www.blackgem.ai" → null
 *   "localhost:3002" → null
 */
export function extractSubdomain(hostname: string, rootDomain: string = ROOT_DOMAIN): string | null {
  if (!hostname) return null

  // Strip port if present
  const host = hostname.split(':')[0]

  // Localhost is always root
  if (host === 'localhost' || host === '127.0.0.1') return null

  // Must end with root domain
  if (!host.endsWith(`.${rootDomain}`)) return null

  // Extract subdomain portion
  const subdomain = host.slice(0, -(rootDomain.length + 1))

  // "www" is treated as root, not a tenant
  if (!subdomain || subdomain === 'www') return null

  return subdomain
}

/**
 * Returns true if the hostname is the root domain (no tenant subdomain).
 */
export function isRootDomain(hostname: string, rootDomain: string = ROOT_DOMAIN): boolean {
  if (!hostname) return true

  const host = hostname.split(':')[0]

  if (host === 'localhost' || host === '127.0.0.1') return true
  if (host === rootDomain || host === `www.${rootDomain}`) return true

  return !host.endsWith(`.${rootDomain}`)
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/shared/__tests__/tenant.test.ts`
Expected: All 13 tests PASS.

**Step 5: Run full test suite to check for regressions**

Run: `npm test`
Expected: All tests pass (385 + 13 new = 398).

**Step 6: Commit**

```bash
git add src/lib/shared/tenant.ts src/lib/shared/__tests__/tenant.test.ts
git commit -m "feat: add tenant resolution utilities for subdomain routing

extractSubdomain() parses fund slug from hostname.
isRootDomain() checks if request is for the root domain.
13 unit tests covering all hostname patterns.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Next.js Middleware for Subdomain Parsing

**Files:**
- Create: `src/middleware.ts`
- Modify: `src/lib/auth.config.ts` (integrate with middleware)

**Step 1: Create the middleware**

Create `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractSubdomain } from '@/lib/shared/tenant'

/**
 * Next.js middleware for subdomain-based tenant resolution.
 *
 * Parses the hostname to extract a fund slug from the subdomain.
 * In development, falls back to the `?fund=<slug>` query parameter.
 *
 * Sets `x-fund-slug` request header for downstream consumption
 * by server components and server actions.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // 1. Try subdomain extraction (production)
  let fundSlug = extractSubdomain(hostname)

  // 2. Fallback: query parameter for local development
  if (!fundSlug && hostname.includes('localhost')) {
    fundSlug = request.nextUrl.searchParams.get('fund') || null
  }

  // 3. If no tenant resolved, pass through (root domain)
  if (!fundSlug) {
    return NextResponse.next()
  }

  // 4. Clone headers and inject fund slug
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-fund-slug', fundSlug)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.png (browser icons)
     * - api/auth (NextAuth handles its own routing)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|api/auth).*)',
  ],
}
```

**Important note:** NextAuth v5 beta.30 uses the `authorized` callback in `auth.config.ts` as edge middleware. With a custom `middleware.ts`, the NextAuth middleware must be composed. However, the current codebase does NOT export a `middleware.ts` — it relies on NextAuth's built-in middleware via `auth.config.ts`. When we add a custom middleware, we need to chain it with NextAuth's `auth` wrapper.

**Step 2: Integrate middleware with NextAuth**

Update `src/middleware.ts` to wrap with NextAuth auth:

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractSubdomain } from '@/lib/shared/tenant'

/**
 * Next.js middleware for subdomain-based tenant resolution + auth.
 *
 * Chain: Parse subdomain → Set header → NextAuth authorized() callback.
 */
export default auth((request) => {
  const hostname = request.headers.get('host') || ''

  // 1. Try subdomain extraction (production)
  let fundSlug = extractSubdomain(hostname)

  // 2. Fallback: query parameter for local development
  if (!fundSlug && hostname.includes('localhost')) {
    fundSlug = request.nextUrl.searchParams.get('fund') || null
  }

  // 3. If no tenant resolved, pass through (root domain)
  if (!fundSlug) {
    return NextResponse.next()
  }

  // 4. Clone headers and inject fund slug
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-fund-slug', fundSlug)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|api/auth).*)',
  ],
}
```

**Note:** The `auth()` wrapper from NextAuth v5 acts as middleware. When you export `default auth(handler)`, the `authorized` callback in `auth.config.ts` runs first (handling login redirects and LP protection), then our custom handler runs to inject the fund slug header.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes. The middleware is additive — if no subdomain is detected, behavior is identical to before.

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add subdomain-parsing middleware for tenant resolution

Composes with NextAuth auth() wrapper for unified middleware chain.
Extracts fund slug from subdomain (prod) or ?fund= param (dev).
Injects x-fund-slug header for downstream server components.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Active Fund Resolution — Subdomain-Aware

**Files:**
- Modify: `src/lib/shared/active-fund.ts` (add cookie domain config)
- Modify: `src/lib/shared/fund-access.ts` (subdomain-first fund resolution)
- Modify: `src/lib/shared/__tests__/tenant.test.ts` (add header reading tests if needed)

**Step 1: Update active-fund.ts cookie to support cross-subdomain**

In `src/lib/shared/active-fund.ts`, update the `setActiveFundId` function to use `.blackgem.ai` cookie domain in production:

```typescript
import { cookies } from 'next/headers'

const ACTIVE_FUND_COOKIE = 'blackgem-active-fund'
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined

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
 * In production, cookie domain is .blackgem.ai for cross-subdomain support.
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
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
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

**Step 2: Update fund-access.ts — getAuthorizedFundId with subdomain priority**

In `src/lib/shared/fund-access.ts`, add a helper to read the fund slug from headers and update `getAuthorizedFundId`:

Add import at top of file:

```typescript
import { headers } from 'next/headers'
```

Add helper function after the existing `isAdminRole` function:

```typescript
/**
 * Reads the fund slug injected by middleware from the request headers.
 * Returns null if no subdomain was detected.
 */
async function getFundSlugFromHeaders(): Promise<string | null> {
  try {
    const headersList = await headers()
    return headersList.get('x-fund-slug')
  } catch {
    // headers() may throw outside of request context (e.g., in tests)
    return null
  }
}
```

Update the `getAuthorizedFundId` function to check subdomain first:

```typescript
export async function getAuthorizedFundId(userId: string): Promise<string | null> {
  try {
    // 1. Try subdomain-resolved fund (from middleware header)
    const fundSlug = await getFundSlugFromHeaders()
    if (fundSlug) {
      const fund = await prisma.fund.findUnique({
        where: { slug: fundSlug },
        select: { id: true },
      })
      if (fund) {
        // Verify user has access to this fund
        const isAdmin = await isAdminRole(userId)
        if (isAdmin) {
          await setActiveFundId(fund.id)
          return fund.id
        }
        const membership = await prisma.fundMember.findUnique({
          where: { fundId_userId: { fundId: fund.id, userId } },
          select: { isActive: true },
        })
        if (membership?.isActive) {
          await setActiveFundId(fund.id)
          return fund.id
        }
        // User doesn't have access to this fund — fall through to cookie
      }
    }

    // 2. Try cookie
    const cookieFundId = await getActiveFundId()

    if (cookieFundId) {
      const isAdmin = await isAdminRole(userId)

      if (isAdmin) {
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

    // 3. Fallback: first fund user has membership in
    const membership = await prisma.fundMember.findFirst({
      where: { userId, isActive: true },
      select: { fundId: true },
      orderBy: { joinedAt: 'asc' },
    })

    if (membership) {
      await setActiveFundId(membership.fundId)
      return membership.fundId
    }

    // 4. Fallback for admins with no memberships: first fund in DB
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

    return null
  } catch (error) {
    console.error('getAuthorizedFundId failed:', error)
    return null
  }
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build passes.

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. The `headers()` call in `getFundSlugFromHeaders` is wrapped in try/catch, so tests that don't have a request context still work.

**Step 5: Commit**

```bash
git add src/lib/shared/active-fund.ts src/lib/shared/fund-access.ts
git commit -m "feat: subdomain-aware fund resolution and cross-subdomain cookies

getAuthorizedFundId() now checks x-fund-slug header (from middleware)
before falling back to cookie and membership. Cookie domain configurable
via COOKIE_DOMAIN env var for cross-subdomain support.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Organization Validation in Fund Access

**Files:**
- Modify: `src/lib/shared/fund-access.ts` (add org boundary check to requireFundAccess)
- Create: `src/lib/shared/__tests__/fund-access-org.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/shared/__tests__/fund-access-org.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateOrganizationBoundary } from '../fund-access'

describe('validateOrganizationBoundary', () => {
  it('returns true when both orgIds match', () => {
    expect(validateOrganizationBoundary('org_1', 'org_1')).toBe(true)
  })

  it('returns true when user has no orgId (platform admin)', () => {
    expect(validateOrganizationBoundary(null, 'org_1')).toBe(true)
  })

  it('returns true when fund has no orgId (pre-migration)', () => {
    expect(validateOrganizationBoundary('org_1', null)).toBe(true)
  })

  it('returns true when both are null (pre-migration)', () => {
    expect(validateOrganizationBoundary(null, null)).toBe(true)
  })

  it('returns false when orgIds differ', () => {
    expect(validateOrganizationBoundary('org_1', 'org_2')).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/shared/__tests__/fund-access-org.test.ts`
Expected: FAIL — `validateOrganizationBoundary` not found.

**Step 3: Implement validateOrganizationBoundary**

In `src/lib/shared/fund-access.ts`, add the exported function:

```typescript
/**
 * Validates that a user and fund belong to the same organization.
 * Returns true if:
 * - Both orgIds match
 * - Either orgId is null (pre-migration or platform admin)
 * Returns false only when both are non-null and differ.
 */
export function validateOrganizationBoundary(
  userOrgId: string | null | undefined,
  fundOrgId: string | null | undefined
): boolean {
  if (!userOrgId || !fundOrgId) return true
  return userOrgId === fundOrgId
}
```

**Step 4: Integrate into requireFundAccess**

Update the `requireFundAccess` function to add the org boundary check:

```typescript
export async function requireFundAccess(userId: string, fundId: string) {
  // Organization boundary check
  const [user, fund] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    }),
    prisma.fund.findUnique({
      where: { id: fundId },
      select: { organizationId: true },
    }),
  ])

  if (!validateOrganizationBoundary(user?.organizationId ?? null, fund?.organizationId ?? null)) {
    throw new Error('Access denied: fund belongs to a different organization')
  }

  // Admin bypass (already fetched the role above)
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'FUND_ADMIN') {
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
```

**Note:** This refactors `requireFundAccess` to batch the user+fund queries in `Promise.all` and adds the org boundary check. The `isAdminRole` helper is no longer needed inside this function since we already fetched the role. Keep `isAdminRole` for other functions that use it.

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/shared/__tests__/fund-access-org.test.ts`
Expected: All 5 tests PASS.

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```bash
git add src/lib/shared/fund-access.ts src/lib/shared/__tests__/fund-access-org.test.ts
git commit -m "feat: add organization boundary validation to requireFundAccess

validateOrganizationBoundary() ensures users cannot access funds
from a different organization. Gracefully handles null orgIds
for pre-migration data and platform admins. 5 unit tests.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Organization Server Actions

**Files:**
- Create: `src/lib/actions/organizations.ts`
- Create: `src/lib/actions/__tests__/organization-validation.test.ts`

**Step 1: Write the failing tests for slug validation**

Create `src/lib/actions/__tests__/organization-validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateSlug, validateSlug } from '../organizations'

describe('generateSlug', () => {
  it('converts name to lowercase kebab-case', () => {
    expect(generateSlug('Martha Fund')).toBe('martha-fund')
  })

  it('handles multi-word names', () => {
    expect(generateSlug('Andes Capital Partners Fund I')).toBe('andes-capital-partners-fund-i')
  })

  it('removes special characters', () => {
    expect(generateSlug('Fund #1 (2025)')).toBe('fund-1-2025')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  ---Fund---  ')).toBe('fund')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('Fund   Multiple   Spaces')).toBe('fund-multiple-spaces')
  })

  it('truncates to 63 characters (DNS label max)', () => {
    const longName = 'A'.repeat(100)
    expect(generateSlug(longName).length).toBeLessThanOrEqual(63)
  })

  it('handles accented characters', () => {
    expect(generateSlug('Fondo de Inversión LATAM')).toBe('fondo-de-inversin-latam')
  })
})

describe('validateSlug', () => {
  it('accepts valid slug', () => {
    expect(validateSlug('martha-fund')).toEqual({ valid: true })
  })

  it('accepts single word', () => {
    expect(validateSlug('blackgem')).toEqual({ valid: true })
  })

  it('accepts alphanumeric with hyphens', () => {
    expect(validateSlug('fund-2025-v2')).toEqual({ valid: true })
  })

  it('rejects empty string', () => {
    expect(validateSlug('')).toEqual({ valid: false, error: 'Slug cannot be empty' })
  })

  it('rejects slug with spaces', () => {
    expect(validateSlug('martha fund').valid).toBe(false)
  })

  it('rejects slug with uppercase', () => {
    expect(validateSlug('MarthaFund').valid).toBe(false)
  })

  it('rejects slug starting with hyphen', () => {
    expect(validateSlug('-martha-fund').valid).toBe(false)
  })

  it('rejects slug longer than 63 chars', () => {
    expect(validateSlug('a'.repeat(64)).valid).toBe(false)
  })

  it('rejects reserved slugs', () => {
    expect(validateSlug('www').valid).toBe(false)
    expect(validateSlug('api').valid).toBe(false)
    expect(validateSlug('app').valid).toBe(false)
    expect(validateSlug('admin').valid).toBe(false)
    expect(validateSlug('login').valid).toBe(false)
    expect(validateSlug('portal').valid).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/actions/__tests__/organization-validation.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement organizations.ts**

Create `src/lib/actions/organizations.ts`:

```typescript
'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/shared/audit'
import { z } from 'zod'

// ============================================================================
// SLUG UTILITIES (exported for testing)
// ============================================================================

const RESERVED_SLUGS = [
  'www', 'api', 'app', 'admin', 'login', 'register', 'portal',
  'dashboard', 'settings', 'pricing', 'docs', 'help', 'support',
  'status', 'blog', 'mail', 'ftp', 'ssh', 'cdn', 'static',
]

/**
 * Generates a URL-safe slug from a display name.
 * DNS label max length: 63 characters.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

/**
 * Validates a slug for use as a subdomain.
 */
export function validateSlug(
  slug: string
): { valid: true } | { valid: false; error: string } {
  if (!slug) return { valid: false, error: 'Slug cannot be empty' }
  if (slug.length > 63) return { valid: false, error: 'Slug must be 63 characters or fewer' }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return { valid: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen' }
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: `"${slug}" is a reserved name and cannot be used` }
  }
  return { valid: true }
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  slug: z.string().min(1).max(63),
  type: z.enum(['SEARCH_FUND', 'MICRO_PE', 'MID_PE', 'CONSOLIDATED_PE']),
  legalName: z.string().optional(),
  country: z.string().default('USA'),
})

// ============================================================================
// ACTIONS
// ============================================================================

export async function createOrganization(input: z.infer<typeof createOrganizationSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const parsed = createOrganizationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const slugValidation = validateSlug(parsed.data.slug)
  if (!slugValidation.valid) return { error: slugValidation.error }

  // Check slug uniqueness
  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  })
  if (existing) return { error: 'This URL is already taken. Please choose a different one.' }

  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      type: parsed.data.type,
      legalName: parsed.data.legalName || null,
      country: parsed.data.country,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Organization',
    entityId: org.id,
  })

  return { data: org }
}

/**
 * Returns the organization for the current user, if any.
 */
export async function getUserOrganization() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })

  if (!user?.organizationId) return null

  return prisma.organization.findUnique({
    where: { id: user.organizationId },
  })
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/actions/__tests__/organization-validation.test.ts`
Expected: All 17 tests PASS.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/lib/actions/organizations.ts src/lib/actions/__tests__/organization-validation.test.ts
git commit -m "feat: add Organization server actions with slug validation

createOrganization() server action with Zod validation, slug uniqueness
check, and audit logging. generateSlug() and validateSlug() utilities
with DNS label compliance and reserved slug protection. 17 unit tests.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Production Migration SQL

**Files:**
- Create: `prisma/production-migration-organizations.sql`

**Step 1: Write the production migration SQL**

Create `prisma/production-migration-organizations.sql`:

```sql
-- ============================================================================
-- PRODUCTION MIGRATION: Multi-Tenant Organizations
-- Date: 2026-02-18
-- Prerequisites: Prisma schema changes must be deployed first (schema push/migrate)
-- Run from EC2: psql -h <RDS_HOST> -U blackgem_admin -d blackgem < production-migration-organizations.sql
-- ============================================================================

BEGIN;

-- Step 1: Verify Organization table exists (from Prisma migrate)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Organization') THEN
    RAISE EXCEPTION 'Organization table does not exist. Run Prisma migrate first.';
  END IF;
END $$;

-- Step 2: Create the default organization for existing data
INSERT INTO "Organization" (
  id, name, slug, "legalName", type,
  "baseCurrency", country,
  "isActive", "onboardingCompleted",
  "createdAt", "updatedAt"
)
SELECT
  'org_niro_default',
  'NIRO Group',
  'niro-group',
  'NIRO Group LLC',
  'MICRO_PE',
  'USD',
  'USA',
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Organization" WHERE id = 'org_niro_default'
);

-- Step 3: Assign all existing funds to the default organization
UPDATE "Fund"
SET "organizationId" = 'org_niro_default'
WHERE "organizationId" IS NULL;

-- Step 4: Backfill fund slugs from names
UPDATE "Fund"
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Trim leading/trailing hyphens from generated slugs
UPDATE "Fund"
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- Step 5: Assign all existing users to the default organization
UPDATE "User"
SET "organizationId" = 'org_niro_default'
WHERE "organizationId" IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify: All funds have an organization
SELECT
  'Funds without org:' as check_name,
  COUNT(*) as count
FROM "Fund"
WHERE "organizationId" IS NULL;

-- Verify: All funds have slugs
SELECT
  'Funds without slug:' as check_name,
  COUNT(*) as count
FROM "Fund"
WHERE slug IS NULL;

-- Verify: All users have an organization
SELECT
  'Users without org:' as check_name,
  COUNT(*) as count
FROM "User"
WHERE "organizationId" IS NULL;

-- Verify: Organization was created
SELECT
  'Organization:' as check_name,
  id, name, slug, type
FROM "Organization";

-- Verify: Fund assignments
SELECT
  'Fund assignments:' as check_name,
  f.name, f.slug, f."organizationId", o.name as org_name
FROM "Fund" f
JOIN "Organization" o ON f."organizationId" = o.id;

-- Verify: User assignments
SELECT
  'User assignments:' as check_name,
  u.email, u."organizationId", o.name as org_name
FROM "User" u
LEFT JOIN "Organization" o ON u."organizationId" = o.id;

COMMIT;
```

**Step 2: Review the migration locally**

Read the SQL file and verify it matches the expected data structure. The migration:
- Creates 1 Organization (`org_niro_default`) for the existing implicit firm
- Assigns all funds to it
- Backfills fund slugs from names
- Assigns all users to it
- Runs 6 verification queries

**Step 3: Commit**

```bash
git add prisma/production-migration-organizations.sql
git commit -m "feat: add production migration SQL for Organization backfill

Creates default NIRO Group organization, assigns all existing funds
and users, backfills fund slugs from names. Includes 6 verification
queries. Run after Prisma schema deploy.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Environment Variable Updates

**Files:**
- Modify: `.env` (local development)
- Create: `.env.example` (if it doesn't exist — document required vars)

**Step 1: Add new env vars to local .env**

Add to `.env` (or `.env.local`):

```env
# Multi-tenant config
ROOT_DOMAIN=blackgem.ai
# COOKIE_DOMAIN is intentionally unset for localhost (uses default behavior)
```

**Step 2: Document required production env vars**

The following must be set in the EC2 docker-compose.yml environment:

```env
ROOT_DOMAIN=blackgem.ai
COOKIE_DOMAIN=.blackgem.ai
```

**Note:** Do NOT commit `.env` files with secrets. This step is configuration documentation only.

**Step 3: Commit**

No commit needed for this task (env files are gitignored). Add a note to the design doc or `SESSION_HANDOFF.md` about required env vars.

---

## Task 11: Build + Lint + Test Verification

**Files:** None (verification only)

**Step 1: Run Prisma generate**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` with no errors.

**Step 2: Run lint**

Run: `npm run lint`
Expected: Clean (no errors or warnings).

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass. Count should be ~403+ (385 baseline + 13 tenant + 5 org boundary + 17 slug = 420).

**Step 5: Commit everything if needed**

If there are any unstaged fixes:

```bash
git add -A
git commit -m "fix: address lint/build issues from Phase 1 implementation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Final — Push and Prepare for Deployment

**Step 1: Review all changes**

Run: `git log --oneline -10`
Expected: ~7-8 commits from this phase.

Run: `git diff main --stat`
Expected: New files + modified files as documented.

**Step 2: Push to main**

Run: `git push origin main`
Expected: GitHub Actions triggers build → ECR → deploy to EC2.

**Step 3: After deployment — Run production migration**

SSH to EC2 and run:

```bash
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
# Get DATABASE_URL from running container
DB_URL=$(docker exec $(docker ps -q) env | grep DATABASE_URL | cut -d= -f2-)
# Run migration
psql "$DB_URL" < /path/to/production-migration-organizations.sql
```

**Step 4: After migration — Configure DNS**

In GoDaddy DNS settings for `blackgem.ai`:
- Add: A record `*` → `3.223.165.121` (wildcard)
- TTL: 600s

**Step 5: After DNS — Configure SSL**

On EC2, obtain wildcard SSL cert:

```bash
# Install acme.sh or certbot with DNS plugin
# Obtain *.blackgem.ai cert via DNS-01 challenge
```

**Step 6: After SSL — Update Nginx**

Update nginx config on EC2 to accept wildcard subdomains and use the new cert.

---

## Summary: Expected Test Count After Phase 1

| Test File | Tests |
|-----------|-------|
| Existing 19 files | 385 |
| `tenant.test.ts` | 13 |
| `fund-access-org.test.ts` | 5 |
| `organization-validation.test.ts` | 17 |
| **Total** | **~420** |

## Summary: File Changes

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `prisma/schema.prisma` | Organization model, enums, User/Fund FK, Fund fields |
| MODIFY | `src/types/next-auth.d.ts` | organizationId in session types |
| MODIFY | `src/lib/auth.ts` | organizationId in authorize |
| MODIFY | `src/lib/auth.config.ts` | organizationId in JWT/session callbacks |
| CREATE | `src/lib/shared/tenant.ts` | Subdomain extraction utilities |
| CREATE | `src/lib/shared/__tests__/tenant.test.ts` | 13 tenant tests |
| CREATE | `src/middleware.ts` | Subdomain-parsing middleware |
| MODIFY | `src/lib/shared/active-fund.ts` | Cross-subdomain cookie domain |
| MODIFY | `src/lib/shared/fund-access.ts` | Subdomain-first resolution + org boundary |
| CREATE | `src/lib/shared/__tests__/fund-access-org.test.ts` | 5 org boundary tests |
| CREATE | `src/lib/actions/organizations.ts` | Organization CRUD + slug utilities |
| CREATE | `src/lib/actions/__tests__/organization-validation.test.ts` | 17 slug/validation tests |
| CREATE | `prisma/production-migration-organizations.sql` | Data migration SQL |
