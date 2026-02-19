# Multi-Tenant Architecture: PE Firm + Subdomain Routing

**Date:** 2026-02-18
**Status:** DESIGN — Pending approval
**Scope:** Organization model, subdomain routing, onboarding, Fund field expansion
**Spec Reference:** "Especificación Técnica: Plataforma de Gestión de Fondos de Inversión v1.0"

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Gap Analysis: Spec vs Status Quo](#2-gap-analysis)
3. [Architecture Decision](#3-architecture-decision)
4. [Schema Design](#4-schema-design)
5. [Subdomain Routing](#5-subdomain-routing)
6. [Auth & Session Changes](#6-auth--session-changes)
7. [RBAC Integration](#7-rbac-integration)
8. [Onboarding Flow](#8-onboarding-flow)
9. [Data Layer Changes](#9-data-layer-changes)
10. [Migration Strategy](#10-migration-strategy)
11. [Infrastructure Changes](#11-infrastructure-changes)
12. [Implementation Phases](#12-implementation-phases)
13. [Risks & Mitigations](#13-risks--mitigations)

---

## 1. Executive Summary

BlackGem currently operates as a **single-instance multi-fund** platform. All funds, users, and investors exist in a flat namespace. The spec requires a **3-tier hierarchy** (PE Firm → Fund → Investor) with **subdomain-based tenancy** (`{fund-slug}.blackgem.ai`).

### What exists today (strengths)

| Area | Status | Commit |
|------|--------|--------|
| Investor fund isolation via Commitment bridge | IMPLEMENTED | `02ce6ec` |
| Granular RBAC (7 modules, 5 fund roles) | IMPLEMENTED | `02ce6ec` |
| Role hierarchy validation (UserRole → FundMemberRole) | IMPLEMENTED | `dc27532` |
| LP portal with cockpit isolation | IMPLEMENTED | Existing |
| Deal pipeline (18 stages) | IMPLEMENTED | Existing |
| Portfolio management + valuations | IMPLEMENTED | Existing |
| Capital calls/distributions per investor | IMPLEMENTED | Existing |
| Document versioning with LP visibility | IMPLEMENTED | Existing |
| Soft deletes on all core entities | IMPLEMENTED | Existing |
| Audit logging with change diffs | IMPLEMENTED | Existing |

### What needs to be built

| Area | Priority | Complexity |
|------|----------|------------|
| Organization (PE Firm) model | CRITICAL | HIGH |
| Subdomain routing middleware | CRITICAL | HIGH |
| Fund field expansion (strategy, dates, lifecycle) | HIGH | LOW |
| Onboarding flow (self-service by vehicle type) | HIGH | MEDIUM |
| Cross-subdomain auth (cookie domain) | HIGH | MEDIUM |
| Organization settings UI | MEDIUM | MEDIUM |
| Banking model | MEDIUM | MEDIUM |
| Security config (SSO, IP allowlist) | LOW | HIGH |

---

## 2. Gap Analysis

### 2.1 Spec §4 — PE Firm (NIVEL 1)

| Section | Spec Fields | BlackGem Today | Gap |
|---------|-------------|----------------|-----|
| §4.1 Legal/Corporate | legal_name, entity_type, jurisdiction, tax_id, lei_code, regulatory_status, sec_file_number, total_aum, date_of_formation | No Organization model exists. Fund is the highest-level entity. | **CRITICAL** — New model required |
| §4.2 Contact/Location | headquarters_address, mailing_address, primary_contact_*, investor_relations_email, website_url, logo_url | No entity to host these fields | **CRITICAL** |
| §4.3 Operational Config | firm_strategies, target_geographies, target_sectors, base_currency, fiscal_year_end, reporting_frequency, base_time_zone | No firm-level config. `currency` exists only on Fund. | **CRITICAL** |
| §4.4 Superadmin Users | seed users with MFA | `SUPER_ADMIN` role exists. MFA not implemented. | **PARTIAL** |
| §4.5 Banking Info | bank_name, account_holder, IBAN/SWIFT | No banking model | **GAP** |
| §4.6 Legal Documents | operating_agreement, ppm_template, lpa_template, distribution_waterfall | Document model covers some categories. No template system or waterfall JSON. | **PARTIAL** |
| §4.7 Security/Compliance | data_residency, kyc_provider, aml_screening, sso_enabled, ip_allowlist | KYC/AML exist on Investor only. No firm-level security config. | **GAP** |

### 2.2 Spec §5 — Fund (NIVEL 2)

| Section | Spec Fields | BlackGem Today | Gap |
|---------|-------------|----------------|-----|
| §5.1 Identification | fund_nickname, legal_name, vintage, entity_type, jurisdiction, tax_id | `name`, `legalName`, `vintage` exist. Missing `tax_id`, `jurisdiction` at Fund level. `slug` exists (maps to `fund_nickname`). | **MOSTLY OK** |
| §5.2 Strategy/Focus | strategy, investment_stage, target_sectors, target_geographies, check_size_min/max, fund_currency | Only `currency` and `description` (free text) exist. No structured strategy fields. | **PARTIAL** |
| §5.3 Lifecycle/Status | status (6 states), launch_date, close dates, investment_period_end, fund_term_years | `FundStatus` has 9 states (more granular). Missing lifecycle dates. | **PARTIAL** |
| §5.4 Capital/Finance | target_fund_size, management_fee, carry, hurdle | All exist + `catchUpRate`, `hardCap`, `minimumCommitment` (extra). called/distributed/nav are derived — correct by design. | **GOOD** |
| §5.5 Team (RBAC) | Fund Managers, Analysts, Viewers | `FundMember` with 5 roles + 7 module permissions + hierarchy validation. More granular than spec. | **SUPERIOR** |
| §5.6 Investors/LPs | Many-to-many via commitments, isolation | `Commitment` bridge table, fund-scoped queries, subscription docs tracking. | **SUPERIOR** |
| §5.7 Documents | PPM, LPA, subscription, quarterly, capital call/distribution notices | `Document` with 18 categories, versioning, `visibleToLPs`. More complete. | **SUPERIOR** |
| §5.8 Specific Config | capital_call_notice_days, reporting_modules_enabled, deal_flow_pipeline | `permissions` on FundMember covers reporting modules partially. Missing notice days and pipeline config. | **PARTIAL** |

### 2.3 Spec §6 — Search Funds

| Aspect | Spec | BlackGem Today | Gap |
|--------|------|----------------|-----|
| Simplified fields (15-20) | Yes | Fund model has ~15 fields (roughly aligned) | **OK** |
| Vehicle types | TRADITIONAL_SEARCH_FUND, SELF_FUNDED_SEARCH | `FundType` enum includes both + ACCELERATOR_FUND | **OK** |
| Onboarding flow | Differentiated by type | No onboarding flow exists (seed data only) | **GAP** |

### 2.4 Spec §8 — RBAC Matrix

| Spec Role | BlackGem Equivalent | Status |
|-----------|-------------------|--------|
| Superadmin → global access | `SUPER_ADMIN` / `FUND_ADMIN` | **IMPLEMENTED** |
| Fund Manager → fund-scoped | `FundMember` with PRINCIPAL/CO_PRINCIPAL | **IMPLEMENTED** |
| Analyst → fund-scoped | `FundMember` with ANALYST role | **IMPLEMENTED** |
| Viewer → read-only | No explicit VIEWER role. ADVISOR is closest. | **MINOR GAP** |
| LP → portal only | `LP_PRIMARY`/`LP_VIEWER` redirect to `/portal` | **IMPLEMENTED** |
| Hierarchy enforcement | `ALLOWED_FUND_ROLES` + `validateFundMemberRole()` | **SUPERIOR** |
| Module permissions | 7 modules on `FundMember.permissions` | **SUPERIOR** |

### 2.5 Where BlackGem is SUPERIOR to Spec

1. **RBAC granularity** — 5 fund roles + 7 module permissions + hierarchy validation vs spec's 4 roles
2. **Investor compliance** — `AccreditedStatus` (6 values), `KYCStatus`, `AMLStatus` on Investor vs spec's boolean
3. **Deal pipeline** — 18 stages, due diligence items, tasks, comments, contacts (not in spec)
4. **Portfolio management** — Metrics tracking, valuations, exit tracking with 8 exit types (not in spec)
5. **Document versioning** — `version`, `isLatest`, `parentId` (spec only mentions upload)
6. **Capital flow tracking** — CapitalCall → CapitalCallItem and Distribution → DistributionItem per investor (more granular)
7. **Soft deletes** — All core entities (not in spec)
8. **Audit logging** — Complete with change diffs (not in spec)

---

## 3. Architecture Decision

### Decision: 3-Tier Hierarchy with Flat Subdomain

```
Organization (PE Firm)
├── slug → {slug}.blackgem.ai        ← subdomain routing
├── Fund[]                            ← organizationId FK
└── User[]                            ← organizationId FK
```

### URL Strategy (MVP — Option B: Flat Subdomain)

```
{fund-slug}.blackgem.ai              ← All funds (PE and Search)
blackgem.ai                          ← Landing / Login / Onboarding
```

**Rationale:** Agreed during brainstorming. Fund slug in subdomain. PE Firm association resolved from Fund in DB, not in URL. Simplifies DNS (single `*.blackgem.ai` wildcard), SSL (one wildcard cert), and cookies (`.blackgem.ai` domain).

**Future evolution (Option C):** If a PE Firm needs a branded experience, the subdomain could become `{firm-slug}.blackgem.ai` with fund selection inside. The data model supports this — `Organization.slug` is ready. The only change would be middleware routing logic.

### Vehicle Types & Complexity

| Type | Organization | Funds | Onboarding Fields | Complexity |
|------|-------------|-------|-------------------|------------|
| Search Fund | 1 firm (auto-created) | 1 fund | ~15-20 | LOW |
| Micro-PE | 1 firm | 1-3 funds | ~40-60 | MEDIUM |
| Mid/Full PE | 1 firm | 3-10+ funds | ~60-120 | HIGH |

Same data model for all. The onboarding flow conditionally shows/hides fields based on `Organization.type`.

---

## 4. Schema Design

### 4.1 New Model: Organization

```prisma
model Organization {
  id                String   @id @default(cuid())

  // Identity
  name              String                    // Display name ("Andes Capital Partners")
  slug              String   @unique          // Subdomain routing + URL identifier
  legalName         String?                   // Registered legal name
  type              OrganizationType          // SEARCH_FUND, MICRO_PE, MID_PE, CONSOLIDATED_PE

  // Legal
  entityType        OrgEntityType?            // LLC, LP, C_CORP, S_CORP, SICAV
  jurisdictionOfFormation String?             // Country/State
  dateOfFormation   DateTime?
  taxId             String?                   // EIN (encrypted at rest)
  leiCode           String?                   // Legal Entity Identifier
  regulatoryStatus  RegulatoryStatus?         // REGISTERED, EXEMPT, NON_REGISTERED
  secFileNumber     String?

  // Contact
  primaryContactName  String?
  primaryContactEmail String?
  primaryContactPhone String?
  investorRelationsEmail String?
  websiteUrl        String?
  logoUrl           String?

  // Address
  addressLine1      String?
  addressLine2      String?
  city              String?
  state             String?
  country           String   @default("USA")
  postalCode        String?

  // Operational
  baseCurrency      Currency @default(USD)
  fiscalYearEnd     String?                   // "12/31", "06/30", etc.
  reportingFrequency ReportingFrequency?      // QUARTERLY, SEMI_ANNUAL, ANNUAL
  baseTimeZone      String?                   // "America/New_York"

  // Strategy (firm-level defaults)
  firmStrategies    String[]                  // ["VENTURE", "GROWTH", "BUYOUT"]
  targetGeographies String[]                  // ["LATAM", "US", "EUROPE"]
  targetSectors     String[]                  // ["FINTECH", "SAAS", "HEALTHCARE"]

  // Compliance (Phase 2+)
  // dataResidency     DataResidency?
  // ssoEnabled        Boolean    @default(false)
  // ipAllowlist       String[]
  // kycProvider        String?
  // amlScreeningEnabled Boolean  @default(false)
  // auditLogRetentionDays Int    @default(365)

  // Status
  isActive          Boolean  @default(true)
  onboardingCompleted Boolean @default(false)

  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  funds             Fund[]
  users             User[]

  @@index([slug])
}

enum OrganizationType {
  SEARCH_FUND
  MICRO_PE
  MID_PE
  CONSOLIDATED_PE
}

enum OrgEntityType {
  LLC
  LP
  C_CORP
  S_CORP
  SICAV
  LTD
  SARL
  OTHER
}

enum RegulatoryStatus {
  REGISTERED
  EXEMPT
  NON_REGISTERED
}

enum ReportingFrequency {
  MONTHLY
  QUARTERLY
  SEMI_ANNUAL
  ANNUAL
}
```

### 4.2 Modified Model: User

Add `organizationId` FK to scope users to their tenant.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          UserRole  @default(LP_VIEWER)
  avatar        String?
  isActive      Boolean   @default(true)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Tenant scope
  organization   Organization? @relation(fields: [organizationId], references: [id])
  organizationId String?       // Nullable for platform-level admins (if needed)

  // Relations (unchanged)
  fundMemberships FundMember[]
  activities      Activity[]
  comments        Comment[]
  tasksAssigned   Task[]           @relation("TaskAssignee")
  tasksCreated    Task[]           @relation("TaskCreator")
  notifications   Notification[]
  auditLogs       AuditLog[]
  sessions        Session[]
  accounts        Account[]
  investor        Investor?

  @@index([organizationId])
}
```

### 4.3 Modified Model: Fund

Add `organizationId` FK + new fields from spec §5.

```prisma
model Fund {
  id                String     @id @default(cuid())
  name              String
  slug              String?    @unique
  legalName         String?
  type              FundType
  status            FundStatus @default(RAISING)
  vintage           Int

  // Tenant scope
  organization      Organization? @relation(fields: [organizationId], references: [id])
  organizationId    String?       // Nullable during migration, then required

  // Capital Structure (existing)
  targetSize        Decimal    @db.Decimal(15, 2)
  hardCap           Decimal?   @db.Decimal(15, 2)
  minimumCommitment Decimal?   @db.Decimal(15, 2)
  currency          Currency   @default(USD)

  // Fee Structure (existing)
  managementFee     Decimal    @db.Decimal(5, 4)
  carriedInterest   Decimal    @db.Decimal(5, 4)
  hurdleRate        Decimal?   @db.Decimal(5, 4)
  catchUpRate       Decimal?   @db.Decimal(5, 4)

  // --- NEW: Strategy & Focus (spec §5.2) ---
  strategy          String?    @db.Text    // Investment thesis
  investmentStages  String[]               // ["SEED", "SERIES_A", "GROWTH"]
  targetSectors     String[]               // ["FINTECH", "SAAS"]
  targetGeographies String[]               // ["LATAM", "US"]
  checkSizeMin      Decimal?   @db.Decimal(15, 2)
  checkSizeMax      Decimal?   @db.Decimal(15, 2)

  // --- NEW: Lifecycle Dates (spec §5.3) ---
  fundLaunchDate       DateTime?
  firstCloseDate       DateTime?
  finalCloseDate       DateTime?
  investmentPeriodEnd  DateTime?
  fundTermYears        Int?              // e.g., 10

  // --- NEW: Legal (spec §5.1 extras) ---
  fundEntityType    OrgEntityType?       // Reuse enum from Organization
  jurisdiction      String?              // Country/State of fund formation
  taxId             String?              // Fund-level EIN

  // --- NEW: Operational Config (spec §5.8) ---
  capitalCallNoticeDays    Int?          // Days of advance notice (e.g., 10)
  distributionNoticeDays   Int?          // Days of advance notice (e.g., 5)

  // Metadata (existing)
  description       String?    @db.Text
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  // Relations (existing — unchanged)
  members           FundMember[]
  deals             Deal[]
  documents         Document[]
  commitments       Commitment[]
  capitalCalls      CapitalCall[]
  distributions     Distribution[]
  portfolioCompanies PortfolioCompany[]
  reports            Report[]

  @@index([organizationId])
}
```

### 4.4 New Model: BankAccount (Phase 2)

```prisma
// PHASE 2 — Not for initial implementation
model BankAccount {
  id                String   @id @default(cuid())

  // Owner (one of these will be set)
  organization      Organization? @relation(fields: [organizationId], references: [id])
  organizationId    String?
  // Future: fundId for fund-level accounts

  bankName          String
  accountHolderName String
  accountNumber     String          // Encrypted at rest
  routingNumber     String?         // US domestic
  iban              String?         // International
  swiftCode         String?         // International
  bankContactEmail  String?

  isPrimary         Boolean  @default(false)
  isActive          Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId])
}
```

### 4.5 Enum: OrganizationType Mapping to UI

| Enum Value | Onboarding Label | Typical Funds | Typical Fields |
|------------|-----------------|---------------|----------------|
| `SEARCH_FUND` | "Search Fund" | 1 | ~15-20 (simplified) |
| `MICRO_PE` | "Micro-PE / Small Fund" | 1-3 | ~40-60 |
| `MID_PE` | "Mid-Market PE" | 3-10 | ~60-90 |
| `CONSOLIDATED_PE` | "PE Firm / Multi-Fund" | 10+ | ~90-120 |

---

## 5. Subdomain Routing

### 5.1 Middleware Architecture

```
Request: martha-fund.blackgem.ai/deals
    │
    ▼
middleware.ts
    ├── Parse hostname → extract "martha-fund"
    ├── Skip if hostname is "blackgem.ai" (root domain) or "www.blackgem.ai"
    ├── Skip if hostname is "localhost:3002" (development)
    ├── DB lookup: Fund where slug = "martha-fund"
    │   └── Include: organizationId
    ├── Set headers: x-fund-id, x-organization-id
    ├── NextAuth: authorized() callback has fund context
    └── Continue to route handler
```

### 5.2 Middleware Implementation (Pseudocode)

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'blackgem.ai'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Extract subdomain
  const subdomain = extractSubdomain(hostname, ROOT_DOMAIN)

  // Root domain — no tenant resolution needed
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next()
  }

  // Set subdomain as header for downstream resolution
  const response = NextResponse.next()
  response.headers.set('x-fund-slug', subdomain)

  // Rewrite to tenant-aware route (optional — or resolve in layout)
  return response
}

function extractSubdomain(hostname: string, rootDomain: string): string | null {
  // Dev: localhost:3002 — use query param ?fund=martha-fund
  if (hostname.includes('localhost')) return null

  // Prod: martha-fund.blackgem.ai → "martha-fund"
  if (hostname.endsWith(`.${rootDomain}`)) {
    return hostname.replace(`.${rootDomain}`, '')
  }

  return null
}
```

### 5.3 Fund Resolution in Server Components

```typescript
// src/lib/shared/tenant.ts
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function resolveTenantFund() {
  const headersList = await headers()
  const fundSlug = headersList.get('x-fund-slug')

  if (!fundSlug) return null

  return prisma.fund.findUnique({
    where: { slug: fundSlug },
    select: { id: true, organizationId: true, name: true, currency: true },
  })
}
```

### 5.4 Development Strategy

In development (`localhost:3002`), subdomain routing is impractical. Two approaches:

**Option A (Recommended):** Use query parameter `?fund=martha-fund` that middleware maps to the same `x-fund-slug` header.

**Option B:** Use `/etc/hosts` with `martha-fund.localhost` entries. Requires browser/DNS configuration.

We will use Option A for development simplicity.

### 5.5 DNS & SSL Configuration

| Item | Current | Required |
|------|---------|----------|
| DNS | `blackgem.ai` → Elastic IP | Add `*.blackgem.ai` → Elastic IP (wildcard A record on GoDaddy) |
| SSL | Let's Encrypt for `blackgem.ai` + `www.blackgem.ai` | Wildcard cert: `*.blackgem.ai` via Let's Encrypt DNS-01 challenge |
| Nginx | Serves `blackgem.ai` | Must accept `*.blackgem.ai` and proxy to Next.js |

---

## 6. Auth & Session Changes

### 6.1 Cookie Domain

Current: Cookie set for `blackgem.ai` (exact domain).
Required: Cookie domain must be `.blackgem.ai` (with leading dot) so it works across all subdomains.

```typescript
// In NextAuth config
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true,
      domain: process.env.COOKIE_DOMAIN || '.blackgem.ai', // Cross-subdomain
    },
  },
},
```

### 6.2 JWT Token Extension

Add `organizationId` to the JWT token so it is available in all server-side contexts without a DB lookup.

```typescript
// auth.config.ts — jwt callback
async jwt({ token, user }) {
  if (user) {
    token.role = user.role
    token.sub = user.id
    token.investorId = user.investorId ?? null
    token.organizationId = user.organizationId ?? null  // NEW
  }
  return token
},

// auth.config.ts — session callback
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.sub as string
    session.user.role = token.role as UserRole
    session.user.investorId = token.investorId as string | null
    session.user.organizationId = token.organizationId as string | null  // NEW
  }
  return session
},
```

### 6.3 Authorize Callback — Tenant Validation

When a user logs in via `martha-fund.blackgem.ai`, we must verify they belong to the organization that owns that fund.

```typescript
// In authorized() callback
authorized({ auth, request }) {
  const fundSlug = request.headers.get('x-fund-slug')

  if (fundSlug && auth?.user) {
    // Tenant validation happens at the data layer,
    // not in middleware (to avoid DB calls in edge runtime).
    // The layout component will verify and redirect if mismatched.
  }

  // ... existing route protection logic ...
}
```

### 6.4 Login Redirect Logic

| Scenario | Behavior |
|----------|----------|
| User visits `martha-fund.blackgem.ai/login` | Login → stays on `martha-fund.blackgem.ai` |
| User visits `blackgem.ai/login` | Login → redirect to their default fund's subdomain |
| LP visits any cockpit route | Redirect to `/portal` (existing behavior) |
| User has no fund access | Show "No funds available" page |

---

## 7. RBAC Integration

### 7.1 Current System (No Changes Needed)

The existing RBAC system is already more granular than the spec requires:

```
UserRole (system-wide)    → FundMemberRole (per fund)    → permissions[] (per module)
                          ↓
                    ALLOWED_FUND_ROLES enforces hierarchy
```

**Spec §8.1 mapping to existing system:**

| Spec Role | UserRole | FundMemberRole | Modules |
|-----------|----------|----------------|---------|
| Superadmin | SUPER_ADMIN | PRINCIPAL (optional) | ALL (bypass) |
| Fund Manager | FUND_ADMIN or INVESTMENT_MANAGER | PRINCIPAL or CO_PRINCIPAL | DEALS, INVESTORS, PORTFOLIO, CAPITAL, REPORTS, SETTINGS, TEAM |
| Analyst | ANALYST | ANALYST | DEALS, PORTFOLIO, REPORTS |
| Viewer | — | ADVISOR (with limited permissions) | Configurable subset |
| LP | LP_PRIMARY / LP_VIEWER | Cannot be FundMember | Portal only |

### 7.2 Organization-Scoped Additions

The only RBAC addition is ensuring that a user can only be a FundMember in funds belonging to their Organization:

```typescript
// In fund-access.ts — add organization check
export async function requireFundAccess(userId: string, fundId: string) {
  if (await isAdminRole(userId)) {
    // Admin still needs org check in multi-tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })
    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      select: { organizationId: true },
    })
    if (user?.organizationId && fund?.organizationId &&
        user.organizationId !== fund.organizationId) {
      throw new Error('Access denied: fund belongs to a different organization')
    }
    return true
  }

  // ... existing FundMember check (unchanged) ...
}
```

### 7.3 VIEWER Role (Minor Gap)

The spec mentions a "Viewer" role with read-only access. Current options:
- **Option A (Recommended):** Use existing ADVISOR role with restricted permissions (e.g., only `['REPORTS']`). No schema change.
- **Option B:** Add `VIEWER` to `FundMemberRole` enum. Requires Prisma migration.

Recommendation: Option A for MVP. The permissions system already supports this — an ADVISOR with `permissions: ['REPORTS']` is effectively read-only.

---

## 8. Onboarding Flow

### 8.1 Flow Overview

```
blackgem.ai/register
    │
    ├── Step 1: Vehicle Type Selection
    │   ├── "Search Fund" → simplified flow
    │   ├── "Micro-PE" → medium flow
    │   └── "PE Fund" → full flow
    │
    ├── Step 2: Firm Basics (Organization)
    │   ├── Search Fund: name, slug, email (auto-create org)
    │   └── PE: legal_name, slug, entity_type, jurisdiction
    │
    ├── Step 3: First Fund
    │   ├── Search Fund: auto-created from org data
    │   └── PE: name, slug, vintage, strategy, target_size
    │
    ├── Step 4: Your Account (User)
    │   ├── email, name, password
    │   └── Auto-assigned as SUPER_ADMIN + PRINCIPAL on fund
    │
    └── Step 5: Redirect to {fund-slug}.blackgem.ai/dashboard
```

### 8.2 Search Fund vs PE Onboarding

| Step | Search Fund (5 min) | PE Fund (15 min) |
|------|-------------------|-----------------|
| Vehicle type | "Search Fund" | "Micro-PE" / "PE Fund" |
| Firm info | Name, email only | Legal name, entity type, jurisdiction, tax ID |
| Fund creation | Auto from firm data | Manual: name, strategy, vintage, target size |
| Strategy fields | Hidden (1 fund assumed) | Shown: investment stages, sectors, geographies |
| Fee structure | Simplified or skipped | Management fee, carry, hurdle |
| Team | Skip (solo searcher) | Optional: invite team members |
| Result | 1 org + 1 fund + 1 user | 1 org + 1 fund + 1 user (team invites pending) |

### 8.3 Slug Generation

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, '')         // Trim leading/trailing hyphens
    .slice(0, 63)                  // DNS label max length
}

// "Martha Fund" → "martha-fund"
// "Andes Capital Partners Fund I" → "andes-capital-partners-fund-i"
```

Slug must be unique (enforced by `@unique` constraint on both Organization and Fund).

---

## 9. Data Layer Changes

### 9.1 Query Scoping Pattern

Every data query must now include `organizationId` as a top-level filter. The `fundId` filter remains — `organizationId` is an additional security boundary.

```typescript
// Before (current)
const deals = await prisma.deal.findMany({
  where: { fundId, deletedAt: null },
})

// After (multi-tenant)
const deals = await prisma.deal.findMany({
  where: {
    fundId,
    fund: { organizationId },  // Tenant isolation
    deletedAt: null,
  },
})
```

**Optimization:** Since `Fund.organizationId` is already validated by `requireFundAccess()`, the `fund: { organizationId }` filter is a defense-in-depth measure. It can be omitted in queries where `requireFundAccess()` was already called in the same request — but recommended for critical queries (financial data).

### 9.2 Investor Isolation (Already Implemented)

No changes needed. Investors are already isolated via the `Commitment` bridge table:

```typescript
// Current (already correct)
const investors = await prisma.investor.findMany({
  where: {
    commitments: { some: { fundId, ...notDeleted } },
    deletedAt: null,
  },
})
```

The `Commitment.fundId` naturally scopes investors to the correct organization because funds belong to organizations.

### 9.3 Active Fund Resolution (Updated)

The `getAuthorizedFundId()` function in `fund-access.ts` needs to be updated to prefer the fund resolved from the subdomain:

```typescript
export async function getAuthorizedFundId(userId: string): Promise<string | null> {
  // 1. Try subdomain-resolved fund (from middleware header)
  const headerFundSlug = /* read from headers */
  if (headerFundSlug) {
    const fund = await prisma.fund.findUnique({
      where: { slug: headerFundSlug },
      select: { id: true, organizationId: true },
    })
    if (fund) {
      // Verify user has access
      // ... (same logic as today)
      return fund.id
    }
  }

  // 2. Fallback to cookie (existing behavior)
  // ... existing logic ...
}
```

---

## 10. Migration Strategy

### 10.1 Existing Data Migration

There is currently **1 implicit PE firm** (NIRO Group / Andes Capital) with 2 funds and ~5 users. The migration is simple:

```sql
-- Step 1: Create Organization table (via Prisma migration)
-- Step 2: Insert the existing implicit firm
INSERT INTO "Organization" (id, name, slug, "legalName", type, "baseCurrency", "isActive", "onboardingCompleted", country, "createdAt", "updatedAt")
VALUES (
  'org_default',
  'NIRO Group',
  'niro-group',
  'NIRO Group LLC',
  'MICRO_PE',
  'USD',
  true,
  true,
  'USA',
  NOW(),
  NOW()
);

-- Step 3: Assign all existing funds to this organization
UPDATE "Fund" SET "organizationId" = 'org_default';

-- Step 4: Assign all existing users to this organization
UPDATE "User" SET "organizationId" = 'org_default';

-- Step 5: Verify
SELECT f.name, f."organizationId", o.name as org_name
FROM "Fund" f JOIN "Organization" o ON f."organizationId" = o.id;

SELECT u.email, u."organizationId", o.name as org_name
FROM "User" u LEFT JOIN "Organization" o ON u."organizationId" = o.id;
```

### 10.2 Fund Slug Backfill

Existing funds may not have slugs. Backfill from name:

```sql
-- Set slugs for existing funds
UPDATE "Fund" SET slug = 'martha-fund' WHERE name = 'Martha Fund' AND slug IS NULL;
UPDATE "Fund" SET slug = 'blackgem-fund-i' WHERE name = 'BlackGem Fund I' AND slug IS NULL;

-- Make slug required (after backfill)
-- ALTER TABLE "Fund" ALTER COLUMN slug SET NOT NULL;
```

### 10.3 Migration Order

1. `prisma migrate` — Add Organization model + new columns on User/Fund
2. SQL — Insert default Organization, backfill FKs, backfill slugs
3. `prisma migrate` — Make `organizationId` required on Fund (optional on User for platform admins)
4. Deploy middleware + auth changes
5. DNS — Add `*.blackgem.ai` wildcard record
6. SSL — Obtain wildcard cert via DNS-01 challenge
7. Nginx — Update config to accept wildcard subdomains
8. Verify — Test subdomain routing end-to-end

---

## 11. Infrastructure Changes

### 11.1 DNS (GoDaddy)

```
Current records:
  A     blackgem.ai      → 3.223.165.121
  A     www.blackgem.ai  → 3.223.165.121

Add:
  A     *.blackgem.ai    → 3.223.165.121
```

### 11.2 SSL (Let's Encrypt on EC2)

Current: Certbot HTTP-01 challenge for `blackgem.ai` + `www.blackgem.ai`.
Required: Wildcard cert via DNS-01 challenge.

```bash
# On EC2 — install certbot DNS plugin for GoDaddy (or use acme.sh)
# Option: Use acme.sh with GoDaddy API
acme.sh --issue -d "blackgem.ai" -d "*.blackgem.ai" --dns dns_gd \
  --GD_Key="YOUR_KEY" --GD_Secret="YOUR_SECRET"
```

Alternative: Use AWS Certificate Manager (ACM) + ALB instead of Let's Encrypt. This would require moving from Elastic IP + nginx to an ALB, which is a larger infrastructure change.

### 11.3 Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name *.blackgem.ai blackgem.ai;

    ssl_certificate /etc/letsencrypt/live/blackgem.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blackgem.ai/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;  # Pass full hostname to Next.js
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 11.4 Environment Variables

```env
# New variables
ROOT_DOMAIN=blackgem.ai
COOKIE_DOMAIN=.blackgem.ai
NEXTAUTH_URL=https://blackgem.ai  # Base URL for auth
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Schema + Middleware) — ~2-3 weeks

| Task | Files | Tests |
|------|-------|-------|
| 1.1 Organization model + enums | `schema.prisma` | Prisma generate |
| 1.2 Fund field expansion (strategy, dates, legal) | `schema.prisma` | Prisma generate |
| 1.3 User.organizationId + Fund.organizationId | `schema.prisma` | Prisma generate |
| 1.4 Production migration (create org, backfill FKs) | SQL file | Manual verification |
| 1.5 Middleware: subdomain parsing | `middleware.ts` | Unit tests |
| 1.6 Tenant resolution utility | `src/lib/shared/tenant.ts` | Unit tests |
| 1.7 Auth changes: cookie domain, JWT extension | `auth.config.ts`, `auth.ts` | Integration tests |
| 1.8 Fund access: organization validation | `fund-access.ts` | Unit tests |
| 1.9 DNS: wildcard A record | GoDaddy | Manual verification |
| 1.10 SSL: wildcard cert | EC2 | Manual verification |
| 1.11 Nginx: wildcard server_name | EC2 nginx config | Manual verification |

### Phase 2: Onboarding + UI — ~2-3 weeks

| Task | Files | Tests |
|------|-------|-------|
| 2.1 Registration page: vehicle type selector | `src/app/(auth)/register/page.tsx` | E2E |
| 2.2 Onboarding wizard: firm basics | `src/app/(auth)/register/steps/` | Component tests |
| 2.3 Onboarding wizard: fund creation | Same | Component tests |
| 2.4 Onboarding wizard: account creation | Same | Integration tests |
| 2.5 Server actions: createOrganization, onboardingComplete | `src/lib/actions/organizations.ts` | Unit tests |
| 2.6 Redirect logic: post-registration → subdomain | Middleware + auth | Integration tests |
| 2.7 Organization settings page | `src/app/(dashboard)/settings/organization/` | Component tests |
| 2.8 Fund creation UI: new fields (strategy, dates) | `src/components/funds/` | Component tests |

### Phase 3: Polish + Advanced — ~2-3 weeks

| Task | Files | Tests |
|------|-------|-------|
| 3.1 Organization switcher (for users in multiple orgs) | Sidebar component | Component tests |
| 3.2 Fund switcher update (org-scoped) | Sidebar component | Component tests |
| 3.3 Banking model + UI | Schema + components | Full stack |
| 3.4 LP portal: multi-fund view per investor | Portal pages | Integration tests |
| 3.5 Invitation system: team members via email | Actions + email | Integration tests |
| 3.6 Audit logging: organization-level events | audit.ts | Unit tests |
| 3.7 Search Fund: simplified dashboard variant | Layout conditional | Component tests |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Wildcard SSL setup fails** | Subdomains won't have HTTPS | Pre-test with acme.sh + GoDaddy API before deployment. Fallback: ACM + ALB. |
| **NextAuth cookie cross-subdomain issues** | Users can't stay logged in across subdomains | Test `.blackgem.ai` cookie domain locally with hosts file. Known working pattern with NextAuth v5. |
| **Middleware DB calls slow down every request** | Latency on all page loads | Cache fund slug → ID resolution (in-memory LRU or Redis). Middleware only sets header; resolution happens in layout. |
| **Existing data migration breaks references** | Production downtime | Migration is additive (new columns, new table). No existing columns removed. Zero-downtime deploy. |
| **Development complexity with subdomains** | Slower local dev | Use `?fund=slug` query param in dev. Transparent to rest of codebase via shared `x-fund-slug` header. |
| **GoDaddy DNS wildcard propagation** | Subdomains don't resolve for hours | Add wildcard record well in advance. TTL: 600s. Test with `dig` before deploying middleware. |
| **Multi-tenant data leakage** | Critical security issue | Defense-in-depth: organizationId filter in requireFundAccess + optional filter in queries. Comprehensive test suite for cross-tenant access attempts. |
| **Search Fund users confused by PE complexity** | Poor onboarding UX | OrganizationType drives conditional field rendering. Search Fund sees ~15 fields, PE sees 60+. |

---

## Appendix A: File Impact Summary

| File | Change Type | Description |
|------|------------|-------------|
| `prisma/schema.prisma` | MODIFY | Organization model, enums, User/Fund FK additions, Fund field expansion |
| `src/middleware.ts` | CREATE | Subdomain parsing, header injection |
| `src/lib/shared/tenant.ts` | CREATE | Fund/org resolution from headers |
| `src/lib/auth.config.ts` | MODIFY | Cookie domain, JWT extension, tenant-aware redirect |
| `src/lib/auth.ts` | MODIFY | User query includes organizationId |
| `src/lib/shared/fund-access.ts` | MODIFY | Organization validation in requireFundAccess |
| `src/lib/actions/organizations.ts` | CREATE | CRUD for Organization + onboarding |
| `src/app/(auth)/register/` | CREATE | Onboarding wizard pages |
| `src/app/(dashboard)/settings/organization/` | CREATE | Org settings UI |
| `next.config.ts` | MODIFY | Potentially add domain config |
| `.env` / `.env.production` | MODIFY | ROOT_DOMAIN, COOKIE_DOMAIN |
| `prisma/production-migration-organizations.sql` | CREATE | Backfill migration |
| EC2: nginx config | MODIFY | Wildcard server_name |
| GoDaddy: DNS | MODIFY | Wildcard A record |
| EC2: SSL | MODIFY | Wildcard cert |

## Appendix B: Spec §9 Test Acceptance Mapping

| Test | Spec Reference | BlackGem Coverage |
|------|---------------|-------------------|
| Investor isolation per fund | §9.3 Test 1 | PASSING — `investor-isolation.test.ts` (34 tests) |
| RBAC: Fund Manager sees only assigned funds | §9.3 Test 2 | PASSING — `requireFundAccess()` enforced |
| LP accesses only Library, not Cockpit | §9.3 Test 3 | PASSING — `auth.config.ts` redirect logic |
| Superadmin sees all | §9.3 Test 4 | PASSING — `isAdminRole()` bypass |
| Cross-organization isolation | NEW (not in spec) | TO IMPLEMENT — Phase 1.8 |
| Subdomain resolves correct fund | NEW (not in spec) | TO IMPLEMENT — Phase 1.5 |

---

*Document version 1.0 — 2026-02-18*
*Based on: "Especificación Técnica: Plataforma de Gestión de Fondos de Inversión v1.0"*
*Prior art: Commits 02ce6ec (RBAC + fund isolation), dc27532 (role hierarchy validation)*
