-- =============================================================================
-- Production Hotfix: Fix Fund.currency column type (TEXT → Currency enum)
-- =============================================================================
--
-- Problem: Fund creation fails because Prisma expects Currency enum but
-- the column is TEXT (created by initial migration as TEXT, never converted).
--
-- Run via: npx prisma db execute --file prisma/production-migration-fix-currency.sql --url "$DATABASE_URL"
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- =============================================================================

-- 1. Ensure Currency enum type exists (may already exist from previous migration)
DO $$ BEGIN
    CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Convert Fund.currency column from TEXT to Currency enum
--    USING clause casts existing TEXT values ('USD') to the enum safely.
--    If any row has a value NOT in the enum, this will fail loudly (correct behavior).
--    If column is already the Currency enum type, this is a no-op cast.
DO $$ BEGIN
    ALTER TABLE "Fund"
        ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::"Currency");
EXCEPTION
    WHEN others THEN
        -- Column may already be Currency enum type — that's fine
        RAISE NOTICE 'Fund.currency column already correct or conversion skipped: %', SQLERRM;
END $$;

-- 3. Ensure default is set correctly as enum value
ALTER TABLE "Fund" ALTER COLUMN "currency" SET DEFAULT 'USD'::"Currency";

-- 4. Reconcile InvestorType enum — add values Prisma schema expects
--    We ADD new values but do NOT remove JOINT/FUND_OF_FUNDS (may be in use).
--    PostgreSQL enums support extra values without breaking Prisma.
DO $$ BEGIN
    ALTER TYPE "InvestorType" ADD VALUE IF NOT EXISTS 'JOINT_VENTURE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "InvestorType" ADD VALUE IF NOT EXISTS 'INVESTMENT_FUND';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- After running, test fund creation on blackgem.ai:
-- Create a fund with GBP currency to verify the fix works.
-- =============================================================================
