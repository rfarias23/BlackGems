-- =============================================================================
-- Production Migration: Multi-Fund + Currency Support
-- =============================================================================
--
-- Context: 16 commits added multi-fund and multi-currency support.
-- Production DB needs these schema changes to fully support the features.
-- Without this migration, pages still work (graceful degradation shows empty
-- states), but actual multi-fund data won't populate.
--
-- IMPORTANT: Run via `npx prisma db execute --file prisma/production-migration-multi-fund.sql`
-- (Production DB has no Prisma migration history — raw SQL is the approach.)
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- =============================================================================

-- 1. Create Currency enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add currency column to Fund table (if not exists)
DO $$ BEGIN
    ALTER TABLE "Fund" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'USD';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 3. Create FundMemberRole enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE "FundMemberRole" AS ENUM ('PRINCIPAL', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create FundMember table (if not exists)
CREATE TABLE IF NOT EXISTS "FundMember" (
    "id"        TEXT NOT NULL,
    "fundId"    TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "role"      "FundMemberRole" NOT NULL,
    "title"     TEXT,
    "joinedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt"    TIMESTAMP(3),
    "isActive"  BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FundMember_pkey" PRIMARY KEY ("id")
);

-- 5. Add unique constraint and indexes (if not exists)
DO $$ BEGIN
    ALTER TABLE "FundMember" ADD CONSTRAINT "FundMember_fundId_userId_key" UNIQUE ("fundId", "userId");
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "FundMember_fundId_idx" ON "FundMember"("fundId");
CREATE INDEX IF NOT EXISTS "FundMember_userId_idx" ON "FundMember"("userId");

-- 6. Add foreign key constraints (if not exist)
DO $$ BEGIN
    ALTER TABLE "FundMember" ADD CONSTRAINT "FundMember_fundId_fkey"
        FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "FundMember" ADD CONSTRAINT "FundMember_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 7. Seed: Link all existing admin users to all existing funds
-- This ensures admins can immediately access all funds after migration.
-- Uses gen_random_uuid() for CUID-like IDs (Neon/Postgres 13+ supports this).
INSERT INTO "FundMember" ("id", "fundId", "userId", "role", "isActive")
SELECT
    gen_random_uuid()::TEXT,
    f."id",
    u."id",
    'ADMIN'::"FundMemberRole",
    true
FROM "User" u
CROSS JOIN "Fund" f
WHERE u."role" IN ('SUPER_ADMIN', 'FUND_ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM "FundMember" fm
    WHERE fm."fundId" = f."id" AND fm."userId" = u."id"
  );

-- =============================================================================
-- Verification (run these queries after to confirm):
--
--   SELECT COUNT(*) FROM "FundMember";
--   SELECT * FROM "FundMember" LIMIT 10;
--   SELECT "id", "name", "currency" FROM "Fund";
-- =============================================================================
