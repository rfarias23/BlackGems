-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SEARCH_FUND', 'MICRO_PE', 'MID_PE', 'CONSOLIDATED_PE');

-- CreateEnum
CREATE TYPE "OrgEntityType" AS ENUM ('LLC', 'LP', 'C_CORP', 'S_CORP', 'SICAV', 'LTD', 'SARL', 'OTHER');

-- CreateEnum
CREATE TYPE "RegulatoryStatus" AS ENUM ('REGISTERED', 'EXEMPT', 'NON_REGISTERED');

-- CreateEnum
CREATE TYPE "ReportingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST', 'LP_PRIMARY', 'LP_VIEWER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "FundType" AS ENUM ('TRADITIONAL_SEARCH_FUND', 'SELF_FUNDED_SEARCH', 'ACCELERATOR_FUND', 'ACQUISITION_FUND', 'PE_FUND', 'HOLDING_COMPANY');

-- CreateEnum
CREATE TYPE "FundStatus" AS ENUM ('RAISING', 'SEARCHING', 'UNDER_LOI', 'ACQUIRED', 'OPERATING', 'PREPARING_EXIT', 'EXITED', 'DISSOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "FundMemberRole" AS ENUM ('PRINCIPAL', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST', 'ADMIN');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('IDENTIFIED', 'INITIAL_REVIEW', 'PRELIMINARY_ANALYSIS', 'MANAGEMENT_MEETING', 'NDA_SIGNED', 'NDA_CIM', 'IOI_SUBMITTED', 'SITE_VISIT', 'LOI_PREPARATION', 'LOI_NEGOTIATION', 'DUE_DILIGENCE', 'FINAL_NEGOTIATION', 'CLOSING', 'CLOSED_WON', 'CLOSED_LOST', 'CLOSED', 'PASSED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'PASSED', 'LOST', 'WON');

-- CreateEnum
CREATE TYPE "DealSourceType" AS ENUM ('BROKER', 'INVESTMENT_BANK', 'DIRECT_OUTREACH', 'REFERRAL_NETWORK', 'REFERRAL_INVESTOR', 'ONLINE_MARKETPLACE', 'CONFERENCE', 'ADVISOR', 'INBOUND', 'OTHER');

-- CreateEnum
CREATE TYPE "DealContactRole" AS ENUM ('OWNER', 'CO_OWNER', 'MANAGEMENT', 'BROKER', 'ATTORNEY', 'ACCOUNTANT', 'ADVISOR', 'OTHER');

-- CreateEnum
CREATE TYPE "DDCategory" AS ENUM ('FINANCIAL', 'ACCOUNTING', 'TAX', 'LEGAL', 'COMMERCIAL', 'OPERATIONAL', 'HR', 'IT', 'ENVIRONMENTAL', 'INSURANCE', 'REAL_ESTATE', 'IP', 'REGULATORY', 'QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "DDStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_INFO', 'UNDER_REVIEW', 'COMPLETED', 'NA');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('FUND_FORMATION', 'INVESTOR_COMMS', 'TAX', 'COMPLIANCE', 'CIM', 'NDA', 'FINANCIAL_STATEMENTS', 'LOI', 'TERM_SHEET', 'DUE_DILIGENCE', 'PURCHASE_AGREEMENT', 'CLOSING_DOCS', 'BOARD_MATERIALS', 'OPERATING_REPORTS', 'BUDGET', 'STRATEGIC_PLAN', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL_SENT', 'EMAIL_RECEIVED', 'MEETING', 'SITE_VISIT', 'DOCUMENT_SENT', 'DOCUMENT_RECEIVED', 'STAGE_CHANGE', 'STATUS_CHANGE', 'TASK_COMPLETED', 'COMMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_DUE', 'TASK_OVERDUE', 'DEAL_STAGE_CHANGE', 'CAPITAL_CALL_DUE', 'DISTRIBUTION_MADE', 'DOCUMENT_SHARED', 'COMMENT_ADDED', 'REPORT_PUBLISHED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('INDIVIDUAL', 'JOINT_VENTURE', 'TRUST', 'IRA', 'FAMILY_OFFICE', 'FOUNDATION', 'ENDOWMENT', 'PENSION', 'INVESTMENT_FUND', 'CORPORATE', 'SOVEREIGN_WEALTH', 'INSURANCE', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestorStatus" AS ENUM ('PROSPECT', 'CONTACTED', 'INTERESTED', 'DUE_DILIGENCE', 'COMMITTED', 'ACTIVE', 'INACTIVE', 'DECLINED');

-- CreateEnum
CREATE TYPE "AccreditedStatus" AS ENUM ('ACCREDITED_INDIVIDUAL', 'QUALIFIED_PURCHASER', 'QUALIFIED_CLIENT', 'INSTITUTIONAL', 'NOT_ACCREDITED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AMLStatus" AS ENUM ('PENDING', 'CLEARED', 'FLAGGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('PENDING', 'SIGNED', 'FUNDED', 'ACTIVE', 'DEFAULTED', 'TRANSFERRED', 'REDEEMED');

-- CreateEnum
CREATE TYPE "CapitalCallStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_FUNDED', 'FULLY_FUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallItemStatus" AS ENUM ('PENDING', 'NOTIFIED', 'PARTIAL', 'PAID', 'OVERDUE', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "DistributionType" AS ENUM ('RETURN_OF_CAPITAL', 'PROFIT_DISTRIBUTION', 'RECALLABLE', 'FINAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('DRAFT', 'APPROVED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DistItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "PortfolioStatus" AS ENUM ('HOLDING', 'PREPARING_EXIT', 'UNDER_LOI', 'PARTIAL_EXIT', 'EXITED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "ExitType" AS ENUM ('STRATEGIC_SALE', 'FINANCIAL_SALE', 'IPO', 'RECAPITALIZATION', 'MANAGEMENT_BUYOUT', 'MERGER', 'LIQUIDATION', 'WRITE_OFF');

-- CreateEnum
CREATE TYPE "MetricPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('QUARTERLY_UPDATE', 'ANNUAL_REPORT', 'CAPITAL_CALL_NOTICE', 'DISTRIBUTION_NOTICE', 'K1', 'FINANCIAL_STATEMENT', 'PORTFOLIO_SUMMARY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'VIDEO_CALL', 'TEXT', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "type" "OrganizationType" NOT NULL,
    "entityType" "OrgEntityType",
    "jurisdictionOfFormation" TEXT,
    "dateOfFormation" TIMESTAMP(3),
    "taxId" TEXT,
    "leiCode" TEXT,
    "regulatoryStatus" "RegulatoryStatus",
    "secFileNumber" TEXT,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactPhone" TEXT,
    "investorRelationsEmail" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "postalCode" TEXT,
    "baseCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "fiscalYearEnd" TEXT,
    "reportingFrequency" "ReportingFrequency",
    "baseTimeZone" TEXT,
    "firmStrategies" TEXT[],
    "targetGeographies" TEXT[],
    "targetSectors" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'LP_VIEWER',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "organizationId" TEXT,
    "legalName" TEXT,
    "type" "FundType" NOT NULL,
    "status" "FundStatus" NOT NULL DEFAULT 'RAISING',
    "vintage" INTEGER NOT NULL,
    "targetSize" DECIMAL(15,2) NOT NULL,
    "hardCap" DECIMAL(15,2),
    "minimumCommitment" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "managementFee" DECIMAL(5,4) NOT NULL,
    "carriedInterest" DECIMAL(5,4) NOT NULL,
    "hurdleRate" DECIMAL(5,4),
    "catchUpRate" DECIMAL(5,4),
    "strategy" TEXT,
    "investmentStages" TEXT[],
    "targetSectors" TEXT[],
    "targetGeographies" TEXT[],
    "checkSizeMin" DECIMAL(15,2),
    "checkSizeMax" DECIMAL(15,2),
    "fundLaunchDate" TIMESTAMP(3),
    "firstCloseDate" TIMESTAMP(3),
    "finalCloseDate" TIMESTAMP(3),
    "investmentPeriodEnd" TIMESTAMP(3),
    "fundTermYears" INTEGER,
    "fundEntityType" "OrgEntityType",
    "jurisdiction" TEXT,
    "taxId" TEXT,
    "capitalCallNoticeDays" INTEGER,
    "distributionNoticeDays" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundMember" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FundMemberRole" NOT NULL,
    "title" TEXT,
    "permissions" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FundMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "subIndustry" TEXT,
    "businessModel" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'INITIAL_REVIEW',
    "status" "DealStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceId" TEXT,
    "sourceContact" TEXT,
    "sourceNotes" TEXT,
    "askingPrice" DECIMAL(15,2),
    "revenue" DECIMAL(15,2),
    "ebitda" DECIMAL(15,2),
    "grossProfit" DECIMAL(15,2),
    "netIncome" DECIMAL(15,2),
    "revenueMultiple" DECIMAL(5,2),
    "ebitdaMultiple" DECIMAL(5,2),
    "grossMargin" DECIMAL(5,4),
    "ebitdaMargin" DECIMAL(5,4),
    "employeeCount" INTEGER,
    "yearFounded" INTEGER,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "attractivenessScore" INTEGER,
    "fitScore" INTEGER,
    "riskScore" INTEGER,
    "investmentThesis" TEXT,
    "keyRisks" TEXT,
    "valueCreationPlan" TEXT,
    "firstContactDate" TIMESTAMP(3),
    "ndaSignedDate" TIMESTAMP(3),
    "cimReceivedDate" TIMESTAMP(3),
    "managementMeetingDate" TIMESTAMP(3),
    "loiSubmittedDate" TIMESTAMP(3),
    "loiAcceptedDate" TIMESTAMP(3),
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "nextSteps" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DealSourceType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealContact" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" "DealContactRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDiligenceItem" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "category" "DDCategory" NOT NULL,
    "item" TEXT NOT NULL,
    "status" "DDStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "assignedTo" TEXT,
    "notes" TEXT,
    "findings" TEXT,
    "redFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DueDiligenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "visibleToLPs" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "fundId" TEXT,
    "dealId" TEXT,
    "investorId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "dealId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InvestorType" NOT NULL,
    "status" "InvestorStatus" NOT NULL DEFAULT 'PROSPECT',
    "legalName" TEXT,
    "taxId" TEXT,
    "jurisdiction" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "postalCode" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactTitle" TEXT,
    "accreditedStatus" "AccreditedStatus",
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "kycCompletedAt" TIMESTAMP(3),
    "amlStatus" "AMLStatus" NOT NULL DEFAULT 'PENDING',
    "amlCompletedAt" TIMESTAMP(3),
    "investmentCapacity" DECIMAL(15,2),
    "notes" TEXT,
    "source" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "committedAmount" DECIMAL(15,2) NOT NULL,
    "calledAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "distributedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'PENDING',
    "commitmentDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "subscriptionDocsSigned" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionDocsDate" TIMESTAMP(3),
    "sideLetterExists" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalCall" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "callNumber" INTEGER NOT NULL,
    "callDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "forInvestment" DECIMAL(15,2),
    "forFees" DECIMAL(15,2),
    "forExpenses" DECIMAL(15,2),
    "purpose" TEXT,
    "dealReference" TEXT,
    "status" "CapitalCallStatus" NOT NULL DEFAULT 'DRAFT',
    "noticeDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CapitalCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalCallItem" (
    "id" TEXT NOT NULL,
    "capitalCallId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "callAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "CallItemStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalCallItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "distributionNumber" INTEGER NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "returnOfCapital" DECIMAL(15,2),
    "realizedGains" DECIMAL(15,2),
    "dividends" DECIMAL(15,2),
    "interest" DECIMAL(15,2),
    "type" "DistributionType" NOT NULL,
    "source" TEXT,
    "status" "DistributionStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionItem" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "grossAmount" DECIMAL(15,2) NOT NULL,
    "withholdingTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(15,2) NOT NULL,
    "status" "DistItemStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioCompany" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "dealId" TEXT,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "description" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "industry" TEXT,
    "subIndustry" TEXT,
    "businessModel" TEXT,
    "headquarters" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "holdingPeriod" INTEGER,
    "entryValuation" DECIMAL(15,2) NOT NULL,
    "entryRevenue" DECIMAL(15,2),
    "entryEbitda" DECIMAL(15,2),
    "entryMultiple" DECIMAL(5,2),
    "equityInvested" DECIMAL(15,2) NOT NULL,
    "debtFinancing" DECIMAL(15,2),
    "totalInvestment" DECIMAL(15,2) NOT NULL,
    "ownershipPct" DECIMAL(5,4) NOT NULL,
    "status" "PortfolioStatus" NOT NULL DEFAULT 'HOLDING',
    "exitValuation" DECIMAL(15,2),
    "exitRevenue" DECIMAL(15,2),
    "exitEbitda" DECIMAL(15,2),
    "exitMultiple" DECIMAL(5,2),
    "exitType" "ExitType",
    "exitBuyer" TEXT,
    "realizedValue" DECIMAL(15,2),
    "unrealizedValue" DECIMAL(15,2),
    "totalValue" DECIMAL(15,2),
    "moic" DECIMAL(5,2),
    "irr" DECIMAL(5,4),
    "ceoName" TEXT,
    "ceoEmail" TEXT,
    "ceoPhone" TEXT,
    "boardSeats" INTEGER,
    "investmentThesis" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PortfolioCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioMetric" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "periodType" "MetricPeriodType" NOT NULL DEFAULT 'QUARTERLY',
    "revenue" DECIMAL(15,2),
    "revenueGrowth" DECIMAL(5,4),
    "grossProfit" DECIMAL(15,2),
    "grossMargin" DECIMAL(5,4),
    "ebitda" DECIMAL(15,2),
    "ebitdaMargin" DECIMAL(5,4),
    "netIncome" DECIMAL(15,2),
    "operatingCashFlow" DECIMAL(15,2),
    "freeCashFlow" DECIMAL(15,2),
    "cashBalance" DECIMAL(15,2),
    "totalDebt" DECIMAL(15,2),
    "netDebt" DECIMAL(15,2),
    "employeeCount" INTEGER,
    "customerCount" INTEGER,
    "currentValuation" DECIMAL(15,2),
    "evEbitda" DECIMAL(5,2),
    "highlights" TEXT,
    "concerns" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valuation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "equityValue" DECIMAL(15,2),
    "methodology" TEXT NOT NULL,
    "revenueMultiple" DECIMAL(5,2),
    "ebitdaMultiple" DECIMAL(5,2),
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "content" JSONB,
    "fileUrl" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "sentToLPs" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "subject" TEXT,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "contactName" TEXT,
    "sentBy" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolInvocations" JSONB,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_slug_key" ON "Fund"("slug");

-- CreateIndex
CREATE INDEX "Fund_organizationId_idx" ON "Fund"("organizationId");

-- CreateIndex
CREATE INDEX "FundMember_fundId_idx" ON "FundMember"("fundId");

-- CreateIndex
CREATE INDEX "FundMember_userId_idx" ON "FundMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FundMember_fundId_userId_key" ON "FundMember"("fundId", "userId");

-- CreateIndex
CREATE INDEX "Deal_fundId_idx" ON "Deal"("fundId");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE INDEX "Deal_deletedAt_idx" ON "Deal"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DealSource_name_key" ON "DealSource"("name");

-- CreateIndex
CREATE INDEX "DealContact_dealId_idx" ON "DealContact"("dealId");

-- CreateIndex
CREATE INDEX "DueDiligenceItem_dealId_idx" ON "DueDiligenceItem"("dealId");

-- CreateIndex
CREATE INDEX "DueDiligenceItem_category_idx" ON "DueDiligenceItem"("category");

-- CreateIndex
CREATE INDEX "Document_fundId_idx" ON "Document"("fundId");

-- CreateIndex
CREATE INDEX "Document_dealId_idx" ON "Document"("dealId");

-- CreateIndex
CREATE INDEX "Document_investorId_idx" ON "Document"("investorId");

-- CreateIndex
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");

-- CreateIndex
CREATE INDEX "Document_parentId_idx" ON "Document"("parentId");

-- CreateIndex
CREATE INDEX "Activity_dealId_idx" ON "Activity"("dealId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Comment_dealId_idx" ON "Comment"("dealId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_dealId_idx" ON "Task"("dealId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_userId_key" ON "Investor"("userId");

-- CreateIndex
CREATE INDEX "Investor_type_idx" ON "Investor"("type");

-- CreateIndex
CREATE INDEX "Investor_status_idx" ON "Investor"("status");

-- CreateIndex
CREATE INDEX "Investor_deletedAt_idx" ON "Investor"("deletedAt");

-- CreateIndex
CREATE INDEX "Commitment_fundId_idx" ON "Commitment"("fundId");

-- CreateIndex
CREATE INDEX "Commitment_investorId_idx" ON "Commitment"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_investorId_fundId_key" ON "Commitment"("investorId", "fundId");

-- CreateIndex
CREATE INDEX "CapitalCall_fundId_idx" ON "CapitalCall"("fundId");

-- CreateIndex
CREATE INDEX "CapitalCall_status_idx" ON "CapitalCall"("status");

-- CreateIndex
CREATE INDEX "CapitalCall_deletedAt_idx" ON "CapitalCall"("deletedAt");

-- CreateIndex
CREATE INDEX "CapitalCallItem_capitalCallId_idx" ON "CapitalCallItem"("capitalCallId");

-- CreateIndex
CREATE INDEX "CapitalCallItem_investorId_idx" ON "CapitalCallItem"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "CapitalCallItem_capitalCallId_investorId_key" ON "CapitalCallItem"("capitalCallId", "investorId");

-- CreateIndex
CREATE INDEX "Distribution_fundId_idx" ON "Distribution"("fundId");

-- CreateIndex
CREATE INDEX "Distribution_status_idx" ON "Distribution"("status");

-- CreateIndex
CREATE INDEX "Distribution_deletedAt_idx" ON "Distribution"("deletedAt");

-- CreateIndex
CREATE INDEX "DistributionItem_distributionId_idx" ON "DistributionItem"("distributionId");

-- CreateIndex
CREATE INDEX "DistributionItem_investorId_idx" ON "DistributionItem"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionItem_distributionId_investorId_key" ON "DistributionItem"("distributionId", "investorId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCompany_dealId_key" ON "PortfolioCompany"("dealId");

-- CreateIndex
CREATE INDEX "PortfolioCompany_fundId_idx" ON "PortfolioCompany"("fundId");

-- CreateIndex
CREATE INDEX "PortfolioCompany_status_idx" ON "PortfolioCompany"("status");

-- CreateIndex
CREATE INDEX "PortfolioCompany_deletedAt_idx" ON "PortfolioCompany"("deletedAt");

-- CreateIndex
CREATE INDEX "PortfolioMetric_companyId_idx" ON "PortfolioMetric"("companyId");

-- CreateIndex
CREATE INDEX "PortfolioMetric_periodDate_idx" ON "PortfolioMetric"("periodDate");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioMetric_companyId_periodDate_periodType_key" ON "PortfolioMetric"("companyId", "periodDate", "periodType");

-- CreateIndex
CREATE INDEX "Valuation_companyId_idx" ON "Valuation"("companyId");

-- CreateIndex
CREATE INDEX "Valuation_date_idx" ON "Valuation"("date");

-- CreateIndex
CREATE INDEX "Report_fundId_idx" ON "Report"("fundId");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Communication_investorId_idx" ON "Communication"("investorId");

-- CreateIndex
CREATE INDEX "Communication_date_idx" ON "Communication"("date");

-- CreateIndex
CREATE INDEX "Conversation_fundId_idx" ON "Conversation"("fundId");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundMember" ADD CONSTRAINT "FundMember_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundMember" ADD CONSTRAINT "FundMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DealSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealContact" ADD CONSTRAINT "DealContact_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDiligenceItem" ADD CONSTRAINT "DueDiligenceItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalCall" ADD CONSTRAINT "CapitalCall_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalCallItem" ADD CONSTRAINT "CapitalCallItem_capitalCallId_fkey" FOREIGN KEY ("capitalCallId") REFERENCES "CapitalCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalCallItem" ADD CONSTRAINT "CapitalCallItem_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioCompany" ADD CONSTRAINT "PortfolioCompany_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioCompany" ADD CONSTRAINT "PortfolioCompany_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMetric" ADD CONSTRAINT "PortfolioMetric_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "PortfolioCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "PortfolioCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
