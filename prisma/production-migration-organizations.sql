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
