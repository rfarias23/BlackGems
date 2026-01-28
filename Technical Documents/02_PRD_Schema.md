# BlackGem - Database Schema

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.0 |
| Related To | 01_PRD_Overview.md |

---

## Overview

This document contains the complete Prisma schema for the BlackGem. The schema has been designed to support the full lifecycle of a search fund, from raising capital through exit.

**Key Design Decisions:**

1. **Multi-fund support:** A user can belong to multiple funds via `FundMember`
2. **Audit trail:** All significant changes are logged via `AuditLog`
3. **Capital tracking:** Detailed transaction history via `CapitalTransaction`
4. **Document versioning:** Documents support version control
5. **Deal-to-Portfolio conversion:** Explicit link between closed deals and portfolio companies

---

## Complete Prisma Schema

```prisma
// ============================================================================
// PRISMA SCHEMA - BlackGem
// Version: 2.0
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          UserRole  @default(VIEWER)
  avatar        String?
  isActive      Boolean   @default(true)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  fundMemberships FundMember[]
  activities      Activity[]
  comments        Comment[]
  tasksAssigned   Task[]           @relation("TaskAssignee")
  tasksCreated    Task[]           @relation("TaskCreator")
  notifications   Notification[]
  auditLogs       AuditLog[]
  sessions        Session[]
  accounts        Account[]
  
  // LP Portal link (one user can be linked to one investor)
  investorProfile Investor?
}

enum UserRole {
  ADMIN           // Full system access
  FUND_MANAGER    // Full fund access, can invite users
  ANALYST         // Can edit deals and data, limited settings
  LP_USER         // Read-only portal access for investors
  VIEWER          // Read-only access to allowed resources
}

// NextAuth.js required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================================================
// FUND STRUCTURE
// ============================================================================

model Fund {
  id                String     @id @default(cuid())
  name              String
  legalName         String?
  type              FundType
  status            FundStatus @default(RAISING)
  vintage           Int        // Year of fund formation
  
  // Capital Structure
  targetSize        Decimal    @db.Decimal(15, 2)
  hardCap           Decimal?   @db.Decimal(15, 2) // Maximum fund size
  minimumCommitment Decimal?   @db.Decimal(15, 2) // Minimum LP commitment
  currency          String     @default("USD")
  
  // Fee Structure
  managementFee     Decimal    @db.Decimal(5, 4)  // e.g., 0.0200 = 2%
  carriedInterest   Decimal    @db.Decimal(5, 4)  // e.g., 0.2000 = 20%
  hurdleRate        Decimal?   @db.Decimal(5, 4)  // e.g., 0.0800 = 8%
  catchUpRate       Decimal?   @db.Decimal(5, 4)  // GP catch-up percentage
  
  // Timeline
  investmentPeriod  Int?       // months
  fundLife          Int?       // months
  extensionOptions  Int?       // number of 1-year extensions allowed
  
  // Metadata
  description       String?    @db.Text
  legalStructure    String?    // "Delaware LP", "Cayman", etc.
  taxId             String?    // EIN or equivalent
  
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  // Relations
  members              FundMember[]
  investors            Investor[]
  deals                Deal[]
  portfolioCompanies   PortfolioCompany[]
  capitalCalls         CapitalCall[]
  distributions        Distribution[]
  reports              Report[]
  documents            Document[]
  capitalTransactions  CapitalTransaction[]
}

enum FundType {
  TRADITIONAL_SEARCH_FUND  // Traditional 2-year search with LP backing
  SELF_FUNDED_SEARCH       // Principal funds own search
  ACCELERATOR_FUND         // Search fund accelerator portfolio
  ACQUISITION_FUND         // Single-purpose acquisition vehicle
  PE_FUND                  // Traditional PE fund structure
  HOLDING_COMPANY          // Permanent capital structure
}

enum FundStatus {
  RAISING           // Raising initial search capital
  SEARCHING         // Actively searching for targets
  UNDER_LOI         // Have LOI signed, in due diligence
  ACQUIRED          // Acquisition completed
  OPERATING         // Operating the portfolio company
  PREPARING_EXIT    // Actively preparing for exit
  EXITED            // Exit completed, distributing proceeds
  DISSOLVED         // Fund dissolved without acquisition
  CLOSED            // Fund fully wound down
}

model FundMember {
  id        String   @id @default(cuid())
  fund      Fund     @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  role      FundMemberRole
  title     String?  // "Co-Founder", "Operating Partner", etc.
  joinedAt  DateTime @default(now())
  leftAt    DateTime?
  isActive  Boolean  @default(true)

  @@unique([fundId, userId])
  @@index([fundId])
  @@index([userId])
}

enum FundMemberRole {
  PRINCIPAL     // Search fund operator/CEO
  CO_PRINCIPAL  // Co-searcher
  ADVISOR       // Advisor with board role
  ANALYST       // Supporting team member
  ADMIN         // Administrative access
}

// ============================================================================
// INVESTORS (LIMITED PARTNERS)
// ============================================================================

model Investor {
  id                String         @id @default(cuid())
  fund              Fund           @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId            String
  
  // Basic Info
  name              String
  type              InvestorType
  status            InvestorStatus @default(PROSPECT)
  
  // Contact
  email             String?
  phone             String?
  company           String?        // Family office name, institution name, etc.
  
  // Commitment
  commitmentAmount  Decimal        @db.Decimal(15, 2)
  commitmentDate    DateTime?
  
  // Role in Fund
  boardSeat         Boolean        @default(false)
  boardObserver     Boolean        @default(false)
  mentorRole        Boolean        @default(false)
  leadInvestor      Boolean        @default(false)
  
  // Portal Access
  portalUser        User?          @relation(fields: [portalUserId], references: [id])
  portalUserId      String?        @unique
  portalEnabled     Boolean        @default(false)
  portalInvitedAt   DateTime?
  portalLastAccess  DateTime?
  
  // Notes
  notes             String?        @db.Text
  investmentCriteria String?       @db.Text // What they look for
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  // Relations
  contacts             InvestorContact[]
  capitalCallItems     CapitalCallItem[]
  distributionItems    DistributionItem[]
  communications       Communication[]
  capitalTransactions  CapitalTransaction[]
  sharedDocuments      InvestorDocument[]

  @@index([fundId])
  @@index([status])
}

enum InvestorType {
  INDIVIDUAL         // High net worth individual
  FAMILY_OFFICE      // Family office
  INSTITUTIONAL      // Pension, endowment, etc.
  FUND_OF_FUNDS      // Fund investing in search funds
  STRATEGIC          // Strategic/corporate investor
  ANGEL              // Angel investor
  FOUNDER            // Founder/Principal personal investment
}

enum InvestorStatus {
  PROSPECT           // Initial contact
  CONTACTED          // Have reached out
  MEETING_SCHEDULED  // Meeting set up
  INTERESTED         // Expressed interest
  REVIEWING_DOCS     // Reviewing LPA/subscription docs
  COMMITTED          // Verbally committed
  DOCS_SIGNED        // Subscription docs signed
  FUNDED             // Initial capital contributed
  INACTIVE           // No longer active in fund
  DECLINED           // Passed on investment
}

model InvestorContact {
  id          String   @id @default(cuid())
  investor    Investor @relation(fields: [investorId], references: [id], onDelete: Cascade)
  investorId  String
  name        String
  title       String?
  email       String?
  phone       String?
  isPrimary   Boolean  @default(false)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([investorId])
}

model InvestorDocument {
  id          String   @id @default(cuid())
  investor    Investor @relation(fields: [investorId], references: [id], onDelete: Cascade)
  investorId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  documentId  String
  sharedAt    DateTime @default(now())
  accessedAt  DateTime?

  @@unique([investorId, documentId])
}

// ============================================================================
// DEAL PIPELINE
// ============================================================================

model Deal {
  id                  String     @id @default(cuid())
  fund                Fund       @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId              String
  
  // Basic Info
  name                String     // Internal deal name
  companyName         String     // Target company name
  website             String?
  description         String?    @db.Text
  
  // Classification
  industry            String?
  subIndustry         String?
  businessModel       String?    // "B2B SaaS", "Manufacturing", etc.
  
  // Stage & Status
  stage               DealStage  @default(INITIAL_REVIEW)
  status              DealStatus @default(ACTIVE)
  
  // Sourcing
  source              DealSource? @relation(fields: [sourceId], references: [id])
  sourceId            String?
  sourceContact       String?    // Broker name, referrer, etc.
  sourceNotes         String?
  
  // Financials (Latest/Ask)
  askingPrice         Decimal?   @db.Decimal(15, 2)
  revenue             Decimal?   @db.Decimal(15, 2)  // LTM Revenue
  ebitda              Decimal?   @db.Decimal(15, 2)  // LTM EBITDA
  grossProfit         Decimal?   @db.Decimal(15, 2)
  netIncome           Decimal?   @db.Decimal(15, 2)
  
  // Calculated/Derived (stored for quick access)
  revenueMultiple     Decimal?   @db.Decimal(5, 2)
  ebitdaMultiple      Decimal?   @db.Decimal(5, 2)
  grossMargin         Decimal?   @db.Decimal(5, 4)
  ebitdaMargin        Decimal?   @db.Decimal(5, 4)
  
  // Company Details
  employeeCount       Int?
  yearFounded         Int?
  ownerAge            Int?       // Seller age (relevant for succession deals)
  ownershipStructure  String?    // "Sole proprietor", "Partnership", etc.
  
  // Location
  city                String?
  state               String?
  country             String     @default("USA")
  
  // Assessment Scores (1-10)
  attractivenessScore Int?       // Overall deal attractiveness
  fitScore            Int?       // Fit with search criteria
  riskScore           Int?       // Risk assessment
  
  // Investment Analysis
  investmentThesis    String?    @db.Text
  keyRisks            String?    @db.Text
  valueCreationPlan   String?    @db.Text
  competitivePosition String?    @db.Text
  
  // Key Dates
  firstContactDate    DateTime?
  ndaSignedDate       DateTime?
  cimReceivedDate     DateTime?
  managementMeetingDate DateTime?
  loiSubmittedDate    DateTime?
  loiAcceptedDate     DateTime?
  exclusivityStartDate DateTime?
  exclusivityEndDate  DateTime?
  expectedCloseDate   DateTime?
  actualCloseDate     DateTime?
  
  // Outcome (if passed/lost)
  passedDate          DateTime?
  passedReason        String?    @db.Text
  passedBy            String?    // User who made the decision
  
  // Notes
  nextSteps           String?    @db.Text
  internalNotes       String?    @db.Text
  
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  // Relations
  contacts            DealContact[]
  activities          Activity[]
  documents           Document[]
  tasks               Task[]
  dueDiligenceItems   DueDiligenceItem[]
  comments            Comment[]
  
  // Link to portfolio company if deal closed
  portfolioCompany    PortfolioCompany?

  @@index([fundId])
  @@index([stage])
  @@index([status])
  @@index([industry])
}

enum DealStage {
  // Early stages
  INITIAL_REVIEW        // Just added, quick review
  PRELIMINARY_ANALYSIS  // Deeper look at financials/fit
  MANAGEMENT_MEETING    // First call/meeting with seller
  
  // Middle stages
  NDA_CIM              // NDA signed, reviewing CIM
  SITE_VISIT           // On-site visit scheduled/completed
  LOI_PREPARATION      // Preparing letter of intent
  LOI_NEGOTIATION      // LOI submitted, negotiating terms
  
  // Late stages
  DUE_DILIGENCE        // Full DD in progress
  FINAL_NEGOTIATION    // Final terms, SPA negotiation
  CLOSING              // Preparing to close
  
  // Terminal stages
  CLOSED               // Deal closed successfully
  PASSED               // Decided not to pursue
}

enum DealStatus {
  ACTIVE     // Currently being worked
  ON_HOLD    // Paused (waiting on seller, etc.)
  PASSED     // Decided not to pursue
  LOST       // Seller chose another buyer
  WON        // Deal closed
}

model DealSource {
  id          String   @id @default(cuid())
  name        String   @unique
  type        DealSourceType
  description String?
  contactName String?
  contactEmail String?
  contactPhone String?
  website     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  deals       Deal[]
}

enum DealSourceType {
  BROKER              // Business broker
  INVESTMENT_BANK     // Investment bank
  DIRECT_OUTREACH     // Cold outreach to owners
  REFERRAL_NETWORK    // Personal/professional network
  REFERRAL_INVESTOR   // LP referral
  ONLINE_MARKETPLACE  // BizBuySell, Axial, etc.
  CONFERENCE          // Industry conference
  ADVISOR             // Accountant, lawyer referral
  INBOUND             // Seller reached out
  OTHER
}

model DealContact {
  id          String   @id @default(cuid())
  deal        Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  dealId      String
  name        String
  title       String?
  email       String?
  phone       String?
  company     String?  // If different from deal company
  role        DealContactRole
  isPrimary   Boolean  @default(false)
  notes       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([dealId])
}

enum DealContactRole {
  OWNER           // Business owner/seller
  CO_OWNER        // Co-owner
  MANAGEMENT      // Key management (non-owner)
  BROKER          // Sell-side broker
  ATTORNEY        // Seller's attorney
  ACCOUNTANT      // Seller's accountant
  ADVISOR         // Other advisor
  OTHER
}

model DueDiligenceItem {
  id          String     @id @default(cuid())
  deal        Deal       @relation(fields: [dealId], references: [id], onDelete: Cascade)
  dealId      String
  category    DDCategory
  subcategory String?
  item        String     // Description of the DD item
  status      DDStatus   @default(NOT_STARTED)
  priority    Int        @default(3) // 1=Critical, 2=High, 3=Medium, 4=Low
  assignedTo  String?    // User name or external party
  dueDate     DateTime?
  completedAt DateTime?
  
  // Findings
  notes       String?    @db.Text
  findings    String?    @db.Text
  redFlag     Boolean    @default(false)
  flagNotes   String?    @db.Text
  
  // Documents
  requestedDocs String?  @db.Text // Docs requested from seller
  receivedDocs  Boolean  @default(false)
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([dealId])
  @@index([category])
  @@index([status])
}

enum DDCategory {
  FINANCIAL          // Financial statements, projections
  ACCOUNTING         // Accounting policies, audit findings
  TAX                // Tax returns, structure
  LEGAL              // Contracts, litigation, corporate docs
  COMMERCIAL         // Customers, market, competition
  OPERATIONAL        // Operations, processes, supply chain
  HR                 // Employees, benefits, culture
  IT                 // Systems, security, tech stack
  ENVIRONMENTAL      // Environmental compliance
  INSURANCE          // Insurance coverage
  REAL_ESTATE        // Facilities, leases
  IP                 // Intellectual property
  REGULATORY         // Licenses, permits, compliance
  QUALITY            // Quality control, certifications
  OTHER
}

enum DDStatus {
  NOT_STARTED     // Haven't begun
  IN_PROGRESS     // Working on it
  PENDING_INFO    // Waiting for information
  UNDER_REVIEW    // Info received, reviewing
  COMPLETED       // Done
  NA              // Not applicable
}

// ============================================================================
// PORTFOLIO COMPANIES
// ============================================================================

model PortfolioCompany {
  id                  String          @id @default(cuid())
  fund                Fund            @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId              String
  
  // Link to source deal
  sourceDeal          Deal?           @relation(fields: [sourceDealId], references: [id])
  sourceDealId        String?         @unique
  
  // Basic Info
  name                String
  legalName           String?
  website             String?
  description         String?         @db.Text
  industry            String?
  
  // Investment Details
  acquisitionDate     DateTime
  acquisitionPrice    Decimal         @db.Decimal(15, 2) // Total enterprise value
  equityInvested      Decimal         @db.Decimal(15, 2) // Equity from fund
  debtUsed            Decimal         @db.Decimal(15, 2) @default(0) // Acquisition debt
  sellerNote          Decimal         @db.Decimal(15, 2) @default(0) // Seller financing
  earnout             Decimal         @db.Decimal(15, 2) @default(0) // Contingent earnout
  workingCapital      Decimal?        @db.Decimal(15, 2) // Working capital at close
  
  // Ownership
  ownershipPct        Decimal         @db.Decimal(5, 4)  // Fund ownership %
  fullyDilutedShares  Int?
  
  // Current Status
  status              PortfolioStatus @default(ACTIVE)
  
  // Location
  headquarters        String?
  employeeCount       Int?
  
  // Key People
  ceo                 String?
  cfo                 String?
  boardChair          String?
  
  // Exit Details (when applicable)
  exitDate            DateTime?
  exitType            ExitType?
  exitValue           Decimal?        @db.Decimal(15, 2)
  exitMultiple        Decimal?        @db.Decimal(5, 2)  // Exit value / equity invested
  
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  // Relations
  financials          PortfolioFinancial[]
  kpis                PortfolioKPI[]
  valuations          Valuation[]
  initiatives         StrategicInitiative[]
  documents           Document[]
  boardMeetings       BoardMeeting[]
  tasks               Task[]

  @@index([fundId])
  @@index([status])
}

enum PortfolioStatus {
  ACTIVE              // Normal operations
  OUTPERFORMING       // Exceeding plan
  ON_PLAN             // Meeting expectations
  UNDERPERFORMING     // Below expectations
  TURNAROUND          // Active turnaround effort
  PREPARING_EXIT      // Preparing for sale
  EXITED              // Sold/exited
}

enum ExitType {
  STRATEGIC_SALE      // Sale to strategic buyer
  PE_SALE             // Sale to financial buyer
  IPO                 // Initial public offering
  RECAPITALIZATION    // Dividend recap
  MANAGEMENT_BUYOUT   // Sale to management
  MERGER              // Merger with another company
  LIQUIDATION         // Wind down
  WRITE_OFF           // Total loss
}

model PortfolioFinancial {
  id            String           @id @default(cuid())
  company       PortfolioCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId     String
  
  // Period Definition
  period        DateTime         // First day of the period
  periodType    PeriodType
  isActual      Boolean          @default(true) // true=actual, false=budget/forecast
  
  // Income Statement
  revenue       Decimal          @db.Decimal(15, 2)
  cogs          Decimal?         @db.Decimal(15, 2)
  grossProfit   Decimal?         @db.Decimal(15, 2)
  opex          Decimal?         @db.Decimal(15, 2)
  ebitda        Decimal?         @db.Decimal(15, 2)
  depreciation  Decimal?         @db.Decimal(15, 2)
  amortization  Decimal?         @db.Decimal(15, 2)
  interestExp   Decimal?         @db.Decimal(15, 2)
  taxExpense    Decimal?         @db.Decimal(15, 2)
  netIncome     Decimal?         @db.Decimal(15, 2)
  
  // Balance Sheet (optional, period-end)
  cash          Decimal?         @db.Decimal(15, 2)
  accountsRecv  Decimal?         @db.Decimal(15, 2)
  inventory     Decimal?         @db.Decimal(15, 2)
  totalAssets   Decimal?         @db.Decimal(15, 2)
  accountsPay   Decimal?         @db.Decimal(15, 2)
  totalDebt     Decimal?         @db.Decimal(15, 2)
  equity        Decimal?         @db.Decimal(15, 2)
  
  // Cash Flow (optional)
  operatingCF   Decimal?         @db.Decimal(15, 2)
  investingCF   Decimal?         @db.Decimal(15, 2)
  financingCF   Decimal?         @db.Decimal(15, 2)
  
  // Calculated Metrics (stored for reporting)
  revenueGrowth Decimal?         @db.Decimal(5, 4)  // vs prior period
  grossMargin   Decimal?         @db.Decimal(5, 4)
  ebitdaMargin  Decimal?         @db.Decimal(5, 4)
  
  notes         String?          @db.Text
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@unique([companyId, period, periodType, isActual])
  @@index([companyId])
  @@index([period])
}

enum PeriodType {
  MONTHLY
  QUARTERLY
  ANNUAL
}

model PortfolioKPI {
  id          String           @id @default(cuid())
  company     PortfolioCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId   String
  
  name        String           // KPI name
  category    String?          // "Sales", "Operations", "Customer", etc.
  description String?
  
  value       Decimal          @db.Decimal(15, 4)
  unit        String?          // "%", "$", "count", etc.
  date        DateTime
  
  target      Decimal?         @db.Decimal(15, 4)
  priorValue  Decimal?         @db.Decimal(15, 4) // Prior period for comparison
  
  notes       String?
  createdAt   DateTime         @default(now())

  @@index([companyId, name, date])
  @@index([companyId])
}

model Valuation {
  id            String           @id @default(cuid())
  company       PortfolioCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId     String
  
  date          DateTime
  value         Decimal          @db.Decimal(15, 2) // Enterprise value
  equityValue   Decimal?         @db.Decimal(15, 2) // Equity value
  
  methodology   ValuationMethod
  
  // Key Assumptions (stored as JSON for flexibility)
  assumptions   Json?            // { discountRate, terminalGrowth, comparables, etc. }
  
  // Multiples Used
  revenueMultiple Decimal?       @db.Decimal(5, 2)
  ebitdaMultiple  Decimal?       @db.Decimal(5, 2)
  
  // Process
  preparedBy    String?
  reviewedBy    String?
  approvedBy    String?
  approvedAt    DateTime?
  
  isOfficial    Boolean          @default(false) // For LP reporting
  notes         String?          @db.Text
  
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  // Relations
  documents     Document[]

  @@index([companyId])
  @@index([date])
}

enum ValuationMethod {
  DCF                     // Discounted cash flow
  COMPARABLE_COMPANIES    // Public company comparables
  COMPARABLE_TRANSACTIONS // M&A transaction comparables
  ASSET_BASED            // Net asset value
  LBO_ANALYSIS           // LBO returns analysis
  REVENUE_MULTIPLE       // Simple revenue multiple
  EBITDA_MULTIPLE        // Simple EBITDA multiple
  MANAGEMENT_ESTIMATE    // Management/board estimate
  THIRD_PARTY            // External valuation firm
  COST_BASIS             // Original investment cost
}

model StrategicInitiative {
  id          String           @id @default(cuid())
  company     PortfolioCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId   String
  
  name        String
  description String?          @db.Text
  category    InitiativeCategory
  status      InitiativeStatus @default(PLANNED)
  priority    Int              @default(3) // 1=Critical, 5=Nice-to-have
  
  // Ownership
  owner       String?          // Primary responsible person
  sponsor     String?          // Executive sponsor
  
  // Timeline
  startDate   DateTime?
  targetDate  DateTime?
  completedAt DateTime?
  
  // Impact
  expectedImpact    String?    @db.Text
  actualImpact      String?    @db.Text
  estimatedValue    Decimal?   @db.Decimal(15, 2) // Expected $ impact
  actualValue       Decimal?   @db.Decimal(15, 2) // Realized $ impact
  
  // Progress
  percentComplete   Int?       // 0-100
  milestones        Json?      // Array of milestone objects
  
  notes       String?          @db.Text
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([companyId])
  @@index([status])
}

enum InitiativeCategory {
  REVENUE_GROWTH          // Sales, marketing, new products
  COST_REDUCTION          // Efficiency, procurement
  OPERATIONAL             // Process improvement
  TECHNOLOGY              // IT, systems
  TALENT                  // Hiring, training
  M_AND_A                 // Add-on acquisitions
  GEOGRAPHIC_EXPANSION    // New markets
  CUSTOMER_SUCCESS        // Retention, satisfaction
  OTHER
}

enum InitiativeStatus {
  PLANNED       // Defined but not started
  IN_PROGRESS   // Actively working
  ON_HOLD       // Paused
  COMPLETED     // Successfully finished
  CANCELLED     // Abandoned
}

model BoardMeeting {
  id          String           @id @default(cuid())
  company     PortfolioCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId   String
  
  date        DateTime
  type        BoardMeetingType @default(REGULAR)
  location    String?          // "Virtual", address, etc.
  duration    Int?             // Minutes
  
  // Content
  agenda      String?          @db.Text
  minutes     String?          @db.Text
  decisions   String?          @db.Text
  
  // Attendees (stored as JSON for flexibility)
  attendees   Json?            // Array of { name, role, attended }
  
  // Follow-up
  actionItems Json?            // Array of { item, owner, dueDate, status }
  
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  // Relations
  documents   Document[]

  @@index([companyId])
  @@index([date])
}

enum BoardMeetingType {
  REGULAR           // Scheduled board meeting
  SPECIAL           // Special/emergency meeting
  ANNUAL            // Annual meeting
  STRATEGY          // Strategy session
  AUDIT_COMMITTEE   // Audit committee meeting
  COMPENSATION      // Compensation committee
}

// ============================================================================
// CAPITAL MANAGEMENT
// ============================================================================

model CapitalCall {
  id            String            @id @default(cuid())
  fund          Fund              @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId        String
  
  callNumber    Int               // Sequential number
  callDate      DateTime          // Date of the call
  dueDate       DateTime          // Payment due date
  
  totalAmount   Decimal           @db.Decimal(15, 2)
  purpose       String            // "Acquisition of XYZ", "Operating expenses", etc.
  purposeDetail String?           @db.Text
  
  status        CapitalCallStatus @default(DRAFT)
  
  // Notices
  noticeSentAt  DateTime?
  noticeFileUrl String?
  
  notes         String?           @db.Text
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  // Relations
  items         CapitalCallItem[]
  documents     Document[]
  transactions  CapitalTransaction[]

  @@index([fundId])
  @@index([status])
}

enum CapitalCallStatus {
  DRAFT              // Being prepared
  PENDING_APPROVAL   // Awaiting internal approval
  SENT               // Notices sent to LPs
  PARTIALLY_FUNDED   // Some payments received
  FULLY_FUNDED       // All payments received
  CANCELLED          // Cancelled
}

model CapitalCallItem {
  id            String         @id @default(cuid())
  capitalCall   CapitalCall    @relation(fields: [capitalCallId], references: [id], onDelete: Cascade)
  capitalCallId String
  investor      Investor       @relation(fields: [investorId], references: [id], onDelete: Cascade)
  investorId    String
  
  // Amounts
  calledAmount  Decimal        @db.Decimal(15, 2) // Amount called
  paidAmount    Decimal        @db.Decimal(15, 2) @default(0) // Amount received
  
  // Payment tracking
  status        CapitalCallItemStatus @default(PENDING)
  paidDate      DateTime?
  paymentMethod String?        // "Wire", "ACH", "Check"
  paymentRef    String?        // Reference number
  
  notes         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([capitalCallId, investorId])
  @@index([capitalCallId])
  @@index([investorId])
  @@index([status])
}

enum CapitalCallItemStatus {
  PENDING     // Awaiting payment
  PARTIAL     // Partially paid
  PAID        // Fully paid
  OVERDUE     // Past due date
  DEFAULTED   // LP in default
  WAIVED      // Waived/forgiven
}

model Distribution {
  id              String           @id @default(cuid())
  fund            Fund             @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId          String
  
  distributionNum Int              // Sequential number
  date            DateTime
  
  totalAmount     Decimal          @db.Decimal(15, 2)
  type            DistributionType
  source          String?          // "Operating income", "Exit proceeds", etc.
  
  // Waterfall Breakdown
  returnOfCapital     Decimal?     @db.Decimal(15, 2)
  preferredReturn     Decimal?     @db.Decimal(15, 2)
  gpCatchUp           Decimal?     @db.Decimal(15, 2)
  carriedInterest     Decimal?     @db.Decimal(15, 2)
  lpShare             Decimal?     @db.Decimal(15, 2)
  
  // Notices
  noticeSentAt    DateTime?
  noticeFileUrl   String?
  
  notes           String?          @db.Text
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  items           DistributionItem[]
  transactions    CapitalTransaction[]

  @@index([fundId])
}

enum DistributionType {
  RETURN_OF_CAPITAL      // Return of invested capital
  OPERATING_DISTRIBUTION // From portfolio company operations
  EXIT_PROCEEDS          // From exit/sale
  DIVIDEND               // Dividend distribution
  INTERIM                // Interim/partial distribution
  FINAL                  // Final liquidating distribution
  OTHER
}

model DistributionItem {
  id              String       @id @default(cuid())
  distribution    Distribution @relation(fields: [distributionId], references: [id], onDelete: Cascade)
  distributionId  String
  investor        Investor     @relation(fields: [investorId], references: [id], onDelete: Cascade)
  investorId      String
  
  grossAmount     Decimal      @db.Decimal(15, 2)
  withholdingTax  Decimal      @db.Decimal(15, 2) @default(0)
  netAmount       Decimal      @db.Decimal(15, 2)
  
  // Waterfall components for this LP
  returnOfCapital Decimal?     @db.Decimal(15, 2)
  preferredReturn Decimal?     @db.Decimal(15, 2)
  profitShare     Decimal?     @db.Decimal(15, 2)
  
  // Payment tracking
  paidDate        DateTime?
  paymentMethod   String?
  paymentRef      String?
  
  notes           String?
  createdAt       DateTime     @default(now())

  @@unique([distributionId, investorId])
  @@index([distributionId])
  @@index([investorId])
}

// Capital Transaction - Audit trail for all capital movements
model CapitalTransaction {
  id            String          @id @default(cuid())
  fund          Fund            @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId        String
  investor      Investor        @relation(fields: [investorId], references: [id], onDelete: Cascade)
  investorId    String
  
  type          TransactionType
  amount        Decimal         @db.Decimal(15, 2) // Positive = contribution, Negative = distribution
  date          DateTime
  
  // Reference to source
  capitalCallId   String?
  capitalCall     CapitalCall?    @relation(fields: [capitalCallId], references: [id])
  distributionId  String?
  distribution    Distribution?   @relation(fields: [distributionId], references: [id])
  
  description   String?
  notes         String?
  
  createdAt     DateTime        @default(now())

  @@index([fundId])
  @@index([investorId])
  @@index([type])
  @@index([date])
}

enum TransactionType {
  CONTRIBUTION        // Capital contribution from LP
  DISTRIBUTION        // Distribution to LP
  MANAGEMENT_FEE      // Management fee charge
  FUND_EXPENSE        // Other fund expense allocation
  ADJUSTMENT          // Manual adjustment
  TRANSFER            // Transfer between investors (rare)
}

// ============================================================================
// DOCUMENTS
// ============================================================================

model Document {
  id            String           @id @default(cuid())
  
  // File Info
  name          String           // Display name
  fileName      String           // Original filename
  fileUrl       String           // Storage URL
  fileType      String           // MIME type
  fileSize      Int              // Bytes
  
  // Classification
  category      DocumentCategory
  subcategory   String?
  tags          String[]
  
  // Ownership - Polymorphic (only one should be set)
  fund              Fund?             @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId            String?
  deal              Deal?             @relation(fields: [dealId], references: [id], onDelete: Cascade)
  dealId            String?
  portfolioCompany  PortfolioCompany? @relation(fields: [portfolioCompanyId], references: [id], onDelete: Cascade)
  portfolioCompanyId String?
  capitalCall       CapitalCall?      @relation(fields: [capitalCallId], references: [id], onDelete: Cascade)
  capitalCallId     String?
  boardMeeting      BoardMeeting?     @relation(fields: [boardMeetingId], references: [id], onDelete: Cascade)
  boardMeetingId    String?
  valuation         Valuation?        @relation(fields: [valuationId], references: [id], onDelete: Cascade)
  valuationId       String?
  
  // Versioning
  version       Int              @default(1)
  parentId      String?          // Original document for versions
  parent        Document?        @relation("DocumentVersions", fields: [parentId], references: [id])
  versions      Document[]       @relation("DocumentVersions")
  isLatest      Boolean          @default(true)
  
  // Access Control
  isConfidential Boolean         @default(false)
  visibleToLPs   Boolean         @default(false)
  
  // Metadata
  description   String?
  uploadedBy    String           // User ID
  uploadedByName String?         // User name for display
  
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  // Relations
  investorDocuments InvestorDocument[]

  @@index([fundId])
  @@index([dealId])
  @@index([portfolioCompanyId])
  @@index([category])
}

enum DocumentCategory {
  // Fund Level
  FUND_FORMATION       // LPA, subscription docs, side letters
  INVESTOR_COMMS       // Investor letters, updates
  TAX                  // K-1s, tax returns
  COMPLIANCE           // Compliance documents
  
  // Deal Level
  CIM                  // Confidential information memorandum
  NDA                  // Non-disclosure agreement
  FINANCIAL_STATEMENTS // Target financials
  LOI                  // Letter of intent
  TERM_SHEET           // Deal terms
  DUE_DILIGENCE        // DD reports and materials
  PURCHASE_AGREEMENT   // SPA, APA
  CLOSING_DOCS         // Closing documents
  
  // Portfolio Level
  BOARD_MATERIALS      // Board decks, presentations
  OPERATING_REPORTS    // Monthly/quarterly reports
  BUDGET               // Budgets and forecasts
  STRATEGIC_PLAN       // Strategic planning docs
  
  // General
  LEGAL                // General legal documents
  OTHER
}

// ============================================================================
// ACTIVITY & COMMUNICATIONS
// ============================================================================

model Activity {
  id          String       @id @default(cuid())
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  
  // Context - Polymorphic
  deal        Deal?        @relation(fields: [dealId], references: [id], onDelete: Cascade)
  dealId      String?
  
  type        ActivityType
  title       String
  description String?      @db.Text
  
  // Additional Data
  metadata    Json?        // Flexible storage for activity-specific data
  
  createdAt   DateTime     @default(now())

  @@index([dealId])
  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

enum ActivityType {
  NOTE              // General note
  CALL              // Phone/video call
  EMAIL_SENT        // Email sent
  EMAIL_RECEIVED    // Email received
  MEETING           // In-person or virtual meeting
  SITE_VISIT        // On-site visit
  DOCUMENT_SENT     // Document sent
  DOCUMENT_RECEIVED // Document received
  STAGE_CHANGE      // Deal stage changed
  STATUS_CHANGE     // Status changed
  TASK_COMPLETED    // Task completed
  COMMENT           // Comment added
  OTHER
}

model Communication {
  id          String   @id @default(cuid())
  investor    Investor @relation(fields: [investorId], references: [id], onDelete: Cascade)
  investorId  String
  
  type        CommunicationType
  direction   CommunicationDirection
  subject     String?
  content     String?  @db.Text
  date        DateTime
  
  // Participants
  contactName String?  // Who at the investor
  sentBy      String?  // Our team member
  
  // Follow-up
  followUpDate DateTime?
  followUpDone Boolean  @default(false)
  
  notes       String?  @db.Text
  createdAt   DateTime @default(now())

  @@index([investorId])
  @@index([date])
}

enum CommunicationType {
  EMAIL
  CALL
  MEETING
  VIDEO_CALL
  TEXT
  OTHER
}

enum CommunicationDirection {
  INBOUND   // Received from investor
  OUTBOUND  // Sent to investor
}

model Comment {
  id          String   @id @default(cuid())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  
  // Context - Polymorphic (add more as needed)
  deal        Deal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)
  dealId      String?
  
  content     String   @db.Text
  
  // Threading
  parentId    String?
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([dealId])
  @@index([userId])
}

model Task {
  id          String     @id @default(cuid())
  
  // Assignment
  assignee    User       @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: Cascade)
  assigneeId  String
  createdBy   User       @relation("TaskCreator", fields: [createdById], references: [id], onDelete: Cascade)
  createdById String
  
  // Context - Polymorphic
  deal        Deal?      @relation(fields: [dealId], references: [id], onDelete: Cascade)
  dealId      String?
  company     PortfolioCompany? @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId   String?
  
  title       String
  description String?    @db.Text
  status      TaskStatus @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  
  dueDate     DateTime?
  completedAt DateTime?
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([assigneeId])
  @@index([dealId])
  @@index([companyId])
  @@index([status])
  @@index([dueDate])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  URGENT    // Do immediately
  HIGH      // Do soon
  MEDIUM    // Normal priority
  LOW       // When time permits
}

model Notification {
  id          String           @id @default(cuid())
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  
  type        NotificationType
  title       String
  message     String
  link        String?          // URL to relevant page
  
  isRead      Boolean          @default(false)
  readAt      DateTime?
  
  createdAt   DateTime         @default(now())

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_DUE
  TASK_OVERDUE
  DEAL_STAGE_CHANGE
  CAPITAL_CALL_DUE
  DISTRIBUTION_MADE
  DOCUMENT_SHARED
  COMMENT_ADDED
  REPORT_PUBLISHED
  SYSTEM
}

// ============================================================================
// REPORTS
// ============================================================================

model Report {
  id          String       @id @default(cuid())
  fund        Fund         @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId      String
  
  type        ReportType
  title       String
  
  // Period
  periodStart DateTime?
  periodEnd   DateTime?
  
  // Content
  content     Json?        // Structured report content
  fileUrl     String?      // Generated PDF URL
  
  // Status
  status      ReportStatus @default(DRAFT)
  
  // Publishing
  publishedAt DateTime?
  publishedBy String?
  
  // Distribution
  sentToLPs   Boolean      @default(false)
  sentAt      DateTime?
  
  notes       String?      @db.Text
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([fundId])
  @@index([type])
  @@index([status])
}

enum ReportType {
  QUARTERLY_UPDATE     // Quarterly investor letter
  ANNUAL_REPORT        // Annual report
  CAPITAL_CALL_NOTICE  // Capital call notice
  DISTRIBUTION_NOTICE  // Distribution notice
  K1                   // K-1 tax document
  FINANCIAL_STATEMENT  // Fund financials
  PORTFOLIO_SUMMARY    // Portfolio overview
  CUSTOM               // Custom report
}

enum ReportStatus {
  DRAFT
  REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
}

// ============================================================================
// AUDIT LOG
// ============================================================================

model AuditLog {
  id          String   @id @default(cuid())
  
  // Who
  user        User?    @relation(fields: [userId], references: [id])
  userId      String?
  userName    String?  // Stored for historical record
  
  // What
  action      AuditAction
  entityType  String   // "Deal", "Investor", "PortfolioCompany", etc.
  entityId    String
  entityName  String?  // Human-readable name for display
  
  // Changes
  changes     Json?    // { field: { old: x, new: y } }
  metadata    Json?    // Additional context
  
  // Where
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VIEW       // For sensitive data access
  EXPORT     // Data export
  LOGIN
  LOGOUT
  FAILED_LOGIN
}
```

---

## Entity Relationship Summary

```
Fund
 ├── FundMember (many) ──── User
 ├── Investor (many)
 │    ├── InvestorContact (many)
 │    ├── CapitalCallItem (many)
 │    ├── DistributionItem (many)
 │    ├── Communication (many)
 │    ├── CapitalTransaction (many)
 │    └── User (optional - portal access)
 ├── Deal (many)
 │    ├── DealContact (many)
 │    ├── DueDiligenceItem (many)
 │    ├── Activity (many)
 │    ├── Document (many)
 │    ├── Task (many)
 │    ├── Comment (many)
 │    └── PortfolioCompany (optional - if closed)
 ├── PortfolioCompany (many)
 │    ├── PortfolioFinancial (many)
 │    ├── PortfolioKPI (many)
 │    ├── Valuation (many)
 │    ├── StrategicInitiative (many)
 │    ├── BoardMeeting (many)
 │    ├── Document (many)
 │    └── Task (many)
 ├── CapitalCall (many)
 │    ├── CapitalCallItem (many)
 │    └── Document (many)
 ├── Distribution (many)
 │    └── DistributionItem (many)
 ├── CapitalTransaction (many)
 ├── Document (many)
 └── Report (many)
```

---

## Indexes Summary

The schema includes indexes for:

1. **Foreign keys:** All relation fields are indexed for join performance
2. **Status/Stage fields:** For filtering by workflow state
3. **Date fields:** For time-based queries and sorting
4. **Composite keys:** For unique constraints on join tables

---

## Migration Notes

When setting up the database:

1. Run `npx prisma migrate dev --name init` to create initial migration
2. Run `npx prisma generate` to generate the Prisma client
3. Use `npx prisma db seed` to populate initial data (e.g., deal stages, DD templates)

---

## Next Steps

See the following documents for how these models are used:
- `03_Module_Deals.md` - Deal pipeline operations
- `04_Module_Investors.md` - Investor management
- `05_Module_Portfolio.md` - Portfolio company operations
- `06_Module_Capital.md` - Capital calls and distributions
- `08_Business_Rules.md` - Validation rules and constraints
