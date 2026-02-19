# ENGINEERING SPECIFICATION
## Self-Service Onboarding Wizard
### Phase 2 — Multi-Tenant Registration Flow

**v2.0 — Incorporates Marcus Review Corrections**

NIRO Group LLC — Strictly Confidential | February 2026

---

| Field | Value |
|-------|-------|
| Status | Ready for Implementation |
| Version | 2.0 — Post Marcus Review |
| Priority | P0 — Blocking Production |
| Prerequisite | Phase 1 Multi-Tenant (Organization model, subdomain routing) |
| Schema Changes | None — all models exist from Phase 1 migration |
| Estimated Effort | 5–6 engineering days (expanded from v1 per Marcus recommendations) |
| Key Change v2 | 2 vehicle types (not 3), currency for Search Funds, welcome email, funnel tracking, CTA wiring, post-registration empty state |

---

## v2 Change Log — Marcus Review Corrections

| # | Change | Rationale |
|---|--------|-----------|
| 1 | Eliminated Micro-PE vehicle type. Now 2 types: Search Fund, PE Fund. | Micro-PE vs PE Fund wizard difference was 2 optional fields. Adds cognitive load at Step 1 for marginal value. Micro-PE users select PE Fund and skip optional fields. |
| 2 | Removed FundMember.permissions array from spec. | Field does not exist in Prisma schema. Authorization uses UserRole + FundMemberRole enums. |
| 3 | Removed Organization.country and Organization.baseCurrency references. | Fields may not exist in Phase 1 schema. All field references now require verification against actual schema. |
| 4 | Search Fund hurdleRate default changed from null to 0.08 (8%). | Industry standard for search funds. Aligns with seed data. LPs expect preferred return on traditional search fund structures. |
| 5 | Added currency selection (USD/EUR/GBP) to Search Fund flow. | BlackGem targets LATAM and European managers. Hardcoding USD excludes core market. |
| 6 | Added post-registration empty state design + AI copilot placeholder. | Strategic alignment with AI-native pivot. Empty dashboard with zero data is worst possible first impression. |
| 7 | Moved landing page CTA wiring from "open question" to "in scope". | Registration flow is useless without discoverability. 30 minutes of work. |
| 8 | Added funnel tracking via existing audit log infrastructure. | 5 logAudit calls. No new dependencies. Operational intelligence on most important conversion flow. |
| 9 | Added welcome email post-registration via existing Resend infrastructure. | Professional credibility. User gets confirmation their fund is set up correctly. |
| 10 | Standardized password minimum to 8 chars across ALL flows (including accept-invite). | Eliminates day-one technical debt of inconsistent password policies. |

---

## Table of Contents

1. [Strategic Context](#1-strategic-context)
2. [Architecture Overview](#2-architecture-overview)
3. [Vehicle Type Branching](#3-vehicle-type-branching)
4. [Step-by-Step Flow Detail](#4-step-by-step-flow-detail)
5. [Server Action: registerWithOnboarding()](#5-server-action-registerwithonboarding)
6. [Search Fund Auto-Defaults](#6-search-fund-auto-defaults)
7. [File Manifest](#7-file-manifest)
8. [UX Design](#8-ux-design)
9. [Funnel Tracking](#9-funnel-tracking)
10. [Landing Page CTA Wiring](#10-landing-page-cta-wiring)
11. [Implementation Sequence](#11-implementation-sequence)
12. [Testing Requirements](#12-testing-requirements)
13. [Risk Register](#13-risk-register)
14. [Scope Boundaries](#14-scope-boundaries)
15. [Appendix](#15-appendix)

---

## 1. Strategic Context

### 1.1 Why This Exists

Phase 1 of multi-tenant (Organization model, subdomain routing, wildcard DNS+SSL) is deployed. Phase 2 is the self-service onboarding wizard — the `/register` route where new users create their Organization, Fund, and Account in a single flow and land on `{fund-slug}.blackgem.ai/dashboard`.

Without this, there is no way to test the full tenant creation flow end-to-end, and no path for organic user acquisition. Every CTA on the landing page and pricing page is currently non-functional.

### 1.2 JTBD — Job to Be Done

> "I just committed to launching my search fund. I need a platform that makes me look institutional to my LPs from day one — I need to be operational in under 5 minutes, not fighting software setup."

The wizard must accomplish two things simultaneously: (1) create the complete data hierarchy (Organization → User → Fund → FundMember) in a single atomic transaction, and (2) deliver the user to their personalized subdomain with a guided first experience — not an empty dashboard.

### 1.3 Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | Search Fund flow completes in ≤3 steps | Step count = 3 |
| 2 | PE Fund flow completes in ≤5 steps | Step count = 5 |
| 3 | Wizard → Dashboard transition < 3 seconds | Time from submit to dashboard render |
| 4 | Zero orphaned records on any failure path | Prisma $transaction or nothing |
| 5 | Mobile-usable at 375px minimum width | Manual QA on iPhone SE viewport |
| 6 | All uniqueness conflicts surface inline errors | Email, org slug, fund slug validated |
| 7 | Rate limited: 5 attempts per email per 5 minutes | Server-side enforcement |
| 8 | Registration funnel is tracked via audit log | Step transitions logged with vehicleType |
| 9 | Welcome email sent within 30 seconds of registration | Resend delivery confirmation |
| 10 | Landing page CTAs route to /register | "Get Started" buttons functional |

---

## 2. Architecture Overview

### 2.1 System Flow

```
PUBLIC ROUTE: blackgem.ai/register
  │
  ├─ Client-side wizard (React state, Zod validation per step)
  │    ├─ Step 1: Vehicle Type selection (Search Fund | PE Fund)
  │    ├─ Step 2-N: Form fields (varies by vehicle type)
  │    ├─ logAudit('ONBOARDING', step, vehicleType) on each step transition
  │    └─ Final Step: Submit → registerWithOnboarding() server action
  │
  ├─ Server Action (single Prisma $transaction)
  │    ├─ Rate limit check (5/email/5min)
  │    ├─ Validate full input (Zod)
  │    ├─ Validate slugs (reserved words, format)
  │    ├─ Check uniqueness (email, org slug, fund slug — parallel)
  │    ├─ Hash password (bcrypt, 10 rounds)
  │    ├─ CREATE: Organization (onboardingCompleted: true)
  │    ├─ CREATE: User (SUPER_ADMIN, organizationId)
  │    ├─ CREATE: Fund (organizationId, slug, status: RAISING)
  │    ├─ CREATE: FundMember (PRINCIPAL)
  │    └─ RETURN: { success: true, fundSlug }
  │
  ├─ logAudit() × 3 (Organization, User, Fund — fire-and-forget)
  │
  ├─ Send welcome email via Resend (fire-and-forget)
  │
  └─ Client-side auto-login
       ├─ signIn('credentials', { email, password, redirect: false })
       ├─ JWT cookie set on .blackgem.ai domain
       └─ window.location.href → {fundSlug}.blackgem.ai/dashboard
```

### 2.2 Key Architectural Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| 2 vehicle types, not 3 | Micro-PE vs PE difference is 2 optional fields. Adds cognitive load for zero value. Micro-PE users select PE Fund and leave optional fields blank. | 3-type model (Micro-PE as distinct path) |
| Single server action on final submit | Atomic transaction — no orphaned records. Simpler error handling. | Step-by-step server calls (complex rollback) |
| Client-side wizard state | No server round-trips between steps. Instant validation. | Server-side session wizard (unnecessary latency) |
| signIn() after action success | Leverages existing NextAuth JWT. Cookie on .blackgem.ai works across subdomains. | Custom token generation (reinventing wheel) |
| window.location.href for redirect | Hard navigation ensures subdomain cookie read fresh. Router.push cannot cross subdomains. | Next.js router (cannot cross subdomains) |
| Rate limit by email, not IP | Prevents brute-force for specific emails. IP-based too aggressive behind NAT. | IP-based rate limiting (blocks shared networks) |
| Welcome email fire-and-forget | Email failure must not block registration success. Log error via Sentry. | Synchronous email (blocks registration on Resend failure) |

### 2.3 Auth Integration

- **Auth config change:** Expand `isAuthPage` array in `src/lib/auth.config.ts` to include `/register`.
- **SessionProvider:** Wizard component wrapped in `SessionProvider` (next-auth/react) to enable `signIn()` call.
- **COOKIE_DOMAIN=.blackgem.ai:** Already configured in Phase 1.
- **Password policy:** 8-character minimum standardized across ALL password creation flows — including `/accept-invite`.

> ▸ CHANGE v2: accept-invite password minimum updated from 6 to 8 characters in same PR.

---

## 3. Vehicle Type Branching

> ▸ CHANGE v2: Reduced from 3 vehicle types to 2. Micro-PE eliminated as distinct onboarding path.

The wizard adapts its step count and field set based on the vehicle type selected in Step 1. Two selection cards, not three. The "Micro-PE" user persona (small fund manager, 1-3 funds) selects PE Fund and leaves optional fields blank.

| Aspect | Search Fund | PE Fund |
|--------|-------------|---------|
| Target user | Solo searcher, first-time fund operator | Small to mid-market GP, 1+ funds |
| Card description | "Raising capital to acquire and operate a single business." | "Managing one or more funds — from single-fund operators to multi-vehicle firms." |
| Time to complete | ~3 minutes | ~5 minutes |
| Wizard steps | 3 (type + combined firm/fund/account + success) | 5 (type + firm + fund + account + success) |
| Org fields | Name only (legal name auto-set) | Name, slug (editable), legal name, entity type, jurisdiction |
| Fund fields | Target size + currency only (name, type, vintage auto-set) | Name, slug (editable), type, target size, currency, vintage, strategy |
| Fee fields | Auto-set: 2%/20%/8% | Auto-set: 2%/20%/null. Configure in settings. |
| Fund type | Auto: TRADITIONAL_SEARCH_FUND | User selects from FundType enum |
| Slug | Auto-generated from name | Auto-generated, editable |

### 3.1 Why Fees Are Skipped

Management fee, carried interest, and hurdle rate have sensible defaults already set by the creation logic. Showing fee configuration during onboarding adds cognitive load without value — the user can configure them immediately in Fund Settings. Principle: get them to the dashboard fast, let them configure at their own pace.

---

## 4. Step-by-Step Flow Detail

### 4.1 Step 1: Vehicle Type Selection

**Title:** "What are you building?"
**Subtitle:** "Select the type of investment vehicle you're setting up."

> ▸ CHANGE v2: 2 selection cards (was 3). Micro-PE eliminated.

| Card | Title | Description |
|------|-------|-------------|
| 1 | Search Fund | "Raising capital to acquire and operate a single business." |
| 2 | PE Fund | "Managing one or more funds — from single-fund operators to multi-vehicle firms." |

Clicking a card advances to Step 2. No dropdown, no radio buttons — visual cards only.

### 4.2 Step 2: Search Fund — "Set Up Your Fund"

Combined firm/fund/account step. One screen, minimal fields. The org name is used for `Organization.name`, `Fund.name`, and `Fund.slug`.

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| orgName | "Fund name" | Text | Yes | Used for org name, fund name, and auto-generates slug |
| orgSlug | — | Auto-gen | — | Preview: "Your URL: martha-fund.blackgem.ai" |
| targetSize | "How much are you raising?" | Currency | Yes | e.g., "$5,000,000". Min 1,000. |
| currency | "Currency" | Select | Yes | USD, EUR, GBP. Default: USD. |
| userName | "Your name" | Text | Yes | Min 2 chars, max 100 |
| userEmail | "Email" | Email | Yes | Valid email format. Unique in system. |
| password | "Password" | Password | Yes | Min 8 characters. |
| confirmPwd | "Confirm password" | Password | Yes | Must match password. |

> ▸ CHANGE v2: Currency selector added. Was hardcoded USD — excludes LATAM/EU target market.

### 4.3 Step 2: PE Fund — "About Your Firm"

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| orgName | "Firm name" | Text | Yes | Display name ("Andes Capital Partners") |
| orgSlug | "URL" | Text (auto, editable) | Yes | Preview: "andes-capital.blackgem.ai" |
| legalName | "Legal entity name" | Text | Optional | Registered legal name |
| entityType | "Entity type" | Select | Optional | LLC, LP, C Corp, etc. |
| jurisdiction | "Jurisdiction" | Text | Optional | Country/state of formation |

> ▸ CHANGE v2: All PE firm fields now Optional (was: some Required for PE, Optional for Micro-PE). Users who need them fill them; others skip.

### 4.4 Step 3: PE Fund — "Set Up Your First Fund"

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| fundName | "Fund name" | Text | Yes | e.g., "Andes Capital Fund I" |
| fundSlug | "Fund URL" | Text (auto, editable) | Yes | Preview: "andes-fund-i.blackgem.ai" |
| fundType | "Fund type" | Select | Yes | Maps to Prisma FundType enum (6 values) |
| targetSize | "Target fund size" | Currency | Yes | e.g., "$25,000,000" |
| vintage | "Vintage year" | Year picker | Optional | e.g., 2026 |
| currency | "Base currency" | Select | Yes | USD, EUR, GBP. Default: USD. |
| strategy | "Investment thesis" | Textarea | Optional | Brief description, max 500 chars |

### 4.5 Step 4: PE Fund — "Create Your Account"

**Subtitle:** "You'll be the administrator of your firm on BlackGem."

| Field | Label | Type | Required | Validation |
|-------|-------|------|----------|------------|
| userName | "Full name" | Text | Yes | Min 2 chars, max 100 |
| userEmail | "Email address" | Email | Yes | Valid email, unique in system |
| password | "Password" | Password | Yes | Min 8 characters |
| confirmPwd | "Confirm password" | Password | Yes | Must match password |

### 4.6 Success Step (Both Flows)

No form. Shows: green CheckCircle icon, "Your account is ready.", "Redirecting to your dashboard..."

Auto-login happens in background. Redirect to `{fund-slug}.blackgem.ai/dashboard`.

Fallback if `signIn()` fails: "Account created successfully. Sign in to continue." with link to `/login`.

---

## 5. Server Action: registerWithOnboarding()

### 5.1 Signature

```typescript
'use server'

type OnboardingInput = {
  vehicleType: 'SEARCH_FUND' | 'PE_FUND'
  // Organization
  firmName: string
  orgSlug: string
  legalName?: string        // PE only, optional
  entityType?: string       // PE only, optional
  jurisdiction?: string     // PE only, optional
  // Fund
  fundName?: string         // PE only (Search: auto = firmName)
  fundSlug?: string         // PE only (Search: auto = orgSlug)
  fundType?: FundType       // PE only (Search: auto = TRADITIONAL_SEARCH_FUND)
  targetSize: number
  vintage?: number          // PE only (Search: auto = currentYear)
  currency: string          // USD | EUR | GBP (required for both flows)
  strategy?: string
  // Account
  name: string
  email: string
  password: string
  confirmPassword: string
}

type OnboardingResult =
  | { success: true; fundSlug: string }
  | { error: string }
```

> ▸ CHANGE v2: `currency` now required for both flows (was hardcoded USD for Search Fund).

### 5.2 Execution Sequence

| # | Step | Details |
|---|------|---------|
| 1 | Rate limit check | 5 attempts per email per 5 min. In-memory Map with TTL. Return error on exceed. |
| 2 | Validate full input | `onboardingSchema.safeParse(input)`. Return first error on failure. |
| 3 | Validate slugs | `validateSlug(orgSlug)` and `validateSlug(fundSlug)`. Format + reserved words. |
| 4 | Check uniqueness (parallel) | `Promise.all([email, orgSlug, fundSlug])`. Specific error per conflict. |
| 5 | Hash password | `bcrypt.hash(password, 10)`. Same pattern as accept-invite flow. |
| 6 | Prisma $transaction | Create 4 records atomically (see §5.3). |
| 7 | Audit logging | `logAudit()` × 3 outside transaction. Fire-and-forget, try/catch. |
| 8 | Welcome email | Send via Resend. Fire-and-forget, try/catch with Sentry. |
| 9 | Return | `{ success: true, fundSlug }`. Handle P2002 in catch for race conditions. |

### 5.3 Transaction: Entity Creation

| # | Entity | Key Fields |
|---|--------|------------|
| 1 | Organization | name: firmName, slug: orgSlug, onboardingCompleted: true. legalName/entityType/jurisdiction only if provided. |
| 2 | User | email, name, passwordHash, role: SUPER_ADMIN, organizationId: org.id |
| 3 | Fund | name, slug, organizationId, type, status: RAISING, targetSize, vintage, currency, managementFee: 0.02, carriedInterest: 0.20. Search Fund also sets hurdleRate: 0.08. |
| 4 | FundMember | fundId, userId, role: PRINCIPAL, isActive: true |

> ▸ CHANGE v2: FundMember no longer references a `permissions` array. Field does not exist in schema. Role-based access via FundMemberRole enum.

> ▸ CHANGE v2: Organization no longer references `country` or `baseCurrency` fields. Verify Phase 1 schema before implementing.

> ▸ CHANGE v2: Search Fund hurdleRate set to 0.08 (8%). Was null. Industry standard for traditional search funds.

### 5.4 Error Handling

| Error Condition | Detection | User-Facing Message |
|-----------------|-----------|---------------------|
| Rate limit exceeded | In-memory counter check | "Too many attempts. Please try again in a few minutes." |
| Zod validation failure | `safeParse().success === false` | First error message from Zod |
| Invalid slug format | `validateSlug()` returns false | "URL must be 3-48 characters, lowercase letters, numbers, and hyphens only." |
| Reserved slug | `RESERVED_SLUGS.has(slug)` | "This URL is reserved. Please choose a different name." |
| Email already exists | `prisma.user.findUnique` | "An account with this email already exists." |
| Org slug taken | `prisma.organization.findUnique` | "This firm URL is already taken." |
| Fund slug taken | `prisma.fund.findUnique` | "This fund URL is already taken." |
| P2002 race condition | Prisma error code in catch | "This email or URL was just taken. Please try again." |
| Unknown error | Generic catch block | "Something went wrong. Please try again." |

---

## 6. Search Fund Auto-Defaults

When `vehicleType === 'SEARCH_FUND'`, these values are auto-set programmatically. Never shown in UI except currency selector.

| Field | Auto-Set Value | Rationale |
|-------|---------------|-----------|
| fundType | TRADITIONAL_SEARCH_FUND | Default for search fund operators. Can change in settings. |
| entityType | LLC | Most common entity for US search funds |
| vintage | `new Date().getFullYear()` | Current year at registration |
| legalName | = firmName | Simplification — change in settings |
| fundName | = firmName | Search funds typically use firm name |
| fundSlug | = orgSlug | One slug for both org and fund |
| currency | User-selected (USD/EUR/GBP) | Required field in Search Fund flow |
| managementFee | 0.02 (2%) | Industry standard |
| carriedInterest | 0.20 (20%) | Industry standard |
| hurdleRate | 0.08 (8%) | Industry standard preferred return |

> ▸ CHANGE v2: hurdleRate changed from null to 0.08. LPs expect preferred return on traditional search fund structures.

> ▸ CHANGE v2: currency changed from hardcoded USD to user-selected. LATAM/EU market requirement.

Note on fund type: if the user is running a self-funded search, they can change to `SELF_FUNDED_SEARCH` in Fund Settings after registration. A subtle text hint below the fund name field: *"Running a self-funded search? You can change your fund type in Settings after signup."*

---

## 7. File Manifest

### 7.1 Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/lib/shared/slug-utils.ts` | Pure functions: `generateSlug()`, `validateSlug()`, `RESERVED_SLUGS`. No `'use server'`. |
| `src/lib/shared/onboarding-schemas.ts` | Zod schemas per wizard step. Shared client + server. |
| `src/lib/actions/onboarding.ts` | `registerWithOnboarding()` server action. No auth. Rate-limited. |
| `src/components/auth/register-wizard.tsx` | Main wizard client component. Steps, state, validation, auto-login. |
| `src/app/register/page.tsx` | Page wrapper. Dark mode layout. SessionProvider. |
| `src/lib/actions/__tests__/onboarding.test.ts` | Unit tests for server action. |
| `src/lib/shared/__tests__/slug-utils.test.ts` | Unit tests for slug utilities. |
| `src/lib/shared/__tests__/onboarding-schemas.test.ts` | Unit tests for Zod schemas. |

### 7.2 Files to Modify

| File Path | Purpose |
|-----------|---------|
| `src/lib/auth.config.ts` | Add `/register` to `isAuthPage` (redirect logged-in users). |
| `src/lib/actions/organizations.ts` | Re-export slug functions from `slug-utils.ts`. |
| `src/lib/actions/__tests__/organization-validation.test.ts` | Update import paths for slug functions. |
| `src/components/auth/accept-invite-form.tsx` | Update password minimum from 6 to 8 characters. |
| `src/app/page.tsx` | Wire "Get Started" button in header nav to `/register`. |
| `src/app/pricing/page.tsx` | Wire "Get Started" on Searcher + Operator tiers to `/register`. |

> ▸ CHANGE v2: `accept-invite-form.tsx` added: password policy standardization.

> ▸ CHANGE v2: Landing page + pricing page added: CTA wiring (was "open question", now in scope).

---

## 8. UX Design

### 8.1 Visual Consistency

| Element | Specification |
|---------|---------------|
| Layout | `bg-[#11141D]`, vertical "BlackGem" brand mark on left, centered form `max-w-[520px]`, footer |
| Step indicator | Horizontal dots/numbers. Current: `bg-[#3E5CFF]`. Completed: `bg-[#059669]`. Upcoming: `bg-[#334155]`. |
| Inputs | `bg-[#1E2432] border-[#334155] focus:border-[#3E5CFF]`. Same as login page. |
| CTA button | `bg-[#3E5CFF] hover:bg-[#3350E0]`. Full width. |
| Back navigation | `text-slate-400 hover:text-slate-300`, ArrowLeft icon. Data preserved on back. |
| Error display | AlertCircle icon + `text-red-400`, `aria-live="polite"`. |
| Loading state | Button text: "Creating account..." — NO spinner. |
| Slug preview | "Your URL: martha-fund.blackgem.ai" — `text-slate-500 font-mono text-[13px]`. Live update. |
| Step titles | `font-serif text-[28px] text-[#F8FAFC]`. |
| Mobile | Single column < 768px. Step indicator: "Step 2 of 4" text. Full-width inputs. |
| Bottom link | "Already have an account? Sign in" — muted style matching login page. |
| Prohibited | No emojis. No illustrations. No spinners. No animations beyond subtle transitions. |

### 8.2 Post-Registration First Experience

> ▸ CHANGE v2: NEW SECTION. Addresses empty-state dashboard problem.

A new registration lands on a dashboard with ZERO data — empty charts, empty pipeline, empty investor table. This is the worst possible first impression. The design must address what the user sees immediately after registration.

#### 8.2.1 Immediate: "Getting Started" Card

On the dashboard, a prominent card (not dismissable until at least 2 items are completed) with 4-5 actionable next steps:

```
"Welcome to BlackGem, Maria."
"Your fund Andes Fund I is ready. Here's what to do next:"

☐ Configure your fund settings (fees, dates, legal details)
☐ Add your first deal to the pipeline
☐ Invite your investors / LPs
☐ Upload your fund documents (PPM, LPA, side letters)
☐ Invite team members
```

#### 8.2.2 Future: AI Operating Partner Introduction

When the AI copilot ships, the success step and/or the getting-started card should introduce the AI operating partner. The current design should leave a clear integration point — a placeholder component on the success step that can be swapped for the AI introduction without restructuring the wizard.

Target terminal experience: "Meet your AI Operating Partner" → first conversational interaction → AI helps the user configure their fund. This is the strategic intent from the Copilot Plan.

### 8.3 Welcome Email

> ▸ CHANGE v2: NEW. Uses existing Resend infrastructure and email template patterns.

- **Subject:** "Welcome to BlackGem — Your fund is ready"
- **From:** BlackGem <noreply@blackgem.ai> (existing Resend config)
- **Template:** Follow existing `email-templates.ts` pattern (HTML with inline styles).

Content:

```
Hi {userName},

Your fund {fundName} is set up and ready to go.

Your dashboard: https://{fundSlug}.blackgem.ai/dashboard

Next steps:
- Configure your fund settings
- Add your first deal
- Invite your investors

Questions? Reply to this email.

— The BlackGem Team
```

Implementation: fire-and-forget after server action success. try/catch with Sentry logging. Email failure must NEVER block registration success.

---

## 9. Funnel Tracking

> ▸ CHANGE v2: NEW SECTION. Was "out of scope" in design doc. Now in scope.

Lightweight funnel tracking using the existing audit log infrastructure. Five `logAudit` calls at step transitions. No new dependencies, no third-party analytics.

| # | Event | Audit Log Entry |
|---|-------|-----------------|
| 1 | User visits /register | entityType: `ONBOARDING`, action: `VIEW`, metadata: `{ step: 'landing' }` |
| 2 | User selects vehicle type | entityType: `ONBOARDING`, action: `CREATE`, metadata: `{ step: 'vehicle_type', vehicleType }` |
| 3 | User completes firm/fund step(s) | entityType: `ONBOARDING`, action: `UPDATE`, metadata: `{ step: 'details', vehicleType }` |
| 4 | User submits registration | entityType: `ONBOARDING`, action: `CREATE`, metadata: `{ step: 'submit', vehicleType }` |
| 5 | User arrives at dashboard | entityType: `ONBOARDING`, action: `VIEW`, metadata: `{ step: 'dashboard', vehicleType, fundSlug }` |

Events 1-3 fire from the client (no userId yet, use null). Event 4 fires in the server action (userId now exists). Event 5 fires on dashboard mount if a `firstLogin` flag is detected.

This gives you: drop-off rates per step, vehicle type distribution, registration-to-dashboard conversion rate. Queryable via the existing AuditLog table with standard Prisma queries.

---

## 10. Landing Page CTA Wiring

> ▸ CHANGE v2: NEW SECTION. Was "open question" in design doc. Now in scope.

| CTA | Current State | New Behavior |
|-----|---------------|--------------|
| "Get Started" (header nav) | Does not exist | NEW: Add to header nav → `/register` |
| "Get Started" (Searcher tier) | Inert `<button>` | Link to `/register?type=search` |
| "Get Started" (Operator tier) | Inert `<button>` | Link to `/register?type=pe` |
| "Contact Sales" (Fund Manager tier) | Inert `<button>` | Keep as-is (Marcus recommendation) |
| "Request Access" (hero) | Scrolls to #contact (no form) | Keep as-is. Add `/register` as secondary path. |
| "Request Access" (mobile) | Scrolls to #contact | Keep as-is. |

The `?type=search` and `?type=pe` query parameters pre-select the vehicle type on Step 1, skipping one click. The wizard reads the query param on mount and auto-advances if valid.

Estimated effort: 30-45 minutes. Three file touches (`page.tsx`, `pricing/page.tsx`, `register-wizard.tsx` query param handling).

---

## 11. Implementation Sequence

Strict ordering. Each phase must pass its verification gate before proceeding. Expanded from v1 to include new scope items.

### Phase A: Foundation (No UI — Pure Logic) — Day 1

| # | Task | Gate |
|---|------|------|
| A1 | Create `src/lib/shared/slug-utils.ts` | Functions exported, no `'use server'` |
| A2 | Update `organizations.ts` — re-export from slug-utils | Existing behavior unchanged |
| A3 | Update test imports in `organization-validation.test.ts` | `npm test` — all existing tests pass |
| A4 | Create `onboarding-schemas.ts` — per-step Zod schemas | Schemas export correctly |
| A5 | Create `onboarding.ts` server action | Action compiles, types check |
| A6 | Create all unit tests (action + schemas + slugs) | `npm test` — all pass |

**[GATE A: npm test passes. npm run build clean. Zero regressions.]**

### Phase B: Auth + Password Standardization — Day 2 AM

| # | Task | Gate |
|---|------|------|
| B1 | Update `auth.config.ts` — add `/register` to `isAuthPage` | Logged-in users redirected |
| B2 | Update `accept-invite-form.tsx` — password min 6 → 8 | Consistent policy everywhere |

**[GATE B: Build clean. Password policy consistent across all flows.]**

### Phase C: Wizard UI — Day 2 PM + Day 3

| # | Task | Gate |
|---|------|------|
| C1 | Create `register-wizard.tsx` — full wizard (2 vehicle types) | Steps navigate, validation works |
| C2 | Create `register/page.tsx` — page wrapper, SessionProvider | Page loads at `/register` |
| C3 | Implement query param pre-selection (`?type=search`, `?type=pe`) | Pre-selection works from CTAs |
| C4 | Manual test: Search Fund flow → dashboard | E2E works |
| C5 | Manual test: PE Fund flow → dashboard | E2E works |

**[GATE C: Both flows work E2E. UI matches login page.]**

### Phase D: Post-Registration Experience — Day 4

| # | Task | Gate |
|---|------|------|
| D1 | Build "Getting Started" card component for empty dashboard | Card renders with 5 action items |
| D2 | Add welcome email template + send in server action | Email sends on registration |
| D3 | Add funnel tracking `logAudit` calls (5 events) | Events visible in AuditLog table |
| D4 | Wire landing page CTAs (`page.tsx` + `pricing/page.tsx`) | Buttons route to `/register` |

**[GATE D: Welcome email sends. CTAs work. Funnel events logged.]**

### Phase E: Final Verification — Day 5

| # | Task | Gate |
|---|------|------|
| E1 | `npm run lint` — clean | Zero warnings |
| E2 | `npm run build` — clean | Zero errors |
| E3 | `npm test` — all pass | All existing + new tests green |
| E4 | Manual: Search Fund → dashboard + getting started card | Verified |
| E5 | Manual: PE Fund → dashboard + getting started card | Verified |
| E6 | Manual: `/register` while logged in → redirect | Verified |
| E7 | Manual: Duplicate email/slug → inline errors | Verified |
| E8 | Manual: All steps at 375px width | Verified |
| E9 | Manual: Welcome email received | Verified |
| E10 | Manual: Landing page CTAs → `/register` | Verified |
| E11 | Manual: Pricing page CTAs → `/register` with `?type` param | Verified |

**[GATE E: Ship. Merge to main.]**

---

## 12. Testing Requirements

### 12.1 Unit Tests — Server Action

| Test Case | Expected Behavior |
|-----------|-------------------|
| Happy path: Search Fund registration | Creates Org + User + Fund + FundMember. Returns `{ success, fundSlug }`. |
| Happy path: PE Fund registration | Creates all entities with PE-specific optional fields. |
| Search Fund: hurdleRate set to 0.08 | `Fund.hurdleRate = 0.08` in created record. |
| Search Fund: currency from input (EUR) | `Fund.currency = 'EUR'`, not hardcoded USD. |
| Validation: missing required fields | Returns error with first validation message. |
| Validation: password mismatch | Returns "Passwords do not match" error. |
| Validation: password < 8 chars | Returns minimum length error. |
| Validation: invalid email format | Returns email format error. |
| Uniqueness: duplicate email | Returns specific error message. |
| Uniqueness: duplicate org slug | Returns specific error message. |
| Uniqueness: duplicate fund slug | Returns specific error message. |
| Rate limiting: 6th attempt in 5 min | Returns rate limit error. |
| Transaction rollback: DB error | No orphaned records. Returns generic error. |
| P2002 race condition | Returns friendly message. |
| Welcome email: called after success | Resend send function called with correct params. |
| Welcome email: failure doesn't block | Registration succeeds even if email throws. |

### 12.2 Unit Tests — Slug Utilities

| Test Case | Expected |
|-----------|----------|
| `generateSlug('Martha Capital')` → `'martha-capital'` | Lowercase, spaces to hyphens |
| `generateSlug('Über Investments!!!')` → `'uber-investments'` | Special chars removed |
| `validateSlug('good-slug')` → `true` | Valid format |
| `validateSlug('ab')` → `false` | Too short |
| `validateSlug('-bad')` → `false` | Leading hyphen |
| `validateSlug('admin')` → `false` | Reserved slug |

### 12.3 Manual Testing Checklist

| Scenario | Expected Result |
|----------|-----------------|
| Search Fund flow → dashboard | Arrives at `{slug}.blackgem.ai/dashboard` |
| PE Fund flow → dashboard | Arrives at `{slug}.blackgem.ai/dashboard` |
| `/register` while logged in | Redirected to `/deals` |
| Duplicate email/slug | Inline error messages |
| 375px width | All steps usable, no scroll |
| Slug preview updates live | Typing firm name updates URL preview |
| Getting Started card on fresh dashboard | Card visible with 5 items |
| Welcome email received | Email in inbox within 30s |
| Landing page "Get Started" → `/register` | Navigation works |
| Pricing "Get Started" (Searcher) → `/register?type=search` | Pre-selects Search Fund |
| Pricing "Get Started" (Operator) → `/register?type=pe` | Pre-selects PE Fund |
| Search Fund with EUR currency | Fund created with `currency: EUR` |

---

## 13. Risk Register

| Risk | Likelihood | Severity | Mitigation |
|------|-----------|----------|------------|
| Organization model fields mismatch | Medium | CRITICAL | VERIFY Phase 1 schema before coding. Check for `Organization.legalName`, `entityType`, `jurisdiction`. If missing, these become out of scope for this wizard. |
| Race condition on slug | Low | Medium | P2002 handler. User retries with friendly error. |
| signIn() fails after registration | Low | High | Fallback: "Account created — please log in" with `/login` link. |
| Rate limiter resets on deploy | Medium | Low | Acceptable. In-memory for Phase 2. Redis is Phase 3. |
| Welcome email delivery failure | Low | Low | Fire-and-forget. Sentry logging. User can still access dashboard. |
| Empty dashboard discourages new user | High | Medium | Getting Started card. Future: AI copilot introduction. |

---

> ⚠ **CRITICAL PRE-IMPLEMENTATION CHECK**
>
> Verify the Phase 1 migration state before starting:
>
> 1. Does `model Organization` exist in `prisma/schema.prisma`?
> 2. Does User have an `organizationId` field?
> 3. Does Fund have an `organizationId` field?
> 4. What fields does Organization have? (name, slug, onboardingCompleted — what else?)
> 5. Does `OrganizationType` enum exist? If so, what values?
>
> If the Organization model is minimal (id, name, slug, onboardingCompleted only), then legalName, entityType, and jurisdiction are stored on Fund, not Organization — and the wizard field mapping must adjust accordingly.

---

## 14. Scope Boundaries

### 14.1 In Scope

Public `/register` route with multi-step wizard (2 vehicle types). Organization + Fund + User + FundMember creation in single transaction. Auto-login and redirect to fund subdomain. Rate limiting, input validation, audit logging. Unit tests. Currency selection for all flows (USD/EUR/GBP). Welcome email via Resend. Landing page and pricing page CTA wiring. Funnel tracking via audit log. Post-registration Getting Started card. Password standardization to 8 chars across all flows.

### 14.2 Out of Scope (Future)

Email verification flow. Google/OAuth registration. Team invitation during onboarding. Fee configuration during onboarding. Billing/payment integration. CAPTCHA. Terms of Service. Password strength meter. AI copilot introduction (placeholder only in this release). Organization settings page. Analytics dashboard for funnel data (raw audit log queries for now).

### 14.3 Open Decisions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Search Fund: 2 vs 3 steps? | 3 steps | One long form overwhelms. Progress indication reduces perceived complexity. |
| Email verification? | No | Friction kills conversion. Add later with banner. |
| FundType for Search? | Auto-set TRADITIONAL_SEARCH_FUND | Fewer choices = faster onboarding. Add hint: "Change in Settings." |
| Google OAuth? | Not now | Marginal value. Core JTBD is fund setup, not easy sign-up. |
| Link from landing page? | Yes — in scope | Registration flow useless without discoverability. |
| Password minimum? | 8 chars, standardized everywhere | Eliminate inconsistency from day one. |
| 3 vs 2 vehicle types? | 2 types: Search Fund, PE Fund | Micro-PE is PE Fund with optional fields left blank. |

---

## 15. Appendix

### 15.1 Existing Patterns to Follow

| Pattern | Reference File | What to Reuse |
|---------|---------------|---------------|
| Password hashing | `src/lib/actions/users.ts` | `bcrypt.hash(password, 10)` |
| Audit logging | `src/lib/shared/audit.ts` | `logAudit({ userId, action, entityType, entityId, changes })` |
| Error handling | `src/lib/actions/deals.ts` | try/catch with Prisma error code detection |
| Zod validation | Multiple action files | safeParse pattern |
| Fund creation defaults | `prisma/seed.ts` | `managementFee: 0.02, carriedInterest: 0.20, hurdleRate: 0.08` |
| Auth page detection | `src/lib/auth.config.ts` | `isAuthPage` array |
| Dark mode styling | `src/app/login/page.tsx` | Exact color tokens and layout |
| Email templates | `src/lib/email-templates.ts` | HTML with inline styles, Resend send pattern |
| Accept invite flow | `src/components/auth/accept-invite-form.tsx` | Password creation, similar UX |

### 15.2 Dependencies

No new npm dependencies. All libraries already in the project:

```
bcryptjs       — password hashing
zod            — schema validation
next-auth      — signIn() for auto-login
@prisma/client — database operations
lucide-react   — icons (CheckCircle, AlertCircle, ArrowLeft)
resend         — welcome email (existing)
```

### 15.3 Localhost vs Production

| Behavior | Localhost | Production |
|----------|-----------|------------|
| Registration URL | `http://localhost:3002/register` | `https://blackgem.ai/register` |
| Post-login redirect | `http://localhost:3002/dashboard?fund={slug}` | `https://{slug}.blackgem.ai/dashboard` |
| Session cookie | localhost (auto) | `.blackgem.ai` (COOKIE_DOMAIN) |
| Subdomain routing | Query param `?fund={slug}` | DNS-based `{slug}.blackgem.ai` |
| Welcome email | Logs to console (dev mode) | Sends via Resend |

---

*Document version 2.0 — February 2026*
*Post Marcus Review — All corrections incorporated*
*NIRO Group LLC — Strictly Confidential*
