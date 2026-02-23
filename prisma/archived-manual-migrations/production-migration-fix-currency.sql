-- =============================================================================
-- Production Hotfix v2: Fix Fund.currency column type (TEXT → Currency enum)
-- =============================================================================
--
-- Problem: Fund creation fails with "type public.Currency does not exist"
-- because the Currency enum was never created in production, and the column
-- is still TEXT from the initial migration.
--
-- Run via: npx prisma db execute --file prisma/production-migration-fix-currency.sql --url "$DATABASE_URL"
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- =============================================================================

-- 1. Create Currency enum (DROP + CREATE to ensure clean state)
--    We use a transaction: drop default, drop the TEXT column constraint,
--    create the enum, then alter the column type.
DO $$
BEGIN
    -- Check if Currency type already exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Currency') THEN
        CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');
        RAISE NOTICE 'Created Currency enum type';
    ELSE
        RAISE NOTICE 'Currency enum type already exists';
    END IF;
END $$;

-- 2. Drop the current TEXT default before type conversion
ALTER TABLE "Fund" ALTER COLUMN "currency" DROP DEFAULT;

-- 3. Convert Fund.currency column from TEXT to Currency enum
--    USING clause casts existing TEXT values ('USD') to the enum safely.
ALTER TABLE "Fund"
    ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::"Currency");

-- 4. Restore the default as proper enum value
ALTER TABLE "Fund" ALTER COLUMN "currency" SET DEFAULT 'USD'::"Currency";

-- 5. Reconcile InvestorType enum — add values Prisma schema expects
--    We ADD new values but do NOT remove JOINT/FUND_OF_FUNDS (may be in use).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'JOINT_VENTURE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'InvestorType')) THEN
        ALTER TYPE "InvestorType" ADD VALUE 'JOINT_VENTURE';
        RAISE NOTICE 'Added JOINT_VENTURE to InvestorType';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'INVESTMENT_FUND' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'InvestorType')) THEN
        ALTER TYPE "InvestorType" ADD VALUE 'INVESTMENT_FUND';
        RAISE NOTICE 'Added INVESTMENT_FUND to InvestorType';
    END IF;
END $$;

-- =============================================================================
-- After running, test fund creation on blackgem.ai:
-- Create a fund with GBP currency to verify the fix works.
-- =============================================================================
