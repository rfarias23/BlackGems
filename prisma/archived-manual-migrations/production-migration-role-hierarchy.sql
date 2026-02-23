-- ============================================================================
-- Role Hierarchy Fix
-- Downgrade FundMember roles that violate the UserRole → FundMemberRole hierarchy
-- Run AFTER production-migration-rbac.sql
-- ============================================================================

-- Step 1: Downgrade ANALYST users who have elevated fund roles → ANALYST
-- (ANALYST system role can only hold ADVISOR or ANALYST fund roles)
UPDATE "FundMember" fm
SET role = 'ANALYST',
    permissions = ARRAY['DEALS','PORTFOLIO','REPORTS']
FROM "User" u
WHERE fm."userId" = u.id
  AND u.role = 'ANALYST'
  AND fm.role IN ('PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL');

-- Step 2: Downgrade INVESTMENT_MANAGER users who have PRINCIPAL/ADMIN → CO_PRINCIPAL
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

-- Verification: Show any remaining violations (should return 0 rows)
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
