# BlackGem Development Roadmap — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute the complete post-MVP roadmap for BlackGem, taking it from a functional MVP (100% deployed at blackgem.ai) to a feature-complete, production-hardened PE fund management platform.

**Architecture:** Server-first Next.js 15 with React 19 server components, Prisma 6 ORM on PostgreSQL (Neon via RDS), server actions for mutations following the established pattern (`auth → requireFundAccess → Zod → logic → logAudit → revalidatePath`). Dark mode via inline CSS vars. File storage currently disk-based, migrating to S3. Docker + EC2 deployment via GitHub Actions.

**Tech Stack:** Next.js 15.5, React 19, TypeScript (strict), Prisma 6, PostgreSQL, Tailwind CSS 4, NextAuth v5 beta.30, jsPDF, Resend, Vitest, AWS S3 SDK v3

**Current State:** 187/187 tests pass, zero `any`/`@ts-ignore`, build/lint clean. 24 Prisma models, 14 server action files, full dashboard + LP portal.

---

## Phase 0: Operational Hardening (no feature code)

> Priority 1 from SESSION_HANDOFF. Infrastructure-only. No new features.

### Task 0.1: Tighten RDS Security Group

**Files:**
- None (AWS CLI only)

**Step 1: Restrict RDS inbound to EC2 SG only**

Run:
```bash
# Remove any 0.0.0.0/0 rules on port 5432
aws ec2 revoke-security-group-ingress \
  --group-id sg-0cf5124eab58f6333 \
  --protocol tcp --port 5432 --cidr 0.0.0.0/0

# Add rule allowing only EC2 SG
aws ec2 authorize-security-group-ingress \
  --group-id sg-0cf5124eab58f6333 \
  --protocol tcp --port 5432 \
  --source-group sg-0400b24b78152cde5
```

**Step 2: Verify DB still works**

SSH to EC2, run `docker compose logs --tail 10` — confirm no connection errors.

**Step 3: Restrict SSH to your IP**

```bash
# Get your IP
MY_IP=$(curl -s ifconfig.me)

# Revoke open SSH
aws ec2 revoke-security-group-ingress \
  --group-id sg-0400b24b78152cde5 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

# Add your IP only
aws ec2 authorize-security-group-ingress \
  --group-id sg-0400b24b78152cde5 \
  --protocol tcp --port 22 --cidr ${MY_IP}/32
```

---

### Task 0.2: Configure Resend API Key

**Files:**
- Modify: `/opt/blackgem/.env` on EC2

**Step 1:** Create account at resend.com, verify domain `blackgem.ai`, obtain API key.

**Step 2:** SSH to EC2, update `.env`:
```
RESEND_API_KEY=re_ACTUAL_KEY_HERE
RESEND_FROM_EMAIL=BlackGem <noreply@blackgem.ai>
```

**Step 3:** Restart container:
```bash
cd /opt/blackgem && docker compose restart
```

**Step 4:** Test by inviting an LP from the dashboard. Verify email arrives.

---

### Task 0.3: Verify Login Redesign Deployed

**Step 1:** Visit `https://www.blackgem.ai/login`

**Step 2:** Verify the D.E. Shaw-inspired dark login page is visible (commits `3e44267` + `f467446`).

**Step 3:** If not deployed, trigger manual deploy:
```bash
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
cd /opt/blackgem && docker compose pull && docker compose up -d
```

---

## Phase 1: Technical Debt & Stability

> Priority 2 from SESSION_HANDOFF. Small, high-value fixes.

### Task 1.1: Settings Audit Logging Completion

**Files:**
- Modify: `src/lib/actions/settings.ts:52-111` (updateProfile already has audit — VERIFY)
- Modify: `src/lib/actions/settings.ts:119-174` (changePassword already has audit — VERIFY)
- Modify: `src/lib/actions/settings.ts:246-329` (updateFundConfig already has audit — VERIFY)
- Modify: `src/lib/actions/settings.ts:347-386` (updateFundStatus already has audit — VERIFY)
- Test: `src/__tests__/settings-audit.test.ts`

**Context:** The SESSION_HANDOFF says settings.ts "lacks audit logging." But on reading the actual file, ALL four mutation functions (`updateProfile`, `changePassword`, `updateFundConfig`, `updateFundStatus`) already call `logAudit()`. This task is **already complete** — verify and close.

**Step 1: Write verification test**

```typescript
import { describe, it, expect } from 'vitest'
import fs from 'fs'

describe('settings.ts audit logging', () => {
  const content = fs.readFileSync('src/lib/actions/settings.ts', 'utf-8')

  it('updateProfile calls logAudit', () => {
    // Find the updateProfile function body
    const match = content.match(/export async function updateProfile[\s\S]*?^}/m)
    expect(match?.[0]).toContain('logAudit')
  })

  it('changePassword calls logAudit', () => {
    const match = content.match(/export async function changePassword[\s\S]*?^}/m)
    expect(match?.[0]).toContain('logAudit')
  })

  it('updateFundConfig calls logAudit', () => {
    const match = content.match(/export async function updateFundConfig[\s\S]*?^}/m)
    expect(match?.[0]).toContain('logAudit')
  })

  it('updateFundStatus calls logAudit', () => {
    const match = content.match(/export async function updateFundStatus[\s\S]*?^}/m)
    expect(match?.[0]).toContain('logAudit')
  })
})
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/settings-audit.test.ts`
Expected: 4/4 PASS

**Step 3: Commit**

```bash
git add src/__tests__/settings-audit.test.ts
git commit -m "test: verify settings.ts audit logging coverage"
```

---

### Task 1.2: Error Boundary Integration

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/app/(dashboard)/deals/page.tsx`
- Modify: `src/app/(dashboard)/investors/page.tsx` (if exists as a page)
- Modify: `src/app/(dashboard)/portfolio/page.tsx` (if exists)
- Modify: `src/app/(dashboard)/capital/page.tsx` (if exists)
- Modify: `src/app/(dashboard)/reports/page.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Reference: `src/components/ui/error-boundary.tsx`

**Step 1: Identify all dashboard pages**

Run: `find src/app/\(dashboard\) -name "page.tsx" -type f`

**Step 2: For each dashboard page, wrap the main content in ErrorBoundary**

Pattern:
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Inside the page component, wrap the main content section:
<ErrorBoundary module="Dashboard">
  {/* existing page content */}
</ErrorBoundary>
```

The ErrorBoundary component already exists and accepts a `module` prop for error context. Wrap the main data-dependent content (not the page title/header) so errors in data fetching or rendering don't crash the entire page.

**Step 3: Wrap LP portal pages similarly**

Run: `find src/app/\(portal\) -name "page.tsx" -type f`

Apply same pattern with module names like "Portal Dashboard", "Portal Documents", etc.

**Step 4: Run build**

Run: `npm run build`
Expected: PASS with zero errors

**Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: integrate ErrorBoundary into all dashboard and portal pages"
```

---

### Task 1.3: Rate Limiting on Sensitive Endpoints

**Files:**
- Modify: `src/app/api/documents/upload/route.ts`
- Reference: `src/lib/shared/rate-limit.ts`
- Test: `src/__tests__/rate-limit-integration.test.ts`

**Context:** Rate limiting exists in `src/lib/shared/rate-limit.ts` (in-memory, sliding window) and is only used in auth. Apply it to the document upload endpoint (most abuse-prone).

**Step 1: Add rate limiting to upload API**

At the top of the POST handler in `src/app/api/documents/upload/route.ts`:
```typescript
import { rateLimit } from '@/lib/shared/rate-limit'

// Inside POST handler, after auth check:
const rateLimitResult = rateLimit(`upload:${session.user.id}`, 20, 60_000) // 20 uploads/min
if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: 'Too many uploads. Please try again later.' },
    { status: 429 }
  )
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/api/documents/upload/route.ts
git commit -m "feat: add rate limiting to document upload endpoint"
```

---

## Phase 2: Document Management System (S3 Migration)

> Priority 3.1 from SESSION_HANDOFF. Largest functional gap. ~2-3 days.

### Task 2.1: Add AWS S3 SDK and Environment Variables

**Files:**
- Create: `src/lib/s3.ts`
- Modify: `.env.example`
- Modify: `.env.local` (local development)

**Step 1: Install AWS S3 SDK**

```bash
# Due to npm install hang, use manual tarball approach:
curl -sL https://registry.npmjs.org/@aws-sdk/client-s3/-/client-s3-3.525.0.tgz -o /tmp/s3.tgz
# Extract and install manually (follow existing workaround pattern)
```

Alternative: Try `npm install @aws-sdk/client-s3` first — it may work now.

**Step 2: Add env vars to .env.example**

```env
# ============ FILE STORAGE (S3) ============
AWS_S3_BUCKET=""
AWS_S3_REGION="us-east-1"
# AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY already exist for ECR
```

**Step 3: Create S3 client with lazy-init pattern**

Create `src/lib/s3.ts`:
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let _client: S3Client | null = null

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_S3_REGION || 'us-east-1',
    })
  }
  return _client
}

const getBucket = () => process.env.AWS_S3_BUCKET || ''

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getS3Client()
  await client.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return key
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn: 3600 }) // 1 hour
}

export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client()
  await client.send(new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }))
}

export function getS3Key(ownerId: string, fileName: string): string {
  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `documents/${ownerId}/${timestamp}_${safeName}`
}
```

**Step 4: Run build to verify**

Run: `npm run build`
Expected: PASS (lazy-init means missing env vars won't crash build)

**Step 5: Commit**

```bash
git add src/lib/s3.ts .env.example
git commit -m "feat: add S3 client with lazy-init for document storage"
```

---

### Task 2.2: Migrate Upload API to S3

**Files:**
- Modify: `src/app/api/documents/upload/route.ts`
- Reference: `src/lib/s3.ts`

**Step 1: Read current upload route**

Understand the existing disk-based upload implementation.

**Step 2: Replace disk write with S3 upload**

Key changes:
- Replace `fs.writeFile(filePath, buffer)` with `uploadToS3(s3Key, buffer, contentType)`
- Store S3 key in `fileUrl` field instead of disk path
- Keep the same validation logic (file size, extension checks)
- Keep the same audit logging

**Step 3: Update download API**

Modify `src/app/api/documents/[id]/route.ts`:
- If `fileUrl` starts with `documents/` (S3 key), generate signed URL and redirect
- If `fileUrl` starts with `uploads/` (legacy disk path), serve from disk (backward compat)

**Step 4: Run build + manual test**

Run: `npm run build`

**Step 5: Commit**

```bash
git add src/app/api/documents/
git commit -m "feat: migrate document upload/download to S3 with disk fallback"
```

---

### Task 2.3: Document Versioning

**Files:**
- Modify: `prisma/schema.prisma` (add version fields — CHECK if already present)
- Create: `src/lib/actions/document-versions.ts`
- Modify: `src/components/documents/document-list.tsx`
- Test: `src/__tests__/document-versions.test.ts`

**Context:** The Document model in the Prisma schema already has versioning fields: `version`, `parentId`, `parent`, `versions`, `isLatest`. The PRD designed self-referential versioning (Document → Document). These fields exist in the schema but are unused in the application code.

**Step 1: Write failing test for version upload**

```typescript
describe('document versioning', () => {
  it('creates a new version linked to parent', () => {
    // Test the version creation logic
  })
  it('marks new version as latest', () => {
    // isLatest should be true on new, false on old
  })
  it('lists version history for a document', () => {
    // Returns ordered versions
  })
})
```

**Step 2: Implement server action**

```typescript
// src/lib/actions/document-versions.ts
export async function uploadNewVersion(parentDocumentId: string, file: File) {
  // 1. Auth + fund access
  // 2. Get parent document
  // 3. Upload new file to S3
  // 4. Create new Document record with parentId = parentDocumentId, version = parent.version + 1
  // 5. Set isLatest = true on new, isLatest = false on parent
  // 6. logAudit
}

export async function getDocumentVersions(documentId: string) {
  // Return all documents sharing the same root parentId, ordered by version
}
```

**Step 3: Add "Upload New Version" button to document-list.tsx**

Next to each document in the list, add a version upload button that opens the existing upload dialog but passes `parentId`.

**Step 4: Run tests and build**

**Step 5: Commit**

```bash
git add prisma/ src/lib/actions/document-versions.ts src/components/documents/ src/__tests__/
git commit -m "feat: document versioning with S3 storage"
```

---

### Task 2.4: Document Visibility for LP Portal

**Files:**
- Modify: `src/lib/actions/documents.ts`
- Modify: `src/lib/actions/portal.ts`
- Modify: `src/components/documents/document-list.tsx`

**Context:** The Document model has `visibleToLPs` and `isConfidential` fields. The PRD defines `InvestorDocument` as a join table for per-investor document sharing. The actual schema has `InvestorDocument` but it may not be implemented.

**Step 1: Add toggle for LP visibility in document list**

Add a toggle/switch on each document in the admin view to set `visibleToLPs`.

**Step 2: Update portal document query**

In `src/lib/actions/portal.ts`, filter documents by `visibleToLPs: true` when serving the LP portal.

**Step 3: Run build**

**Step 4: Commit**

```bash
git add src/lib/actions/ src/components/documents/
git commit -m "feat: LP document visibility controls"
```

---

## Phase 3: Advanced Reporting

> Priority 3.2 from SESSION_HANDOFF. ~2 days.

### Task 3.1: Add Report Model to Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** The PRD defines a `Report` model with fields for type, title, periodStart, periodEnd, content (JSON), fileUrl, status, publishing metadata. This model is in the PRD schema document but NOT in the actual Prisma schema.

**Step 1: Add Report model to schema.prisma**

```prisma
model Report {
  id          String       @id @default(cuid())
  fund        Fund         @relation(fields: [fundId], references: [id], onDelete: Cascade)
  fundId      String

  type        ReportType
  title       String

  periodStart DateTime?
  periodEnd   DateTime?

  content     Json?
  fileUrl     String?

  status      ReportStatus @default(DRAFT)

  publishedAt DateTime?
  publishedBy String?

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
  QUARTERLY_UPDATE
  ANNUAL_REPORT
  CAPITAL_CALL_NOTICE
  DISTRIBUTION_NOTICE
  K1
  FINANCIAL_STATEMENT
  PORTFOLIO_SUMMARY
  CUSTOM
}

enum ReportStatus {
  DRAFT
  REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
}
```

Also add `reports Report[]` to the Fund model's relations.

**Step 2: Generate Prisma client**

Run: `npx prisma generate`

**Step 3: Apply migration to DB**

Run: `npx prisma db push` (or raw SQL if migrations aren't used)

**Step 4: Run build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Report model to Prisma schema"
```

---

### Task 3.2: Quarterly Update Builder — Server Actions

**Files:**
- Create: `src/lib/actions/quarterly-updates.ts`
- Test: `src/__tests__/quarterly-updates.test.ts`

**Step 1: Write failing tests**

```typescript
describe('quarterly update builder', () => {
  it('generates draft quarterly update with auto-populated sections', () => {})
  it('validates period (year + quarter)', () => {})
  it('includes fund performance metrics in content', () => {})
  it('saves draft report to database', () => {})
})
```

**Step 2: Implement server actions**

```typescript
// Server actions:
export async function generateQuarterlyUpdate(fundId: string, year: number, quarter: number)
export async function updateQuarterlySection(reportId: string, sectionKey: string, content: string)
export async function getQuarterlyUpdateDraft(reportId: string)
export async function approveAndPublish(reportId: string)
```

The `generateQuarterlyUpdate` function should:
1. Auth + fund access
2. Calculate period dates (Q1 = Jan-Mar, etc.)
3. Auto-populate sections: fund summary (NAV, IRR, MOIC), portfolio company updates, capital summary
4. Create Report record with status DRAFT
5. Return the report ID

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add src/lib/actions/quarterly-updates.ts src/__tests__/quarterly-updates.test.ts
git commit -m "feat: quarterly update builder server actions"
```

---

### Task 3.3: Quarterly Update Builder — UI

**Files:**
- Create: `src/components/reports/quarterly-update-builder.tsx`
- Create: `src/components/reports/section-editor.tsx`
- Modify: `src/app/(dashboard)/reports/page.tsx`

**Step 1: Build the QuarterlyUpdateBuilder component**

Following the wireframe from `07_Module_Reports.md`:
- Period selector (year + quarter dropdowns)
- Section list with drag-to-reorder
- Each section: title, preview text, [Edit] button
- Auto-generated sections (Fund Summary, Financial Highlights) show calculated data
- Editable sections (Letter, Portfolio Update, Looking Ahead) have textarea editors
- Bottom: [Save Draft] [Preview PDF] [Approve & Send]

**Step 2: Build SectionEditor component**

Modal or inline editor for report sections. Rich text not needed — plain textarea with markdown support.

**Step 3: Integrate into reports page**

Add a "Create Quarterly Update" button to the reports page that opens the builder.

**Step 4: Run build**

**Step 5: Commit**

```bash
git add src/components/reports/ src/app/\(dashboard\)/reports/
git commit -m "feat: quarterly update builder UI"
```

---

### Task 3.4: Quarterly Update PDF Generation

**Files:**
- Create: `src/lib/pdf/quarterly-update.ts`

**Context:** BlackGem uses jsPDF (not @react-pdf/renderer — that was a PRD decision overridden). Follow the pattern in existing PDF files (`src/lib/pdf/dashboard-report.ts`, `capital-call-notice.ts`).

**Step 1: Implement quarterly update PDF**

```typescript
// Sections:
// 1. Cover page (fund name, period, "Quarterly Investor Update")
// 2. Letter from the Principals (from report.content.letter)
// 3. Fund Summary (auto-generated metrics: NAV, IRR, MOIC, capital summary)
// 4. Portfolio Company Update (from report.content.portfolioUpdate)
// 5. Financial Highlights (revenue, EBITDA from portfolio metrics)
// 6. Looking Ahead (from report.content.lookingAhead)
// Footer: "Confidential — For Investor Use Only" + page number
```

Follow existing PDF patterns: jsPDF, `doc.setFont('helvetica')`, consistent margins (20mm).

**Step 2: Add preview button to builder UI**

**Step 3: Run build**

**Step 4: Commit**

```bash
git add src/lib/pdf/quarterly-update.ts
git commit -m "feat: quarterly update PDF generation with jsPDF"
```

---

### Task 3.5: Report Distribution via Email

**Files:**
- Create: `src/lib/actions/report-distribution.ts`
- Reference: `src/lib/email.ts` (Resend client)

**Step 1: Implement distribution action**

```typescript
export async function distributeReport(reportId: string, options: {
  recipientIds?: string[]  // defaults to all active funded LPs
  includeCapitalStatement: boolean
  emailSubject?: string
  emailBody?: string
}) {
  // 1. Auth + fund access
  // 2. Generate PDF
  // 3. If includeCapitalStatement, generate individual capital statements per LP
  // 4. Send email via Resend with PDF attachment
  // 5. Update report: status = PUBLISHED, sentToLPs = true, sentAt = now
  // 6. logAudit
}
```

**Step 2: Add "Approve & Send" flow to UI**

Confirmation dialog showing: recipient count, email subject preview, options.

**Step 3: Run build**

**Step 4: Commit**

```bash
git add src/lib/actions/report-distribution.ts
git commit -m "feat: report distribution to LPs via email with PDF attachment"
```

---

## Phase 4: Deal Scoring System

> Priority 4.1 from SESSION_HANDOFF. ~1 day. Uses existing unused fields.

### Task 4.1: Deal Scoring UI

**Files:**
- Create: `src/components/deals/deal-scoring.tsx`
- Modify: `src/lib/actions/deals.ts` (add scoring update action)
- Modify: `src/app/(dashboard)/deals/[id]/page.tsx` (integrate scoring panel)
- Test: `src/__tests__/deal-scoring.test.ts`

**Context:** Fields `attractivenessScore`, `fitScore`, `riskScore` already exist in the Deal model (Int?, 1-10 scale). They are unused. No schema changes needed.

**Step 1: Write failing test**

```typescript
describe('deal scoring', () => {
  it('validates scores are 1-10', () => {})
  it('calculates composite score', () => {})
  it('returns null for unscored deals', () => {})
})
```

**Step 2: Implement scoring update action**

```typescript
// In deals.ts:
export async function updateDealScores(dealId: string, scores: {
  attractivenessScore: number  // 1-10
  fitScore: number             // 1-10
  riskScore: number            // 1-10
})
```

Follow existing server action pattern.

**Step 3: Build DealScoring component**

- Three slider inputs (1-10) for Attractiveness, Fit, Risk
- Visual composite score display (weighted average or radar)
- Color coding: 8-10 green, 5-7 yellow, 1-4 red
- Save button that calls `updateDealScores`

**Step 4: Integrate into deal detail page**

Add as a collapsible section or tab on the deal detail page.

**Step 5: Run tests and build**

**Step 6: Commit**

```bash
git add src/components/deals/deal-scoring.tsx src/lib/actions/deals.ts src/app/ src/__tests__/
git commit -m "feat: deal scoring system with 3-axis evaluation"
```

---

### Task 4.2: Deal Source Tracking

**Files:**
- Modify: `src/lib/actions/deals.ts`
- Create: `src/components/deals/deal-source-select.tsx`
- Modify: deal create/edit forms

**Context:** The schema has `DealSource` model and `Deal.sourceId` relation, plus `sourceContact` and `sourceNotes` fields — all unused in the UI.

**Step 1: Add CRUD for deal sources**

```typescript
export async function getDealSources(fundId: string)
export async function createDealSource(data: { name, type, contactName?, contactEmail? })
```

**Step 2: Add source selector to deal create/edit form**

Dropdown of existing sources + "Add new source" option.

**Step 3: Show source info on deal detail page**

**Step 4: Run build**

**Step 5: Commit**

```bash
git add src/components/deals/ src/lib/actions/deals.ts
git commit -m "feat: deal source tracking with source management"
```

---

## Phase 5: Portfolio Monitoring Dashboard

> Priority 4.3 from SESSION_HANDOFF. ~1-2 days.

### Task 5.1: Add Missing Portfolio Schema Models

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** The actual schema has `PortfolioMetric` but is missing `Valuation`, `StrategicInitiative`, `BoardMeeting` from the PRD. The `PortfolioMetric` model serves as a combined financials/KPI store. Evaluate what's actually needed:

- `Valuation` — **NEEDED** for official NAV calculations and LP reporting. Add it.
- `StrategicInitiative` — Nice to have. Defer.
- `BoardMeeting` — Nice to have. Defer.

**Step 1: Add Valuation model**

```prisma
model Valuation {
  id              String           @id @default(cuid())
  company         PortfolioCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId       String

  date            DateTime
  value           Decimal          @db.Decimal(15, 2)
  equityValue     Decimal?         @db.Decimal(15, 2)

  methodology     String           // Free text: "DCF", "EBITDA Multiple", etc.

  revenueMultiple Decimal?         @db.Decimal(5, 2)
  ebitdaMultiple  Decimal?         @db.Decimal(5, 2)

  isOfficial      Boolean          @default(false)
  notes           String?          @db.Text

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([companyId])
  @@index([date])
}
```

Add `valuations Valuation[]` to `PortfolioCompany` relations.

**Step 2: Generate + push**

Run: `npx prisma generate && npx prisma db push`

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Valuation model for portfolio company valuations"
```

---

### Task 5.2: Portfolio KPI Trends Server Actions

**Files:**
- Create: `src/lib/actions/portfolio-monitoring.ts`
- Test: `src/__tests__/portfolio-monitoring.test.ts`

**Step 1: Write tests**

```typescript
describe('portfolio monitoring', () => {
  it('returns KPI trend data for a company over time', () => {})
  it('calculates period-over-period changes', () => {})
  it('returns fund-level portfolio summary', () => {})
})
```

**Step 2: Implement server actions**

```typescript
export async function getPortfolioKPITrends(companyId: string, metricName: string)
export async function getPortfolioSummary(fundId: string) // NAV, total value, MOIC across all portfolio cos
export async function createValuation(companyId: string, data: ValuationInput)
export async function getValuationHistory(companyId: string)
```

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add src/lib/actions/portfolio-monitoring.ts src/__tests__/
git commit -m "feat: portfolio monitoring server actions with KPI trends"
```

---

### Task 5.3: Portfolio Monitoring Dashboard UI

**Files:**
- Create: `src/components/portfolio/portfolio-dashboard.tsx`
- Create: `src/components/portfolio/kpi-sparkline.tsx`
- Create: `src/components/portfolio/valuation-history.tsx`
- Modify: `src/app/(dashboard)/portfolio/page.tsx` (or wherever portfolio overview lives)

**Step 1: Build PortfolioDashboard component**

- Fund-level cards: Total NAV, Total Invested, Aggregate MOIC, Fund IRR
- Per-company rows: name, invested, current value, MOIC, status badge
- Sparklines for key metrics (revenue, EBITDA) using CSS bars (no Recharts)

**Step 2: Build KPISparkline component**

Mini CSS-based sparkline showing 4-6 period trend. Use CSS `background: linear-gradient(...)` or small div bars. No chart library.

**Step 3: Build ValuationHistory component**

Table showing valuation history: date, value, methodology, change vs. prior, official badge.

**Step 4: Run build**

**Step 5: Commit**

```bash
git add src/components/portfolio/ src/app/
git commit -m "feat: portfolio monitoring dashboard with KPI sparklines"
```

---

## Phase 6: Investor Communications Hub

> Priority 4.2 from SESSION_HANDOFF. ~2 days.

### Task 6.1: Email Template System

**Files:**
- Create: `src/lib/email-templates.ts`
- Test: `src/__tests__/email-templates.test.ts`

**Step 1: Write tests**

```typescript
describe('email templates', () => {
  it('renders capital call notice template', () => {})
  it('renders quarterly update template', () => {})
  it('renders custom template with variables', () => {})
  it('escapes HTML in variable values', () => {})
})
```

**Step 2: Implement email templates**

```typescript
export type TemplateType = 'capital_call' | 'distribution' | 'quarterly_update' | 'custom'

export function renderEmailTemplate(
  type: TemplateType,
  variables: Record<string, string>
): { subject: string; html: string }
```

Templates should be minimal HTML: fund branding colors, clean typography, professional tone matching "Autoridad Serena" voice.

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add src/lib/email-templates.ts src/__tests__/
git commit -m "feat: email template system for investor communications"
```

---

### Task 6.2: Bulk Communication Server Actions

**Files:**
- Create: `src/lib/actions/communications.ts`

**Step 1: Implement bulk send action**

```typescript
export async function sendBulkCommunication(fundId: string, data: {
  recipientIds: string[]  // investor IDs
  templateType: TemplateType
  subject: string
  body: string
  attachmentUrl?: string
}) {
  // 1. Auth + fund access
  // 2. Get investor emails
  // 3. Send via Resend (batch API or loop)
  // 4. Create Communication records for each investor
  // 5. logAudit
}

export async function getCommunicationHistory(investorId: string)
```

**Step 2: Run build**

**Step 3: Commit**

```bash
git add src/lib/actions/communications.ts
git commit -m "feat: bulk investor communication with tracking"
```

---

### Task 6.3: Communications UI

**Files:**
- Create: `src/components/investors/communication-composer.tsx`
- Create: `src/components/investors/communication-history.tsx`
- Modify: investor detail page

**Step 1: Build CommunicationComposer**

- Recipient picker (multi-select from funded investors)
- Template selector
- Subject + body editors
- Attachment option (existing documents)
- Send button with confirmation

**Step 2: Build CommunicationHistory**

- Timeline view of all communications with an investor
- Direction indicator (inbound/outbound)
- Date, subject, read status

**Step 3: Integrate into investor detail page**

**Step 4: Run build**

**Step 5: Commit**

```bash
git add src/components/investors/ src/app/
git commit -m "feat: investor communications hub with composer and history"
```

---

## Phase 7: Activity Feed & Timeline

> Priority 5.1 from SESSION_HANDOFF. ~1 day.

### Task 7.1: Activity Feed Component

**Files:**
- Create: `src/components/deals/activity-timeline.tsx`
- Modify: `src/lib/actions/deals.ts` (add activity query)
- Modify: deal detail page

**Context:** `Activity` and `AuditLog` models already exist and are populated. Build a read-only timeline view combining both sources.

**Step 1: Implement activity query**

```typescript
export async function getDealTimeline(dealId: string): Promise<TimelineEvent[]> {
  // Combine:
  // 1. Activities (notes, calls, meetings)
  // 2. AuditLog entries for the deal (stage changes, updates)
  // 3. Tasks completed
  // Sort by date descending
}
```

**Step 2: Build ActivityTimeline component**

- Vertical timeline with date markers
- Event type icons (stage change, note, document, call)
- Collapsible event details
- Follow brand colors (muted text, border #334155)

**Step 3: Integrate into deal detail page as a tab or sidebar

**Step 4: Run build**

**Step 5: Commit**

```bash
git add src/components/deals/activity-timeline.tsx src/lib/actions/deals.ts src/app/
git commit -m "feat: deal activity timeline combining activities and audit log"
```

---

## Phase 8: Sentry Monitoring

> Priority 5.5 from SESSION_HANDOFF. ~30 min.

### Task 8.1: Integrate Sentry

**Files:**
- Create: `src/lib/sentry.ts`
- Modify: `next.config.ts`
- Modify: `.env.example`
- Modify: `src/app/global-error.tsx` (create if not exists)

**Step 1: Install Sentry SDK**

```bash
npm install @sentry/nextjs
```

**Step 2: Initialize Sentry with lazy-init pattern**

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

let _initialized = false

export function initSentry() {
  if (_initialized || !process.env.SENTRY_DSN) return
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  })
  _initialized = true
}
```

**Step 3: Add global error handler**

Create `src/app/global-error.tsx` following Next.js app router conventions.

**Step 4: Update .env.example**

```env
SENTRY_DSN=""
```

**Step 5: Run build**

**Step 6: Commit**

```bash
git add src/lib/sentry.ts src/app/global-error.tsx next.config.ts .env.example
git commit -m "feat: add Sentry error monitoring integration"
```

---

## Execution Order Summary

| Phase | Tasks | Effort | Dependencies |
|-------|-------|--------|--------------|
| **Phase 0** | 0.1–0.3 | 30 min | None (ops only) |
| **Phase 1** | 1.1–1.3 | 2-3 hrs | None |
| **Phase 2** | 2.1–2.4 | 2-3 days | Phase 1 (rate limiting) |
| **Phase 3** | 3.1–3.5 | 2 days | Phase 2 (S3 for report PDFs) |
| **Phase 4** | 4.1–4.2 | 1 day | None (parallel with Phase 2-3) |
| **Phase 5** | 5.1–5.3 | 1-2 days | None (parallel) |
| **Phase 6** | 6.1–6.3 | 2 days | Resend configured (Phase 0.2) |
| **Phase 7** | 7.1 | 1 day | None (parallel) |
| **Phase 8** | 8.1 | 30 min | None |

**Total estimated effort: ~9-11 working days**

**Parallelization opportunities:**
- Phase 4 + Phase 5 can run in parallel with Phase 2/3
- Phase 7 + Phase 8 are independent
- Phase 6 requires Resend (Phase 0.2) but is otherwise independent

---

## Testing Strategy

Every task with code changes must:
1. Write failing tests FIRST (TDD)
2. Run `npx vitest run` — all 187+ tests must pass
3. Run `npm run build` — zero errors
4. Run `npm run lint` — clean

New test files expected:
- `settings-audit.test.ts` (4 tests)
- `document-versions.test.ts` (~6 tests)
- `quarterly-updates.test.ts` (~8 tests)
- `deal-scoring.test.ts` (~5 tests)
- `portfolio-monitoring.test.ts` (~6 tests)
- `email-templates.test.ts` (~5 tests)

**Target: 220+ total tests by end of roadmap.**

---

## Schema Changes Summary

| Model | Action | Phase |
|-------|--------|-------|
| `Report` | ADD (from PRD, not in actual schema) | Phase 3.1 |
| `Valuation` | ADD (from PRD, not in actual schema) | Phase 5.1 |
| `Document` | No changes (version fields already exist) | — |
| `Deal` | No changes (scoring fields already exist) | — |

**IMPORTANT:** After any schema change, ALWAYS run `npx prisma generate` before building.

---

## Files NOT to Touch

These files are stable and should not be modified unless absolutely necessary:
- `src/lib/shared/formatters.ts` — Single source of truth for formatting
- `src/lib/shared/fund-access.ts` — Auth guard
- `src/lib/shared/audit.ts` — Audit infrastructure
- `src/lib/shared/soft-delete.ts` — Soft delete utility
- `src/lib/auth.ts` — Auth config
- `CLAUDE.md` — Engineering constitution
- `prisma/schema.prisma` — Only modify in designated tasks
