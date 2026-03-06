# Fix createUser() Orphan Bug + Data Cleanup

> **For Claude Code:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Fix the admin panel's `createUser()` so new users get proper `organizationId` and `FundMember` records, making them visible to the RBAC fund isolation system.

**Architecture:** Three code fixes (createUser transaction, acceptInvitation org linkage, layout cookie gap, FUND_ADMIN null-org guard) plus a production data cleanup (delete all test users).

**Tech Stack:** Next.js 15, Prisma, TypeScript strict, Vitest

---

## Context

Two user creation paths exist in BlackGem:

1. **Onboarding wizard** (`src/lib/actions/onboarding.ts:126-183`) — Creates Organization + User + Fund + FundMember atomically in `prisma.$transaction`. Works correctly.

2. **Admin panel** (`src/lib/actions/users.ts:224-292`) — Does a naked `prisma.user.create()` with no `organizationId`, no `FundMember` record, no transaction. **Broken.**

Users created via admin panel can log in but see zero data. The RBAC system (PR #75) is working correctly — it's the user creation that fails to produce the linkage records the RBAC system needs.

---

## Task 1: Fix `createUser()` in users.ts

**Files:**
- Modify: `src/lib/actions/users.ts:224-292`

**Step 1: Write the failing test**

Create `src/lib/actions/__tests__/create-user-fund-linkage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    fundMember: { create: vi.fn() },
    investor: { update: vi.fn() },
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
  redirect: vi.fn().mockImplementation(() => { throw new Error('NEXT_REDIRECT') }),
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed') },
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getActiveFundId } from '@/lib/shared/active-fund'

const mockPrisma = prisma as any
const mockAuth = auth as ReturnType<typeof vi.fn>
const mockGetActiveFundId = getActiveFundId as ReturnType<typeof vi.fn>

describe('createUser — fund linkage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates user with organizationId and FundMember in a transaction', async () => {
    // Caller is FUND_ADMIN with org
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'FUND_ADMIN' },
    })

    // Caller's org lookup
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ role: 'FUND_ADMIN', organizationId: 'org-1' }) // caller lookup
      .mockResolvedValueOnce(null) // email uniqueness check

    // Active fund resolution
    mockGetActiveFundId.mockResolvedValue('fund-1')
    // For getActiveFundWithCurrency → getAuthorizedFundId chain
    mockPrisma.fundMember.findFirst = vi.fn().mockResolvedValue({ fundId: 'fund-1' })
    mockPrisma.fund = {
      ...mockPrisma.fund,
      findUnique: vi.fn().mockResolvedValue({ id: 'fund-1', currency: 'USD', organizationId: 'org-1' }),
      findFirst: vi.fn().mockResolvedValue({ id: 'fund-1' }),
    }
    mockPrisma.fundMember.findUnique = vi.fn().mockResolvedValue({ isActive: true })

    // Transaction captures the callback
    let txCallback: any
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      txCallback = cb
      return cb({
        user: {
          create: vi.fn().mockResolvedValue({ id: 'new-user-1' }),
        },
        fundMember: {
          create: vi.fn().mockResolvedValue({ id: 'fm-1' }),
        },
        investor: {
          update: vi.fn(),
        },
      })
    })

    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'test@example.com')
    formData.set('role', 'Investment Manager')
    formData.set('password', 'securepassword123')

    const { createUser } = await import('../users')

    // Should not throw (redirect throws NEXT_REDIRECT which is caught)
    try {
      await createUser(formData)
    } catch (e: any) {
      // redirect throws — expected
      if (e.message !== 'NEXT_REDIRECT') throw e
    }

    // Verify transaction was called
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('returns error when caller has no organizationId', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'FUND_ADMIN' },
    })

    // Caller with null org
    mockPrisma.user.findUnique.mockResolvedValue({
      role: 'FUND_ADMIN',
      organizationId: null,
    })

    const formData = new FormData()
    formData.set('name', 'Test User')
    formData.set('email', 'test@example.com')
    formData.set('role', 'Investment Manager')
    formData.set('password', 'securepassword123')

    const { createUser } = await import('../users')
    const result = await createUser(formData)

    expect(result).toEqual({ error: expect.stringContaining('no organization') })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/actions/__tests__/create-user-fund-linkage.test.ts`
Expected: FAIL — current `createUser` has no transaction or org linkage.

**Step 3: Implement the fix**

Replace `createUser()` in `src/lib/actions/users.ts` (lines 224-292) with:

```typescript
export async function createUser(formData: FormData) {
    let session
    try {
        session = await requireAdmin()
    } catch {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
        password: formData.get('password') as string,
        investorId: (formData.get('investorId') as string) || undefined,
    }

    const validated = createUserSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data
    const dbRole = (DISPLAY_TO_ROLE[data.role] || 'ANALYST') as UserRole

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    })
    if (existingUser) {
        return { error: 'A user with this email already exists' }
    }

    // Resolve caller's organization
    const caller = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true },
    })
    if (!caller?.organizationId) {
        return { error: 'Cannot create user: your account has no organization' }
    }

    // Resolve caller's active fund (needed for FundMember creation)
    const fundResult = await getActiveFundWithCurrency(session.user.id!)
    if (!fundResult) {
        return { error: 'Cannot create user: no active fund' }
    }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await prisma.$transaction(async (tx) => {
            // 1. Create user with organization linkage
            const newUser = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    role: dbRole,
                    passwordHash: hashedPassword,
                    organizationId: caller.organizationId,
                },
            })

            // 2. Create FundMember if role allows it (LP/Auditor roles don't get fund membership)
            if (canBecomeFundMember(dbRole)) {
                const allowedRoles = ALLOWED_FUND_ROLES[dbRole]
                const fundMemberRole = allowedRoles[0] // Highest privilege allowed for this role

                await tx.fundMember.create({
                    data: {
                        userId: newUser.id,
                        fundId: fundResult.fundId,
                        role: fundMemberRole as any,
                        permissions: DEFAULT_PERMISSIONS[fundMemberRole] || DEFAULT_PERMISSIONS['ANALYST'],
                        isActive: true,
                    },
                })
            }

            // 3. Link to investor record if provided (LP roles)
            if (data.investorId) {
                await tx.investor.update({
                    where: { id: data.investorId },
                    data: { userId: newUser.id },
                })
            }

            return newUser
        })

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'User',
            entityId: user.id,
            changes: {
                organizationId: { old: null, new: caller.organizationId },
                fundId: { old: null, new: fundResult.fundId },
            },
        })

        revalidatePath('/admin/users')
        redirect(`/admin/users/${user.id}`)
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error creating user:', error)
        return { error: 'Failed to create user' }
    }
}
```

**Step 4: Add required imports** at the top of users.ts (if not already present):

```typescript
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access'
import { canBecomeFundMember, ALLOWED_FUND_ROLES, DEFAULT_PERMISSIONS } from '@/lib/shared/permissions'
```

Note: `getActiveFundWithCurrency` is already imported (line 12). Add `canBecomeFundMember`, `ALLOWED_FUND_ROLES`, `DEFAULT_PERMISSIONS` from permissions.

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/actions/__tests__/create-user-fund-linkage.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/actions/users.ts src/lib/actions/__tests__/create-user-fund-linkage.test.ts
git commit -m "fix(users): createUser now links org + fund atomically"
```

---

## Task 2: Fix `acceptInvitation()` in users.ts

**Files:**
- Modify: `src/lib/actions/users.ts:612-694`

**Step 1: Write the failing test**

Add to the existing test file `src/lib/actions/__tests__/create-user-fund-linkage.test.ts`:

```typescript
describe('acceptInvitation — org linkage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets organizationId from investor commitment chain', async () => {
    // Valid token
    mockPrisma.verificationToken = {
      findUnique: vi.fn().mockResolvedValue({
        token: 'valid-token',
        identifier: 'invite:lp@example.com:investor-1:LP_PRIMARY',
        expires: new Date(Date.now() + 86400000),
      }),
      delete: vi.fn(),
    }

    // No existing user with this email
    mockPrisma.user.findUnique.mockResolvedValue(null)

    // Commitment → fund → org chain
    mockPrisma.commitment = {
      findFirst: vi.fn().mockResolvedValue({
        fund: { organizationId: 'org-1' },
      }),
    }

    let createdUserData: any
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        user: {
          create: vi.fn().mockImplementation((args: any) => {
            createdUserData = args.data
            return { id: 'new-lp-1' }
          }),
        },
        investor: { update: vi.fn() },
        verificationToken: { delete: vi.fn() },
      })
    })

    const { acceptInvitation } = await import('../users')
    await acceptInvitation('valid-token', 'LP User', 'securepassword123')

    // Verify organizationId was set
    expect(createdUserData.organizationId).toBe('org-1')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/actions/__tests__/create-user-fund-linkage.test.ts`
Expected: FAIL — current `acceptInvitation` doesn't set organizationId.

**Step 3: Implement the fix**

In `acceptInvitation()`, add org resolution before the transaction and include `organizationId` in user creation.

After line 645 (`const role = (parts[3] || 'LP_PRIMARY') as UserRole`) and before the email uniqueness check, add:

```typescript
    // Resolve organization from investor's fund commitment
    let organizationId: string | null = null
    const commitment = await prisma.commitment.findFirst({
        where: { investorId, ...notDeleted },
        select: { fund: { select: { organizationId: true } } },
    })
    if (commitment?.fund?.organizationId) {
        organizationId = commitment.fund.organizationId
    }
```

Then in the `tx.user.create()` call (line 659-667), add `organizationId`:

```typescript
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    role,
                    passwordHash: hashedPassword,
                    emailVerified: new Date(),
                    organizationId,  // ← ADD THIS
                },
            })
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/actions/__tests__/create-user-fund-linkage.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/actions/users.ts src/lib/actions/__tests__/create-user-fund-linkage.test.ts
git commit -m "fix(users): acceptInvitation sets organizationId from commitment chain"
```

---

## Task 3: Fix layout cookie gap

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx:37-44`

**Step 1: Understand the current code**

Currently at lines 37-44:
```typescript
const [unreadCount, funds, activeFundId] = await Promise.all([
    getUnreadCount(),
    getUserFunds(session.user.id!),
    getActiveFundId(),
]);

// Resolve fund ID: cookie → first fund from membership → empty
const resolvedFundId = activeFundId ?? funds[0]?.id ?? '';
```

Problem: When `activeFundId` is null (no cookie) but `funds[0]` exists (user has fund access via getUserFunds), the layout uses `funds[0].id` for rendering BUT never sets the cookie. Downstream server actions that call `getActiveFundWithCurrency()` → `getAuthorizedFundId()` will fail to find the cookie and must re-resolve from scratch on every request.

**Step 2: Add cookie initialization**

Add `setActiveFundId` import at the top:

```typescript
import { getActiveFundId, setActiveFundId } from '@/lib/shared/active-fund';
```

Then after line 44 (`const resolvedFundId = ...`), add:

```typescript
    // Ensure cookie is set for downstream server actions
    if (!activeFundId && resolvedFundId) {
        await setActiveFundId(resolvedFundId);
    }
```

**Step 3: Run build to verify**

Run: `npm run build`
Expected: Zero errors

**Step 4: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "fix(layout): set active fund cookie when resolved from membership fallback"
```

---

## Task 4: Fix FUND_ADMIN null-org guard in fund-access.ts

**Files:**
- Modify: `src/lib/shared/fund-access.ts:184`

**Step 1: Understand the current code**

At line 184:
```typescript
} else if (isFundAdmin && userOrgId) {
```

Problem: FUND_ADMIN with `organizationId: null` (pre-migration or improperly created) is blocked from the admin fallback. All resolution steps fail, returning null.

**Step 2: Relax the guard with explicit tech debt marker**

Replace lines 184-194:

```typescript
    } else if (isFundAdmin) {
      // TODO(multi-org): Remove global fund fallback — security risk in multi-tenant.
      // A FUND_ADMIN with null organizationId can see any fund globally here.
      // Safe in single-tenant; must be removed before multi-org launch.
      const fund = await prisma.fund.findFirst({
        where: userOrgId ? { organizationId: userOrgId } : {},
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      if (fund) {
        await setActiveFundId(fund.id)
        return fund.id
      }
    }
```

**Step 3: Update the existing test**

Check `src/lib/shared/__tests__/fund-access.test.ts` for any test that asserts the old behavior (FUND_ADMIN + null org → returns null). Update it to expect the new fallback behavior.

**Step 4: Run tests to verify**

Run: `npx vitest run src/lib/shared/__tests__/fund-access.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/shared/fund-access.ts src/lib/shared/__tests__/fund-access.test.ts
git commit -m "fix(auth): FUND_ADMIN with null org falls back to any fund (single-tenant)"
```

---

## Task 5: Build, Lint, Full Test Suite

**Step 1: Run all verification**

```bash
npm run build         # Zero errors
npm run lint          # Zero warnings
npx vitest run        # ALL tests pass (baseline + new tests)
```

All three must pass before proceeding.

**Step 2: Commit any lint fixes if needed**

---

## Task 6: Commit, Push, Create PR

**Modified files:**
1. `src/lib/actions/users.ts` — `createUser()` + `acceptInvitation()` fixes
2. `src/lib/shared/fund-access.ts` — FUND_ADMIN null-org guard
3. `src/app/(dashboard)/layout.tsx` — Cookie gap fix

**Created files:**
1. `src/lib/actions/__tests__/create-user-fund-linkage.test.ts`

**Commit message (final squash):**

```
fix(users): createUser() now links org + fund atomically

- createUser() wraps in $transaction with organizationId + FundMember
- acceptInvitation() sets organizationId from investor commitment chain
- Layout sets active fund cookie when resolved from membership fallback
- FUND_ADMIN with null org can still resolve a fund (single-tenant escape hatch)

Previously, admin-created users had no org or fund linkage,
making them invisible to the entire RBAC system.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 7: Production Data Cleanup (POST-DEPLOY ONLY)

> **Sequence:** merge PR → deploy → verify deployment is green → cleanup prod data → re-onboard.
> Do NOT run this before the deploy is confirmed. If the deploy fails or rolls back,
> you'd be in an inconsistent state with no users and no fix.

All current users are test data. Clean-slate reset.

```bash
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
DB_URL=$(grep '^DATABASE_URL=' /opt/blackgem/.env | cut -d= -f2-)

# First, list all users to confirm they're test data
docker run --rm -e DATABASE_URL="$DB_URL" postgres:15-alpine sh -c \
  'psql "$DATABASE_URL" -c "SELECT id, email, name, role, \"organizationId\" FROM \"User\" ORDER BY \"createdAt\";"'

# Delete all users (CASCADE will handle FundMember, Notification, etc.)
# Keep the founding user created via onboarding if needed — adjust WHERE
docker run --rm -e DATABASE_URL="$DB_URL" postgres:15-alpine sh -c \
  'psql "$DATABASE_URL" -c "DELETE FROM \"User\" WHERE true;"'

# Verify clean state
docker run --rm -e DATABASE_URL="$DB_URL" postgres:15-alpine sh -c \
  'psql "$DATABASE_URL" -c "SELECT count(*) FROM \"User\";"'
```

Then re-onboard via the onboarding wizard to create a properly linked admin user.

---

## Post-Deploy Verification

1. Create a new account via onboarding wizard → verify org + fund + FundMember created
2. Log in as the FUND_ADMIN → navigate to Team → Add User
3. Create an Investment Manager user
4. Verify in DB: new user has `organizationId`, has `FundMember` record with `CO_PRINCIPAL` role
5. Log in as the new user → verify Deals page shows deals
6. Verify sidebar fund dropdown shows the correct fund
