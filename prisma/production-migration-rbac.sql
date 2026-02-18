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
