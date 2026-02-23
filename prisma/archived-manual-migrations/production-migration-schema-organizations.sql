-- ============================================================================
-- PRODUCTION SCHEMA MIGRATION: Multi-Tenant Organizations (DDL)
-- Date: 2026-02-18
-- Purpose: Create Organization table, new enums, and add columns to Fund/User
-- Run BEFORE: production-migration-organizations.sql (data backfill)
-- Run from EC2: PGPASSWORD='...' psql -h <RDS_HOST> -U blackgem_admin -d blackgem < production-migration-schema-organizations.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE NEW ENUM TYPES
-- ============================================================================

CREATE TYPE "OrganizationType" AS ENUM ('SEARCH_FUND', 'MICRO_PE', 'MID_PE', 'CONSOLIDATED_PE');
CREATE TYPE "OrgEntityType" AS ENUM ('LLC', 'LP', 'C_CORP', 'S_CORP', 'SICAV', 'LTD', 'SARL', 'OTHER');
CREATE TYPE "RegulatoryStatus" AS ENUM ('REGISTERED', 'EXEMPT', 'NON_REGISTERED');
CREATE TYPE "ReportingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- ============================================================================
-- STEP 2: CREATE ORGANIZATION TABLE
-- ============================================================================

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "type" "OrganizationType" NOT NULL,

    -- Legal
    "entityType" "OrgEntityType",
    "jurisdictionOfFormation" TEXT,
    "dateOfFormation" TIMESTAMP(3),
    "taxId" TEXT,
    "leiCode" TEXT,
    "regulatoryStatus" "RegulatoryStatus",
    "secFileNumber" TEXT,

    -- Contact
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactPhone" TEXT,
    "investorRelationsEmail" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,

    -- Address
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "postalCode" TEXT,

    -- Operational
    "baseCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "fiscalYearEnd" TEXT,
    "reportingFrequency" "ReportingFrequency",
    "baseTimeZone" TEXT,

    -- Strategy
    "firmStrategies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetGeographies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetSectors" TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Status
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- ============================================================================
-- STEP 3: ADD organizationId TO User TABLE
-- ============================================================================

ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- STEP 4: ADD NEW COLUMNS TO Fund TABLE
-- ============================================================================

-- Tenant scope
ALTER TABLE "Fund" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "Fund_organizationId_idx" ON "Fund"("organizationId");
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Strategy & Focus
ALTER TABLE "Fund" ADD COLUMN "strategy" TEXT;
ALTER TABLE "Fund" ADD COLUMN "investmentStages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Fund" ADD COLUMN "targetSectors" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Fund" ADD COLUMN "targetGeographies" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Fund" ADD COLUMN "checkSizeMin" DECIMAL(15, 2);
ALTER TABLE "Fund" ADD COLUMN "checkSizeMax" DECIMAL(15, 2);

-- Lifecycle Dates
ALTER TABLE "Fund" ADD COLUMN "fundLaunchDate" TIMESTAMP(3);
ALTER TABLE "Fund" ADD COLUMN "firstCloseDate" TIMESTAMP(3);
ALTER TABLE "Fund" ADD COLUMN "finalCloseDate" TIMESTAMP(3);
ALTER TABLE "Fund" ADD COLUMN "investmentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Fund" ADD COLUMN "fundTermYears" INTEGER;

-- Legal
ALTER TABLE "Fund" ADD COLUMN "fundEntityType" "OrgEntityType";
ALTER TABLE "Fund" ADD COLUMN "jurisdiction" TEXT;
ALTER TABLE "Fund" ADD COLUMN "taxId" TEXT;

-- Operational Config
ALTER TABLE "Fund" ADD COLUMN "capitalCallNoticeDays" INTEGER;
ALTER TABLE "Fund" ADD COLUMN "distributionNoticeDays" INTEGER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Organization table created:' as check_name, COUNT(*) as count FROM "Organization";

SELECT 'User.organizationId column:' as check_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='organizationId') as exists;

SELECT 'Fund.organizationId column:' as check_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='Fund' AND column_name='organizationId') as exists;

SELECT 'Fund.strategy column:' as check_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='Fund' AND column_name='strategy') as exists;

SELECT 'New enum types:' as check_name, typname
FROM pg_type WHERE typname IN ('OrganizationType', 'OrgEntityType', 'RegulatoryStatus', 'ReportingFrequency')
ORDER BY typname;

COMMIT;
