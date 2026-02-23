-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FUND_MANAGER', 'ANALYST', 'LP_USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "FundType" AS ENUM ('TRADITIONAL_SEARCH_FUND', 'SELF_FUNDED_SEARCH', 'ACCELERATOR_FUND', 'ACQUISITION_FUND', 'PE_FUND', 'HOLDING_COMPANY');

-- CreateEnum
CREATE TYPE "FundStatus" AS ENUM ('RAISING', 'SEARCHING', 'UNDER_LOI', 'ACQUIRED', 'OPERATING', 'PREPARING_EXIT', 'EXITED', 'DISSOLVED', 'CLOSED');

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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "legalName" TEXT,
    "type" "FundType" NOT NULL,
    "status" "FundStatus" NOT NULL DEFAULT 'RAISING',
    "vintage" INTEGER NOT NULL,
    "targetSize" DECIMAL(15,2) NOT NULL,
    "hardCap" DECIMAL(15,2),
    "minimumCommitment" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "managementFee" DECIMAL(5,4) NOT NULL,
    "carriedInterest" DECIMAL(5,4) NOT NULL,
    "hurdleRate" DECIMAL(5,4),
    "catchUpRate" DECIMAL(5,4),
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
    "fundId" TEXT,
    "dealId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Document" ADD CONSTRAINT "Document_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
