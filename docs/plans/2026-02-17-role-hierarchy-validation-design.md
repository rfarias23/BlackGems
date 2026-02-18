# Role Hierarchy Validation — Design Document

**Date:** 2026-02-17
**Status:** Approved
**Problem:** System role (UserRole) and fund role (FundMemberRole) are independent with no cross-validation. An ANALYST user can be assigned PRINCIPAL/ADMIN in a fund, breaking RBAC integrity.

## Hierarchy

| UserRole | Max FundMemberRole | Rationale |
|----------|-------------------|-----------|
| SUPER_ADMIN | Any | Platform owner |
| FUND_ADMIN | Any | Fund administration |
| INVESTMENT_MANAGER | CO_PRINCIPAL | Operational, not ownership |
| ANALYST | ADVISOR | Analysis role, no fund control |
| LP_PRIMARY | ❌ Cannot be FundMember | LP portal only |
| LP_VIEWER | ❌ Cannot be FundMember | LP portal only |
| AUDITOR | ❌ Cannot be FundMember | Read-only audit access |

## Implementation

### 1. `src/lib/shared/permissions.ts`
- `ALLOWED_FUND_ROLES: Record<UserRole, FundMemberRole[]>` — valid combinations
- `validateFundMemberRole(systemRole, fundRole)` — pure validation function
- `canBecomeFundMember(systemRole)` — quick eligibility check

### 2. `src/lib/actions/funds.ts`
- Add validation in `createFund()` before creating PRINCIPAL FundMember

### 3. `prisma/seed.ts`
- Fix seed data to respect hierarchy

### 4. Production migration SQL
- Downgrade existing FundMember roles that violate hierarchy
- Specifically: Daniel Vilchez (ANALYST) should not be ADMIN/PRINCIPAL

### 5. Tests
- Unit tests for all valid/invalid role combinations
- Integration test for createFund() rejection of LP/AUDITOR users

## Out of Scope
- Full FundMember CRUD (separate feature)
- Database CHECK constraint (future defense-in-depth)
