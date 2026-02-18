# Role Hierarchy Validation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent invalid UserRole ↔ FundMemberRole combinations by adding a validation layer and fixing existing bad data.

**Architecture:** Pure validation function in `permissions.ts`, called from every FundMember mutation. Hierarchy map defines which system roles can hold which fund roles. Production migration downgrades existing violations.

**Tech Stack:** TypeScript, Prisma enums, Vitest, PostgreSQL (raw SQL migration)

---

### Task 1: Add role hierarchy constants and validation function

**Files:**
- Modify: `src/lib/shared/permissions.ts` (append after line 26)
- Modify: `src/lib/shared/__tests__/permissions.test.ts` (append new describe blocks)

**Step 1: Write the failing tests**

Add to `src/lib/shared/__tests__/permissions.test.ts`:

```typescript
import {
  MODULE_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  ALLOWED_FUND_ROLES,
  validateFundMemberRole,
  canBecomeFundMember,
  type ModulePermission,
} from '../permissions'

// ... existing tests stay ...

describe('ALLOWED_FUND_ROLES', () => {
  it('allows SUPER_ADMIN any fund role', () => {
    expect(ALLOWED_FUND_ROLES.SUPER_ADMIN).toEqual(
      expect.arrayContaining(['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST'])
    )
  })

  it('allows FUND_ADMIN any fund role', () => {
    expect(ALLOWED_FUND_ROLES.FUND_ADMIN).toEqual(ALLOWED_FUND_ROLES.SUPER_ADMIN)
  })

  it('limits INVESTMENT_MANAGER to CO_PRINCIPAL and below', () => {
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).toContain('CO_PRINCIPAL')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).toContain('ADVISOR')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).toContain('ANALYST')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).not.toContain('PRINCIPAL')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).not.toContain('ADMIN')
  })

  it('limits ANALYST to ADVISOR and ANALYST only', () => {
    expect(ALLOWED_FUND_ROLES.ANALYST).toContain('ADVISOR')
    expect(ALLOWED_FUND_ROLES.ANALYST).toContain('ANALYST')
    expect(ALLOWED_FUND_ROLES.ANALYST).not.toContain('PRINCIPAL')
    expect(ALLOWED_FUND_ROLES.ANALYST).not.toContain('ADMIN')
    expect(ALLOWED_FUND_ROLES.ANALYST).not.toContain('CO_PRINCIPAL')
  })

  it('does not allow LP_PRIMARY to be a fund member', () => {
    expect(ALLOWED_FUND_ROLES.LP_PRIMARY).toEqual([])
  })

  it('does not allow LP_VIEWER to be a fund member', () => {
    expect(ALLOWED_FUND_ROLES.LP_VIEWER).toEqual([])
  })

  it('does not allow AUDITOR to be a fund member', () => {
    expect(ALLOWED_FUND_ROLES.AUDITOR).toEqual([])
  })

  it('covers all UserRole values', () => {
    const expectedRoles = [
      'SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER',
      'ANALYST', 'LP_PRIMARY', 'LP_VIEWER', 'AUDITOR',
    ]
    expect(Object.keys(ALLOWED_FUND_ROLES).sort()).toEqual(expectedRoles.sort())
  })
})

describe('validateFundMemberRole', () => {
  it('allows SUPER_ADMIN to be PRINCIPAL', () => {
    const result = validateFundMemberRole('SUPER_ADMIN', 'PRINCIPAL')
    expect(result).toEqual({ valid: true })
  })

  it('allows FUND_ADMIN to be ADMIN', () => {
    const result = validateFundMemberRole('FUND_ADMIN', 'ADMIN')
    expect(result).toEqual({ valid: true })
  })

  it('allows INVESTMENT_MANAGER to be CO_PRINCIPAL', () => {
    const result = validateFundMemberRole('INVESTMENT_MANAGER', 'CO_PRINCIPAL')
    expect(result).toEqual({ valid: true })
  })

  it('rejects INVESTMENT_MANAGER as PRINCIPAL', () => {
    const result = validateFundMemberRole('INVESTMENT_MANAGER', 'PRINCIPAL')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('INVESTMENT_MANAGER')
  })

  it('rejects ANALYST as ADMIN', () => {
    const result = validateFundMemberRole('ANALYST', 'ADMIN')
    expect(result.valid).toBe(false)
  })

  it('allows ANALYST as ADVISOR', () => {
    const result = validateFundMemberRole('ANALYST', 'ADVISOR')
    expect(result).toEqual({ valid: true })
  })

  it('rejects LP_PRIMARY for any fund role', () => {
    expect(validateFundMemberRole('LP_PRIMARY', 'ANALYST').valid).toBe(false)
    expect(validateFundMemberRole('LP_PRIMARY', 'PRINCIPAL').valid).toBe(false)
  })

  it('rejects AUDITOR for any fund role', () => {
    expect(validateFundMemberRole('AUDITOR', 'ANALYST').valid).toBe(false)
  })
})

describe('canBecomeFundMember', () => {
  it('returns true for SUPER_ADMIN', () => {
    expect(canBecomeFundMember('SUPER_ADMIN')).toBe(true)
  })

  it('returns true for INVESTMENT_MANAGER', () => {
    expect(canBecomeFundMember('INVESTMENT_MANAGER')).toBe(true)
  })

  it('returns true for system ANALYST', () => {
    expect(canBecomeFundMember('ANALYST')).toBe(true)
  })

  it('returns false for LP_PRIMARY', () => {
    expect(canBecomeFundMember('LP_PRIMARY')).toBe(false)
  })

  it('returns false for LP_VIEWER', () => {
    expect(canBecomeFundMember('LP_VIEWER')).toBe(false)
  })

  it('returns false for AUDITOR', () => {
    expect(canBecomeFundMember('AUDITOR')).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/shared/__tests__/permissions.test.ts`
Expected: FAIL — `ALLOWED_FUND_ROLES` is not exported

**Step 3: Write the implementation**

Append to `src/lib/shared/permissions.ts` after line 26:

```typescript
// ============================================================================
// ROLE HIERARCHY — UserRole → allowed FundMemberRole[]
// ============================================================================

/**
 * Defines which FundMemberRoles each UserRole can hold.
 * Empty array = cannot be a FundMember at all.
 *
 * Hierarchy:
 *   SUPER_ADMIN / FUND_ADMIN → any role
 *   INVESTMENT_MANAGER       → max CO_PRINCIPAL
 *   ANALYST                  → max ADVISOR
 *   LP_PRIMARY / LP_VIEWER / AUDITOR → none (LP portal / audit only)
 */
export const ALLOWED_FUND_ROLES: Record<string, string[]> = {
  SUPER_ADMIN:        ['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST'],
  FUND_ADMIN:         ['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST'],
  INVESTMENT_MANAGER: ['CO_PRINCIPAL', 'ADVISOR', 'ANALYST'],
  ANALYST:            ['ADVISOR', 'ANALYST'],
  LP_PRIMARY:         [],
  LP_VIEWER:          [],
  AUDITOR:            [],
}

/**
 * Validates that a user with the given system role can hold a specific fund role.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateFundMemberRole(
  systemRole: string,
  fundRole: string
): { valid: true } | { valid: false; error: string } {
  const allowed = ALLOWED_FUND_ROLES[systemRole]

  if (!allowed) {
    return { valid: false, error: `Unknown system role: ${systemRole}` }
  }

  if (allowed.length === 0) {
    return {
      valid: false,
      error: `Users with role ${systemRole} cannot be fund members`,
    }
  }

  if (!allowed.includes(fundRole)) {
    return {
      valid: false,
      error: `Users with role ${systemRole} cannot hold fund role ${fundRole}. Allowed: ${allowed.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Quick check: can a user with this system role be a FundMember at all?
 */
export function canBecomeFundMember(systemRole: string): boolean {
  const allowed = ALLOWED_FUND_ROLES[systemRole]
  return Array.isArray(allowed) && allowed.length > 0
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/shared/__tests__/permissions.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/shared/permissions.ts src/lib/shared/__tests__/permissions.test.ts
git commit -m "feat: add role hierarchy validation constants and functions"
```

---

### Task 2: Add validation to createFund

**Files:**
- Modify: `src/lib/actions/funds.ts:106-165` (createFund function)

**Step 1: Add import and validation**

In `src/lib/actions/funds.ts`, add import at top:

```typescript
import { canBecomeFundMember, validateFundMemberRole, DEFAULT_PERMISSIONS } from '@/lib/shared/permissions'
```

Inside `createFund()`, after the existing role check (line 117-119), add:

```typescript
  // Validate the user can be a fund member
  if (!canBecomeFundMember(user.role)) {
    return { error: `Users with role ${user.role} cannot create funds` }
  }
```

Also add `permissions` to the FundMember creation (line 158-164). Change:

```typescript
      await tx.fundMember.create({
        data: {
          fundId: newFund.id,
          userId: session.user.id!,
          role: 'PRINCIPAL',
          isActive: true,
        },
      })
```

To:

```typescript
      await tx.fundMember.create({
        data: {
          fundId: newFund.id,
          userId: session.user.id!,
          role: 'PRINCIPAL',
          permissions: DEFAULT_PERMISSIONS.PRINCIPAL,
          isActive: true,
        },
      })
```

**Step 2: Run build to verify no type errors**

Run: `npx tsc --noEmit`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add src/lib/actions/funds.ts
git commit -m "feat: validate role hierarchy in createFund and assign default permissions"
```

---

### Task 3: Fix seed data to respect hierarchy

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Find and fix violations**

Search for FundMember creation in `seed.ts`. The admin user is `FUND_ADMIN` (system role) and gets `PRINCIPAL` (fund role) — this is valid per our hierarchy.

Check if any other FundMember creation uses incompatible roles. Look for any user created as `ANALYST` (system) being assigned `PRINCIPAL`/`ADMIN` (fund).

If violations exist, downgrade the fund role to match the system role's max allowed.

For example, if there's an `ANALYST` user getting `ADMIN` in a fund membership, change it to `ANALYST`.

**Step 2: Run seed test (if applicable) or verify build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "fix: align seed FundMember roles with role hierarchy"
```

---

### Task 4: Production migration to fix existing bad data

**Files:**
- Create: `prisma/production-migration-role-hierarchy.sql`

**Step 1: Write the migration SQL**

```sql
-- Role Hierarchy Fix: Downgrade FundMember roles that violate the hierarchy
-- UserRole ANALYST can only be ADVISOR or ANALYST in a fund
-- LP_PRIMARY, LP_VIEWER, AUDITOR cannot be fund members

-- Step 1: Downgrade ANALYST users who have elevated fund roles
UPDATE "FundMember" fm
SET role = 'ANALYST',
    permissions = ARRAY['DEALS','PORTFOLIO','REPORTS']
FROM "User" u
WHERE fm."userId" = u.id
  AND u.role = 'ANALYST'
  AND fm.role IN ('PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL');

-- Step 2: Downgrade INVESTMENT_MANAGER users who have PRINCIPAL/ADMIN roles
UPDATE "FundMember" fm
SET role = 'CO_PRINCIPAL',
    permissions = ARRAY['DEALS','INVESTORS','PORTFOLIO','CAPITAL','REPORTS']
FROM "User" u
WHERE fm."userId" = u.id
  AND u.role = 'INVESTMENT_MANAGER'
  AND fm.role IN ('PRINCIPAL', 'ADMIN');

-- Step 3: Deactivate FundMember records for LP/AUDITOR users (should not exist)
UPDATE "FundMember" fm
SET "isActive" = false,
    "leftAt" = NOW()
FROM "User" u
WHERE fm."userId" = u.id
  AND u.role IN ('LP_PRIMARY', 'LP_VIEWER', 'AUDITOR')
  AND fm."isActive" = true;

-- Verification: Show any remaining violations
SELECT u.email, u.role AS system_role, fm.role AS fund_role, f.name AS fund_name
FROM "FundMember" fm
JOIN "User" u ON fm."userId" = u.id
JOIN "Fund" f ON fm."fundId" = f.id
WHERE fm."isActive" = true
  AND (
    (u.role = 'ANALYST' AND fm.role NOT IN ('ANALYST', 'ADVISOR'))
    OR (u.role = 'INVESTMENT_MANAGER' AND fm.role IN ('PRINCIPAL', 'ADMIN'))
    OR (u.role IN ('LP_PRIMARY', 'LP_VIEWER', 'AUDITOR'))
  );
```

**Step 2: Commit**

```bash
git add prisma/production-migration-role-hierarchy.sql
git commit -m "fix: add production migration to fix role hierarchy violations"
```

---

### Task 5: Run full verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS (previous 363 + new role hierarchy tests)

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 4: Final commit (if any remaining changes)**

```bash
git add -A
git commit -m "chore: role hierarchy validation complete"
```

---

### Task 6: Deploy and run production migration

**Step 1: Push to origin**

```bash
git push
```

**Step 2: SSH to EC2 and run migration**

```bash
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
psql "postgresql://blackgem_admin:vqqvGtB3RILpUFa7R8rdIbBki4XyBp96@blackgem-prod.ca9mk6ayu74v.us-east-1.rds.amazonaws.com:5432/blackgem" -f /opt/blackgem/prisma/production-migration-role-hierarchy.sql
```

Expected output:
- `UPDATE X` for each fix statement
- Empty result for verification query (no violations remain)
