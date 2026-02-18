# RBAC Granular + Investor Fund Isolation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Isolate investor data by fund (via Commitment bridge table) and add granular per-module RBAC permissions to FundMember, so users only see investors belonging to the active fund and only access modules they have permission for.

**Architecture:** Investors remain global entities (no `fundId` on Investor model). Isolation is achieved by filtering through the existing `Commitment` bridge table (`commitments: { some: { fundId } }`). RBAC uses a `permissions String[]` column on FundMember with module constants (DEALS, INVESTORS, PORTFOLIO, CAPITAL, REPORTS, SETTINGS, TEAM). SUPER_ADMIN/FUND_ADMIN bypass permission checks but NOT fund scope — queries always filter by active fundId.

**Tech Stack:** Next.js 15.1, React 19, TypeScript 5, Prisma 6.19, Vitest, PostgreSQL

---

## Task 1: Add `permissions` Column to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma` (FundMember model, line ~155)
- Create: `prisma/production-migration-rbac.sql`

**Step 1: Add `permissions` field to FundMember model**

In `prisma/schema.prisma`, find the `FundMember` model (line 154) and add the `permissions` field after `title`:

```prisma
model FundMember {
  id          String   @id @default(cuid())
  fund        Fund     @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  role        FundMemberRole
  title       String?
  permissions String[]          // Module-level access control
  joinedAt    DateTime @default(now())
  leftAt      DateTime?
  isActive    Boolean  @default(true)

  @@unique([fundId, userId])
  @@index([fundId])
  @@index([userId])
}
```

**Step 2: Create production migration SQL**

Create `prisma/production-migration-rbac.sql`:

```sql
-- RBAC: Add permissions column to FundMember
-- Run on production RDS BEFORE deploying this release
-- SSH to EC2, connect to RDS, execute this script

ALTER TABLE "FundMember" ADD COLUMN IF NOT EXISTS "permissions" TEXT[] DEFAULT '{}';

-- Backfill: PRINCIPAL and ADMIN get full access
UPDATE "FundMember" SET permissions = ARRAY[
  'DEALS','INVESTORS','PORTFOLIO','CAPITAL','REPORTS','SETTINGS','TEAM'
] WHERE role IN ('PRINCIPAL', 'ADMIN') AND permissions = '{}';

-- CO_PRINCIPAL gets everything except TEAM and SETTINGS
UPDATE "FundMember" SET permissions = ARRAY[
  'DEALS','INVESTORS','PORTFOLIO','CAPITAL','REPORTS'
] WHERE role = 'CO_PRINCIPAL' AND permissions = '{}';

-- ADVISOR and ANALYST get read-oriented modules
UPDATE "FundMember" SET permissions = ARRAY[
  'DEALS','PORTFOLIO','REPORTS'
] WHERE role IN ('ADVISOR', 'ANALYST') AND permissions = '{}';
```

**Step 3: Run `prisma generate`**

```bash
npx prisma generate
```

Expected: Success. The `FundMember` type in `@prisma/client` now includes `permissions: string[]`.

**Step 4: Verify build still passes**

```bash
npm run build
```

Expected: PASS — no existing code references `permissions` yet, so no breakage.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/production-migration-rbac.sql
git commit -m "feat(rbac): add permissions column to FundMember schema

Adds String[] permissions field for per-module access control.
Includes production SQL migration with backfill for existing roles.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create Permission Constants Module

**Files:**
- Create: `src/lib/shared/permissions.ts`

**Step 1: Write the permissions test**

Create `src/lib/shared/__tests__/permissions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { MODULE_PERMISSIONS, DEFAULT_PERMISSIONS, type ModulePermission } from '../permissions'

describe('MODULE_PERMISSIONS', () => {
  it('contains all required modules', () => {
    expect(MODULE_PERMISSIONS.DEALS).toBe('DEALS')
    expect(MODULE_PERMISSIONS.INVESTORS).toBe('INVESTORS')
    expect(MODULE_PERMISSIONS.PORTFOLIO).toBe('PORTFOLIO')
    expect(MODULE_PERMISSIONS.CAPITAL).toBe('CAPITAL')
    expect(MODULE_PERMISSIONS.REPORTS).toBe('REPORTS')
    expect(MODULE_PERMISSIONS.SETTINGS).toBe('SETTINGS')
    expect(MODULE_PERMISSIONS.TEAM).toBe('TEAM')
  })

  it('has exactly 7 modules', () => {
    expect(Object.keys(MODULE_PERMISSIONS)).toHaveLength(7)
  })
})

describe('DEFAULT_PERMISSIONS', () => {
  it('gives PRINCIPAL full access', () => {
    expect(DEFAULT_PERMISSIONS.PRINCIPAL).toEqual(
      expect.arrayContaining(['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'])
    )
    expect(DEFAULT_PERMISSIONS.PRINCIPAL).toHaveLength(7)
  })

  it('gives ADMIN full access', () => {
    expect(DEFAULT_PERMISSIONS.ADMIN).toEqual(DEFAULT_PERMISSIONS.PRINCIPAL)
  })

  it('gives CO_PRINCIPAL access without TEAM and SETTINGS', () => {
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).toContain('DEALS')
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).toContain('INVESTORS')
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).not.toContain('TEAM')
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).not.toContain('SETTINGS')
  })

  it('gives ANALYST limited access without INVESTORS', () => {
    expect(DEFAULT_PERMISSIONS.ANALYST).toContain('DEALS')
    expect(DEFAULT_PERMISSIONS.ANALYST).toContain('PORTFOLIO')
    expect(DEFAULT_PERMISSIONS.ANALYST).toContain('REPORTS')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('INVESTORS')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('TEAM')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('SETTINGS')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('CAPITAL')
  })

  it('gives ADVISOR same access as ANALYST', () => {
    expect(DEFAULT_PERMISSIONS.ADVISOR).toEqual(DEFAULT_PERMISSIONS.ANALYST)
  })

  it('covers all FundMemberRole values', () => {
    const expectedRoles = ['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST']
    expect(Object.keys(DEFAULT_PERMISSIONS).sort()).toEqual(expectedRoles.sort())
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/shared/__tests__/permissions.test.ts
```

Expected: FAIL — `Cannot find module '../permissions'`

**Step 3: Write the permissions module**

Create `src/lib/shared/permissions.ts`:

```typescript
/**
 * Module-level permission constants for RBAC.
 *
 * Stored as String[] on FundMember.permissions.
 * Using strings (not a Prisma enum) allows adding new modules
 * without a database migration.
 */
export const MODULE_PERMISSIONS = {
  DEALS: 'DEALS',
  INVESTORS: 'INVESTORS',
  PORTFOLIO: 'PORTFOLIO',
  CAPITAL: 'CAPITAL',         // Capital Calls + Distributions
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
  TEAM: 'TEAM',
} as const

export type ModulePermission = typeof MODULE_PERMISSIONS[keyof typeof MODULE_PERMISSIONS]

/**
 * Default permission sets per FundMemberRole.
 * Applied when creating new FundMember records.
 * Can be overridden per-user in a future UI (Phase 2).
 */
export const DEFAULT_PERMISSIONS: Record<string, ModulePermission[]> = {
  PRINCIPAL:    ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'],
  ADMIN:        ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'],
  CO_PRINCIPAL: ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS'],
  ADVISOR:      ['DEALS', 'PORTFOLIO', 'REPORTS'],
  ANALYST:      ['DEALS', 'PORTFOLIO', 'REPORTS'],
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/shared/__tests__/permissions.test.ts
```

Expected: PASS — all 7 tests green.

**Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All 310+ tests pass. No regressions.

**Step 6: Commit**

```bash
git add src/lib/shared/permissions.ts src/lib/shared/__tests__/permissions.test.ts
git commit -m "feat(rbac): add module permission constants and defaults

MODULE_PERMISSIONS defines 7 modules (DEALS, INVESTORS, etc.)
DEFAULT_PERMISSIONS maps FundMemberRole to default module access.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add `requireModuleAccess` and `getUserModulePermissions` to fund-access.ts

**Files:**
- Modify: `src/lib/shared/fund-access.ts` (add 2 new functions at end of file)
- Modify: `src/lib/shared/__tests__/fund-access.test.ts` (add new describe blocks)

**Step 1: Write the failing tests for `requireModuleAccess`**

Add to `src/lib/shared/__tests__/fund-access.test.ts`, at the end of the file (after the `getActiveFundWithCurrency` describe block):

```typescript
describe('requireModuleAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('grants access to SUPER_ADMIN without checking membership', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })

    await expect(requireModuleAccess('admin-1', 'fund-1', 'INVESTORS')).resolves.toBeUndefined()
    expect(mockPrisma.fundMember.findUnique).not.toHaveBeenCalled()
  })

  it('grants access to FUND_ADMIN without checking membership', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'FUND_ADMIN' })

    await expect(requireModuleAccess('admin-2', 'fund-1', 'DEALS')).resolves.toBeUndefined()
    expect(mockPrisma.fundMember.findUnique).not.toHaveBeenCalled()
  })

  it('grants access when user has active membership with correct permission', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ANALYST' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({
      isActive: true,
      permissions: ['DEALS', 'PORTFOLIO', 'REPORTS'],
    })

    await expect(requireModuleAccess('user-1', 'fund-1', 'DEALS')).resolves.toBeUndefined()
  })

  it('throws when user has active membership but missing permission', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ANALYST' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({
      isActive: true,
      permissions: ['DEALS', 'PORTFOLIO', 'REPORTS'],
    })

    await expect(requireModuleAccess('user-1', 'fund-1', 'INVESTORS'))
      .rejects.toThrow('Access denied: no INVESTORS permission')
  })

  it('throws when user has inactive membership', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ANALYST' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({
      isActive: false,
      permissions: ['DEALS'],
    })

    await expect(requireModuleAccess('user-1', 'fund-1', 'DEALS'))
      .rejects.toThrow('Access denied: no active membership')
  })

  it('throws when user has no membership at all', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ANALYST' })
    mockPrisma.fundMember.findUnique.mockResolvedValue(null)

    await expect(requireModuleAccess('user-1', 'fund-1', 'DEALS'))
      .rejects.toThrow('Access denied: no active membership')
  })
})

describe('getUserModulePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all modules for SUPER_ADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' })

    const result = await getUserModulePermissions('admin-1', 'fund-1')
    expect(result).toEqual(expect.arrayContaining([
      'DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM',
    ]))
    expect(result).toHaveLength(7)
  })

  it('returns all modules for FUND_ADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'FUND_ADMIN' })

    const result = await getUserModulePermissions('admin-2', 'fund-1')
    expect(result).toHaveLength(7)
  })

  it('returns permissions from FundMember for normal user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ANALYST' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({
      isActive: true,
      permissions: ['DEALS', 'PORTFOLIO', 'REPORTS'],
    })

    const result = await getUserModulePermissions('user-1', 'fund-1')
    expect(result).toEqual(['DEALS', 'PORTFOLIO', 'REPORTS'])
  })

  it('returns empty array for user with no membership', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ANALYST' })
    mockPrisma.fundMember.findUnique.mockResolvedValue(null)

    const result = await getUserModulePermissions('user-1', 'fund-1')
    expect(result).toEqual([])
  })

  it('returns empty array for user with inactive membership', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ANALYST' })
    mockPrisma.fundMember.findUnique.mockResolvedValue({
      isActive: false,
      permissions: ['DEALS', 'PORTFOLIO'],
    })

    const result = await getUserModulePermissions('user-1', 'fund-1')
    expect(result).toEqual([])
  })
})
```

Also update the import at line 25 of the test file to include the new functions:

```typescript
import { requireFundAccess, requireAuth, getAuthorizedFundId, getActiveFundWithCurrency, requireModuleAccess, getUserModulePermissions } from '../fund-access'
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/shared/__tests__/fund-access.test.ts
```

Expected: FAIL — `requireModuleAccess` and `getUserModulePermissions` are not exported from `../fund-access`.

**Step 3: Implement the two functions in fund-access.ts**

Add at the end of `src/lib/shared/fund-access.ts` (after line 139):

```typescript
import { MODULE_PERMISSIONS, type ModulePermission } from './permissions'

/**
 * Verifies the user has permission to access a specific module within the active fund.
 *
 * SUPER_ADMIN/FUND_ADMIN bypass permission checks (they see all modules),
 * but queries MUST still filter by fundId. The bypass is for permissions, not scope.
 */
export async function requireModuleAccess(
  userId: string,
  fundId: string,
  module: ModulePermission
): Promise<void> {
  if (await isAdminRole(userId)) {
    return
  }

  const membership = await prisma.fundMember.findUnique({
    where: { fundId_userId: { fundId, userId } },
    select: { isActive: true, permissions: true },
  })

  if (!membership?.isActive) {
    throw new Error('Access denied: no active membership in this fund')
  }

  if (!membership.permissions.includes(module)) {
    throw new Error(`Access denied: no ${module} permission in this fund`)
  }
}

/**
 * Returns the module permissions for a user in a specific fund.
 * Used by the sidebar to conditionally render navigation links.
 */
export async function getUserModulePermissions(
  userId: string,
  fundId: string
): Promise<string[]> {
  if (await isAdminRole(userId)) {
    return Object.values(MODULE_PERMISSIONS)
  }

  const membership = await prisma.fundMember.findUnique({
    where: { fundId_userId: { fundId, userId } },
    select: { permissions: true, isActive: true },
  })

  if (!membership?.isActive) return []
  return membership.permissions
}
```

**IMPORTANT:** The import for `MODULE_PERMISSIONS` must be added at the top of `fund-access.ts` with the other imports:

```typescript
import { MODULE_PERMISSIONS, type ModulePermission } from './permissions'
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/shared/__tests__/fund-access.test.ts
```

Expected: PASS — all existing tests + 11 new tests pass.

**Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/lib/shared/fund-access.ts src/lib/shared/__tests__/fund-access.test.ts
git commit -m "feat(rbac): add requireModuleAccess and getUserModulePermissions

requireModuleAccess throws if user lacks module permission in fund.
getUserModulePermissions returns user's allowed modules for sidebar.
Both functions bypass for SUPER_ADMIN/FUND_ADMIN.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add Fund Isolation to `getInvestors()`

**Files:**
- Modify: `src/lib/actions/investors.ts` — `getInvestors()` function (lines 140-198)

**Step 1: Modify `getInvestors()` to filter by active fund**

The current `getInvestors()` at line 140 returns ALL investors DB-wide. Change it to:

1. Move `getActiveFundWithCurrency()` call to the top (currently at line 176, after the query)
2. Extract `fundId` from the result (currently only uses `currency`)
3. Add `commitments: { some: { fundId, ...notDeleted } }` to the `where` clause
4. Scope the `include.commitments` to only return the active fund's commitments
5. Add `requireModuleAccess()` check

Replace the `getInvestors` function body (lines 140-198) with:

```typescript
export async function getInvestors(params?: PaginationParams): Promise<PaginatedResult<InvestorListItem>> {
    const session = await auth()
    if (!session?.user?.id) {
        return paginatedResult([], 0, 1, 25)
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) return paginatedResult([], 0, 1, 25)
    const { fundId, currency } = fundResult

    try {
        await requireModuleAccess(session.user.id, fundId, 'INVESTORS')
    } catch {
        return paginatedResult([], 0, 1, 25)
    }

    const { page, pageSize, skip, search } = parsePaginationParams(params)

    const where = {
        ...notDeleted,
        commitments: { some: { fundId, ...notDeleted } },
        ...(search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { contactName: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
    }

    const [investors, total] = await Promise.all([
        prisma.investor.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                commitments: {
                    where: { fundId, ...notDeleted },
                    select: {
                        committedAmount: true,
                    },
                },
            },
        }),
        prisma.investor.count({ where }),
    ])

    const data = investors.map((investor) => {
        const totalCommitted = investor.commitments.reduce(
            (sum, c) => sum + Number(c.committedAmount),
            0
        )
        return {
            id: investor.id,
            name: investor.name,
            type: INVESTOR_TYPE_DISPLAY[investor.type] || investor.type,
            status: INVESTOR_STATUS_DISPLAY[investor.status] || investor.status,
            email: investor.email,
            contactName: investor.contactName,
            totalCommitted: formatMoney(totalCommitted, currency),
            createdAt: investor.createdAt,
        }
    })

    return paginatedResult(data, total, page, pageSize)
}
```

**Step 2: Add the new import at the top of investors.ts**

Add to the imports section (around line 12):

```typescript
import { getActiveFundWithCurrency, requireModuleAccess } from '@/lib/shared/fund-access'
```

And remove the old `getActiveFundWithCurrency` import if it was standalone (line 12 currently imports it from `fund-access` already — just add `requireModuleAccess` to that import).

**Step 3: Run build to verify no TypeScript errors**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/actions/investors.ts
git commit -m "feat(isolation): filter getInvestors by active fund via Commitment

Adds fundId filter through commitments bridge table.
Adds requireModuleAccess INVESTORS check.
Only shows investors with commitment in the active fund.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add Fund Isolation to `getInvestor()` (detail page)

**Files:**
- Modify: `src/lib/actions/investors.ts` — `getInvestor()` function (lines 201-273)

**Step 1: Modify `getInvestor()` to verify fund access**

Replace the `getInvestor` function (lines 201-273) with:

```typescript
export async function getInvestor(id: string): Promise<InvestorDetail | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) return null
    const { fundId, currency } = fundResult

    try {
        await requireModuleAccess(session.user.id, fundId, 'INVESTORS')
    } catch {
        return null
    }

    try {
        const investor = await prisma.investor.findFirst({
            where: { id, ...notDeleted },
            include: {
                commitments: {
                    where: { ...notDeleted },
                    include: {
                        fund: {
                            select: { name: true },
                        },
                    },
                },
            },
        })

        if (!investor) {
            return null
        }

        // Verify investor has a commitment in the active fund
        const hasAccess = investor.commitments.some(c => c.fundId === fundId)
        if (!hasAccess) return null

        return {
            id: investor.id,
            name: investor.name,
            type: INVESTOR_TYPE_DISPLAY[investor.type] || investor.type,
            status: INVESTOR_STATUS_DISPLAY[investor.status] || investor.status,
            legalName: investor.legalName,
            taxId: investor.taxId,
            jurisdiction: investor.jurisdiction,
            email: investor.email,
            phone: investor.phone,
            address: investor.address,
            city: investor.city,
            state: investor.state,
            country: investor.country,
            postalCode: investor.postalCode,
            contactName: investor.contactName,
            contactEmail: investor.contactEmail,
            contactPhone: investor.contactPhone,
            contactTitle: investor.contactTitle,
            accreditedStatus: investor.accreditedStatus,
            kycStatus: investor.kycStatus,
            kycCompletedAt: investor.kycCompletedAt,
            amlStatus: investor.amlStatus,
            amlCompletedAt: investor.amlCompletedAt,
            investmentCapacity: formatMoney(investor.investmentCapacity, currency),
            notes: investor.notes,
            source: investor.source,
            createdAt: investor.createdAt,
            updatedAt: investor.updatedAt,
            commitments: investor.commitments.map((c) => ({
                id: c.id,
                fundId: c.fundId,
                fundName: c.fund.name,
                committedAmount: formatMoney(c.committedAmount, currency),
                calledAmount: formatMoney(c.calledAmount, currency),
                paidAmount: formatMoney(c.paidAmount, currency),
                status: c.status,
            })),
        }
    } catch (error) {
        console.error('getInvestor failed:', error)
        return null
    }
}
```

**Step 2: Run build**

```bash
npm run build
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/actions/investors.ts
git commit -m "feat(isolation): filter getInvestor by active fund commitment

Returns null if investor has no commitment in active fund.
Adds requireModuleAccess INVESTORS check.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Add Fund Isolation to `createInvestor()`

**Files:**
- Modify: `src/lib/actions/investors.ts` — `createInvestor()` function (lines 276-338)

**Step 1: Modify `createInvestor()` to auto-create Commitment**

Replace the `createInvestor` function (lines 276-338) with:

```typescript
export async function createInvestor(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) return { error: 'No active fund' }
    const { fundId } = fundResult

    try {
        await requireModuleAccess(session.user.id, fundId, 'INVESTORS')
    } catch {
        return { error: 'Access denied' }
    }

    const rawData = {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        status: formData.get('status') as string || 'Prospect',
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
        contactName: formData.get('contactName') as string || undefined,
        contactEmail: formData.get('contactEmail') as string || undefined,
        city: formData.get('city') as string || undefined,
        state: formData.get('state') as string || undefined,
        country: formData.get('country') as string || 'USA',
        notes: formData.get('notes') as string || undefined,
    }

    const validated = createInvestorSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data
    const dbType = DISPLAY_TO_TYPE[data.type] || 'INDIVIDUAL'
    const dbStatus = DISPLAY_TO_STATUS[data.status || 'Prospect'] || 'PROSPECT'

    try {
        const investor = await prisma.$transaction(async (tx) => {
            const inv = await tx.investor.create({
                data: {
                    name: data.name,
                    type: dbType as InvestorType,
                    status: dbStatus as InvestorStatus,
                    email: data.email || null,
                    phone: data.phone || null,
                    contactName: data.contactName || null,
                    contactEmail: data.contactEmail || null,
                    city: data.city || null,
                    state: data.state || null,
                    country: data.country || 'USA',
                    notes: data.notes || null,
                },
            })

            // Auto-create commitment in the active fund
            await tx.commitment.create({
                data: {
                    investorId: inv.id,
                    fundId,
                    committedAmount: 0,
                    calledAmount: 0,
                    paidAmount: 0,
                    distributedAmount: 0,
                    status: 'PENDING',
                },
            })

            return inv
        })

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'Investor',
            entityId: investor.id,
            changes: { fundId: { old: '', new: fundId } },
        })

        revalidatePath('/investors')
        redirect(`/investors/${investor.id}`)
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error creating investor:', error)
        return { error: 'Failed to create investor' }
    }
}
```

**Step 2: Add CommitmentStatus import**

Check if `CommitmentStatus` is already imported. If not, add it to the Prisma import at line 8:

```typescript
import { InvestorType, InvestorStatus, CommitmentStatus } from '@prisma/client'
```

Note: The `status: 'PENDING'` string literal works because Prisma accepts the enum value as string, but importing the enum is cleaner. Check if the existing code uses string literals or enum values for consistency.

**Step 3: Run build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/actions/investors.ts
git commit -m "feat(isolation): auto-create Commitment PENDING on investor creation

createInvestor now creates investor + Commitment in a transaction.
Commitment is PENDING with $0 amounts in the active fund.
Adds requireModuleAccess INVESTORS check.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Add Fund Isolation to `updateInvestor()` and `deleteInvestor()`

**Files:**
- Modify: `src/lib/actions/investors.ts` — `updateInvestor()` (lines 341-445) and `deleteInvestor()` (lines 612-645)

**Step 1: Add fund access check to `updateInvestor()`**

Add this block at the beginning of `updateInvestor()`, after the auth check (after line 345):

```typescript
    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) return { error: 'No active fund' }
    const { fundId } = fundResult

    try {
        await requireModuleAccess(session.user.id, fundId, 'INVESTORS')
    } catch {
        return { error: 'Access denied' }
    }

    // Verify investor belongs to the active fund
    const hasCommitment = await prisma.commitment.findFirst({
        where: { investorId: id, fundId, ...notDeleted },
    })
    if (!hasCommitment) return { error: 'Investor not found in this fund' }
```

**Step 2: Add fund access check to `deleteInvestor()`**

Add the same block at the beginning of `deleteInvestor()`, after the auth check:

```typescript
    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) return { error: 'No active fund' }
    const { fundId } = fundResult

    try {
        await requireModuleAccess(session.user.id, fundId, 'INVESTORS')
    } catch {
        return { error: 'Access denied' }
    }

    // Verify investor belongs to the active fund
    const hasCommitment = await prisma.commitment.findFirst({
        where: { investorId: id, fundId, ...notDeleted },
    })
    if (!hasCommitment) return { error: 'Investor not found in this fund' }
```

**Step 3: Run build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/actions/investors.ts
git commit -m "feat(isolation): add fund access checks to updateInvestor/deleteInvestor

Both functions now verify investor has commitment in active fund.
Adds requireModuleAccess INVESTORS check to both mutations.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Add Fund Isolation to `getInvestorsForExport()` and `getInvestorsForLinking()`

**Files:**
- Modify: `src/lib/actions/investors.ts` — `getInvestorsForExport()` (lines 562-609)
- Modify: `src/lib/actions/users.ts` — `getInvestorsForLinking()` (lines 435-446)

**Step 1: Modify `getInvestorsForExport()`**

Replace the function body to add fund scoping:

```typescript
export async function getInvestorsForExport(): Promise<{
    name: string
    type: string
    status: string
    email: string
    contactName: string
    contactEmail: string
    totalCommitted: string
    totalCalled: string
    totalPaid: string
    createdAt: string
}[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) return []
    const { fundId, currency } = fundResult

    try {
        await requireModuleAccess(session.user.id, fundId, 'INVESTORS')
    } catch {
        return []
    }

    const investors = await prisma.investor.findMany({
        where: {
            ...notDeleted,
            commitments: { some: { fundId, ...notDeleted } },
        },
        include: {
            commitments: {
                where: { fundId, ...notDeleted },
            },
        },
        orderBy: { name: 'asc' },
    })

    return investors.map(inv => {
        const totalCommitted = inv.commitments.reduce((sum, c) => sum + Number(c.committedAmount), 0)
        const totalCalled = inv.commitments.reduce((sum, c) => sum + Number(c.calledAmount), 0)
        const totalPaid = inv.commitments.reduce((sum, c) => sum + Number(c.paidAmount), 0)

        return {
            name: inv.name,
            type: INVESTOR_TYPE_DISPLAY[inv.type] || inv.type,
            status: INVESTOR_STATUS_DISPLAY[inv.status] || inv.status,
            email: inv.email || '',
            contactName: inv.contactName || '',
            contactEmail: inv.contactEmail || '',
            totalCommitted: formatMoney(totalCommitted, currency),
            totalCalled: formatMoney(totalCalled, currency),
            totalPaid: formatMoney(totalPaid, currency),
            createdAt: inv.createdAt.toISOString().split('T')[0],
        }
    })
}
```

**Step 2: Modify `getInvestorsForLinking()` in users.ts**

In `src/lib/actions/users.ts`, find `getInvestorsForLinking()` (line 435) and add fund scoping:

```typescript
export async function getInvestorsForLinking(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const fundResult = await getActiveFundWithCurrency(session.user.id)
    if (!fundResult) return []
    const { fundId } = fundResult

    const investors = await prisma.investor.findMany({
        where: {
            userId: null,
            deletedAt: null,
            commitments: { some: { fundId } },
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })

    return investors
}
```

Add the import at the top of `users.ts`:

```typescript
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'
```

**Step 3: Run build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/actions/investors.ts src/lib/actions/users.ts
git commit -m "feat(isolation): scope getInvestorsForExport and getInvestorsForLinking by fund

Export only includes investors with commitment in active fund.
Linking only shows unlinked investors in the active fund.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Sidebar — Conditional Navigation by Permissions

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx` (lines 30-70)
- Modify: `src/components/layout/sidebar.tsx` (entire file)

**Step 1: Load permissions in layout.tsx**

In `src/app/(dashboard)/layout.tsx`, add the import:

```typescript
import { getUserModulePermissions } from '@/lib/shared/fund-access';
```

Then modify the `Promise.all` block (line 30-34) to also load permissions:

```typescript
    const [unreadCount, funds, activeFundId] = await Promise.all([
        getUnreadCount(),
        getUserFunds(session.user.id!),
        getActiveFundId(),
    ]);

    const permissions = activeFundId
        ? await getUserModulePermissions(session.user.id!, activeFundId ?? funds[0]?.id ?? '')
        : []
```

Then pass `permissions` to `Sidebar` (line 66-70):

```typescript
                <Sidebar
                    userRole={session?.user?.role as string | undefined}
                    funds={funds}
                    activeFundId={activeFundId ?? funds[0]?.id ?? ''}
                    permissions={permissions}
                />
```

**Step 2: Modify sidebar.tsx to accept and use permissions**

In `src/components/layout/sidebar.tsx`:

First, update the `navigation` array to include a `permission` field:

```typescript
const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Deals', href: '/deals', icon: Briefcase, permission: 'DEALS' },
    { name: 'Investors', href: '/investors', icon: Users, permission: 'INVESTORS' },
    { name: 'Portfolio', href: '/portfolio', icon: Building2, permission: 'PORTFOLIO' },
    { name: 'Capital', href: '/capital', icon: Banknote, permission: 'CAPITAL' },
    { name: 'Reports', href: '/reports', icon: FileText, permission: 'REPORTS' },
];
```

Update the `SidebarProps` interface:

```typescript
interface SidebarProps {
    userRole?: string;
    funds: FundSummary[];
    activeFundId: string;
    permissions: string[];
}
```

Update the function signature:

```typescript
export function Sidebar({ userRole, funds, activeFundId, permissions }: SidebarProps) {
```

In the `<nav>` section, filter navigation items by permission:

```typescript
                {navigation
                    .filter((item) => !item.permission || permissions.includes(item.permission))
                    .map((item) => {
```

For the Admin/Team section (currently line 77-101), change the visibility check:

```typescript
                {/* Admin section — visible if user has TEAM permission or is admin */}
                {(isAdmin || permissions.includes('TEAM')) && (
```

For the Settings section (currently line 103-114), add permission check:

```typescript
            {(isAdmin || permissions.includes('SETTINGS')) && (
            <div className="border-t border-border p-3">
                <Link
                    href="/settings"
                    className={cn(
                        'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground',
                        pathname?.startsWith('/settings') && 'bg-primary/10 text-primary'
                    )}
                >
                    <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                    Settings
                </Link>
            </div>
            )}
```

**Step 3: Run build**

```bash
npm run build
```

Expected: PASS

**Step 4: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/(dashboard)/layout.tsx src/components/layout/sidebar.tsx
git commit -m "feat(rbac): sidebar hides modules based on user permissions

Layout loads permissions via getUserModulePermissions.
Sidebar filters nav items — only shows modules user can access.
Dashboard always visible. Settings/Team conditional on permissions.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Update Seed Data

**Files:**
- Modify: `prisma/seed.ts` (lines 76-84)

**Step 1: Add permissions to the FundMember creation in seed**

Find the FundMember creation block (line 76-84) and add `permissions`:

```typescript
    if (!existingMember) {
        await prisma.fundMember.create({
            data: {
                fundId: fund.id,
                userId: user.id,
                role: 'PRINCIPAL',
                permissions: ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'],
                isActive: true,
            },
        })
        console.log('FundMember created for:', user.email)
    }
```

**Step 2: Add Commitment for investors that don't have one**

Find the investor creation loop (lines 307-345). Currently, only ACTIVE and COMMITTED investors get a commitment. After this change, ALL investors should get a commitment (because without one, they won't appear in the fund). Add a `PENDING` commitment for others.

After the existing commitment creation block (around line 341), add:

```typescript
            // Create PENDING commitment for investors without one
            if (investorData.status !== InvestorStatus.ACTIVE && investorData.status !== InvestorStatus.COMMITTED) {
                await prisma.commitment.create({
                    data: {
                        investorId: investor.id,
                        fundId: fund.id,
                        committedAmount: 0,
                        calledAmount: 0,
                        paidAmount: 0,
                        distributedAmount: 0,
                        status: CommitmentStatus.PENDING,
                    },
                })
                console.log('PENDING Commitment created for:', investor.name)
            }
```

**Step 3: Run build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): add permissions to FundMember and PENDING commitments

Admin FundMember gets full permissions array.
All seeded investors get a commitment (PENDING for prospects).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Investor Isolation Integration Tests

**Files:**
- Create: `src/lib/actions/__tests__/investor-isolation.test.ts`

**Step 1: Write the integration tests**

Create `src/lib/actions/__tests__/investor-isolation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    investor: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    commitment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    fundMember: { findUnique: vi.fn() },
    fund: { findFirst: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/shared/active-fund', () => ({
  getActiveFundId: vi.fn(),
  setActiveFundId: vi.fn(),
}))

vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getActiveFundId } from '@/lib/shared/active-fund'
import { getInvestors, getInvestor } from '../investors'

const mockPrisma = prisma as unknown as {
  investor: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  commitment: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  user: { findUnique: ReturnType<typeof vi.fn> }
  fundMember: { findUnique: ReturnType<typeof vi.fn> }
  fund: { findFirst: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetActiveFundId = getActiveFundId as ReturnType<typeof vi.fn>

function setupAuthenticatedUser(role: string = 'ANALYST', permissions: string[] = ['INVESTORS']) {
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
  mockGetActiveFundId.mockResolvedValue('fund-1')
  // getActiveFundWithCurrency calls getAuthorizedFundId which calls getActiveFundId
  mockPrisma.user.findUnique.mockResolvedValue({ role })
  mockPrisma.fund.findUnique
    .mockResolvedValueOnce({ id: 'fund-1' }) // cookie validation in getAuthorizedFundId
    .mockResolvedValueOnce({ currency: 'USD' }) // currency lookup in getActiveFundWithCurrency
  mockPrisma.fundMember.findUnique.mockResolvedValue({
    isActive: true,
    permissions,
  })
}

describe('Investor Fund Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getInvestors', () => {
    it('only returns investors with commitment in active fund', async () => {
      setupAuthenticatedUser()

      const mockInvestors = [
        {
          id: 'inv-1',
          name: 'Fund 1 Investor',
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          email: 'inv1@test.com',
          contactName: null,
          createdAt: new Date(),
          commitments: [{ committedAmount: 100000 }],
        },
      ]

      mockPrisma.investor.findMany.mockResolvedValue(mockInvestors)
      mockPrisma.investor.count.mockResolvedValue(1)

      const result = await getInvestors()

      // Verify the where clause includes fund filtering
      const findManyCall = mockPrisma.investor.findMany.mock.calls[0][0]
      expect(findManyCall.where).toHaveProperty('commitments')
      expect(findManyCall.where.commitments).toHaveProperty('some')
      expect(findManyCall.where.commitments.some).toHaveProperty('fundId', 'fund-1')

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Fund 1 Investor')
    })

    it('returns empty when user lacks INVESTORS permission', async () => {
      setupAuthenticatedUser('ANALYST', ['DEALS', 'PORTFOLIO'])

      const result = await getInvestors()
      expect(result.data).toHaveLength(0)
      expect(mockPrisma.investor.findMany).not.toHaveBeenCalled()
    })
  })

  describe('getInvestor', () => {
    it('returns null if investor has no commitment in active fund', async () => {
      setupAuthenticatedUser()

      mockPrisma.investor.findFirst.mockResolvedValue({
        id: 'inv-1',
        name: 'Other Fund Investor',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        commitments: [
          { fundId: 'fund-2', committedAmount: 50000, fund: { name: 'Other Fund' } },
        ],
        // all other fields...
        legalName: null, taxId: null, jurisdiction: null,
        email: null, phone: null, address: null,
        city: null, state: null, country: 'USA', postalCode: null,
        contactName: null, contactEmail: null, contactPhone: null, contactTitle: null,
        accreditedStatus: null, kycStatus: 'PENDING', kycCompletedAt: null,
        amlStatus: 'PENDING', amlCompletedAt: null,
        investmentCapacity: null, notes: null, source: null,
        createdAt: new Date(), updatedAt: new Date(),
      })

      const result = await getInvestor('inv-1')
      expect(result).toBeNull()
    })
  })
})
```

**Step 2: Run the tests**

```bash
npx vitest run src/lib/actions/__tests__/investor-isolation.test.ts
```

Expected: PASS

**Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass (310+ existing + new tests).

**Step 4: Commit**

```bash
git add src/lib/actions/__tests__/investor-isolation.test.ts
git commit -m "test(isolation): add investor fund isolation integration tests

Tests verify fund filtering via commitments and permission checks.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: UI — Fix Hardcoded `$` in Investor Overview

**Files:**
- Modify: `src/lib/shared/formatters.ts` — export `getCurrencySymbol()` helper
- Modify: `src/app/(dashboard)/investors/[id]/page.tsx` — pass `currencySymbol` to InvestorOverview
- Modify: `src/components/investors/investor-overview.tsx` — replace hardcoded `prefix="$"` with prop

**Step 1: Add `getCurrencySymbol` to formatters.ts**

Add after the `CURRENCY_CONFIG` declaration (around line 22):

```typescript
/**
 * Returns the currency symbol for a given currency code.
 * Useful for UI components that need the raw symbol (e.g., input prefixes).
 */
export function getCurrencySymbol(currency: CurrencyCode = 'USD'): string {
  return CURRENCY_CONFIG[currency].symbol
}
```

**Step 2: Pass `currencySymbol` to InvestorOverview in the detail page**

In `src/app/(dashboard)/investors/[id]/page.tsx`, find where `<InvestorOverview>` is rendered (around line 149).

Add the import:
```typescript
import { getCurrencySymbol } from '@/lib/shared/formatters';
```

Derive the symbol from the currency already available on the page:
```typescript
const currencySymbol = getCurrencySymbol(currency)
```

Pass it as prop:
```typescript
<InvestorOverview investor={investor} userRole={userRole} currencySymbol={currencySymbol} />
```

**Step 3: Update InvestorOverview to accept and use currencySymbol**

In `src/components/investors/investor-overview.tsx`:

Add to the `InvestorOverviewProps` interface:
```typescript
interface InvestorOverviewProps {
    investor: { /* ... existing fields ... */ };
    userRole?: string;
    currencySymbol?: string;  // ← NEW
}
```

Update the function signature:
```typescript
export function InvestorOverview({ investor, userRole, currencySymbol = '$' }: InvestorOverviewProps) {
```

Replace line 470:
```typescript
// BEFORE:
prefix="$"

// AFTER:
prefix={currencySymbol}
```

**Step 4: Run build**

```bash
npm run build
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/shared/formatters.ts src/app/(dashboard)/investors/[id]/page.tsx src/components/investors/investor-overview.tsx
git commit -m "fix(ui): use fund currency symbol instead of hardcoded $ in investor overview

Adds getCurrencySymbol() helper to formatters.
Passes currencySymbol prop from detail page to InvestorOverview.
Investment Capacity field now shows correct symbol (€, £, $).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: UI — Currency Context in Add Commitment Dialog

**Files:**
- Modify: `src/components/investors/add-commitment-button.tsx`
- Modify: `src/lib/actions/commitments.ts` — `getFundsForCommitment()` to return currency

**Step 1: Update `getFundsForCommitment()` to return currency**

In `src/lib/actions/commitments.ts`, find `getFundsForCommitment()` and add `currency` to the select and return type:

```typescript
// Find getFundsForCommitment and update to return currency
export async function getFundsForCommitment(): Promise<{ id: string; name: string; currency: string }[]> {
    // ... existing auth check ...
    const funds = await prisma.fund.findMany({
        select: { id: true, name: true, currency: true },
        orderBy: { name: 'asc' },
    })
    return funds.map(f => ({ id: f.id, name: f.name, currency: f.currency }))
}
```

**Step 2: Update AddCommitmentButton to show currency symbol**

In `src/components/investors/add-commitment-button.tsx`:

Update the `funds` state type:
```typescript
const [funds, setFunds] = useState<{ id: string; name: string; currency: string }[]>([]);
```

Add a derived currency symbol:
```typescript
const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }
const selectedFund = funds.find(f => f.id === fundId)
const currencySymbol = selectedFund ? (CURRENCY_SYMBOLS[selectedFund.currency] || '$') : '$'
```

Update the amount input to show the currency symbol (around line 122-128):
```typescript
<div className="space-y-2">
    <label className="text-sm text-[#94A3B8]">Committed Amount *</label>
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-mono">
            {currencySymbol}
        </span>
        <Input
            value={committedAmount}
            onChange={(e) => setCommittedAmount(e.target.value)}
            placeholder="1,000,000"
            className="bg-[#11141D] border-[#334155] text-[#F8FAFC] focus-visible:ring-[#3E5CFF] pl-7 font-mono tabular-nums"
        />
    </div>
</div>
```

**Step 3: Run build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/investors/add-commitment-button.tsx src/lib/actions/commitments.ts
git commit -m "fix(ui): show currency symbol in Add Commitment dialog

Amount input now shows the selected fund's currency symbol.
getFundsForCommitment returns currency for each fund.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 14: Final Verification

**Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: ALL tests pass.

**Step 2: Run build**

```bash
npm run build
```

Expected: PASS with zero errors.

**Step 3: Run lint**

```bash
npm run lint
```

Expected: PASS.

**Step 4: Verify no TypeScript `any` types or `@ts-ignore` were introduced**

```bash
grep -rn "any\b" src/lib/shared/permissions.ts src/lib/shared/fund-access.ts || echo "No any types"
grep -rn "@ts-ignore" src/lib/shared/permissions.ts src/lib/shared/fund-access.ts || echo "No ts-ignore"
```

Expected: Clean.

**Step 5: Final commit (if any remaining changes)**

Only if there are unstaged changes from fixes during verification:

```bash
git status
```

---

## Post-Implementation: Production Deployment

**Not part of this plan — do manually:**

1. SSH to EC2: `ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121`
2. Connect to RDS and run `prisma/production-migration-rbac.sql`
3. Push to `main` → GitHub Actions → Docker build → ECR → EC2
4. Verify: login as admin → see all modules → switch fund → investors change

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | MODIFY | Add `permissions String[]` to FundMember |
| `prisma/production-migration-rbac.sql` | CREATE | ALTER TABLE + backfill SQL |
| `prisma/seed.ts` | MODIFY | Add permissions + PENDING commitments |
| `src/lib/shared/permissions.ts` | CREATE | Module constants + defaults |
| `src/lib/shared/__tests__/permissions.test.ts` | CREATE | 7 tests for constants |
| `src/lib/shared/fund-access.ts` | MODIFY | +2 functions (requireModuleAccess, getUserModulePermissions) |
| `src/lib/shared/__tests__/fund-access.test.ts` | MODIFY | +11 tests for new functions |
| `src/lib/actions/investors.ts` | MODIFY | 6 functions scoped by fund + RBAC |
| `src/lib/actions/users.ts` | MODIFY | getInvestorsForLinking scoped by fund |
| `src/app/(dashboard)/layout.tsx` | MODIFY | Load + pass permissions to Sidebar |
| `src/components/layout/sidebar.tsx` | MODIFY | Filter nav items by permissions |
| `src/lib/shared/formatters.ts` | MODIFY | Export `getCurrencySymbol()` helper |
| `src/app/(dashboard)/investors/[id]/page.tsx` | MODIFY | Pass `currencySymbol` to InvestorOverview |
| `src/components/investors/investor-overview.tsx` | MODIFY | Replace hardcoded `prefix="$"` with prop |
| `src/components/investors/add-commitment-button.tsx` | MODIFY | Show currency symbol in amount input |
| `src/lib/actions/commitments.ts` | MODIFY | Return currency from `getFundsForCommitment()` |
| `src/lib/actions/__tests__/investor-isolation.test.ts` | CREATE | Integration tests |
