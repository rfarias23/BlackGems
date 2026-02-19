# Onboarding Wizard: Self-Service Registration Flow

**Date:** 2026-02-19
**Status:** DESIGN — Pending review by Marcus
**Scope:** Public registration wizard, organization/fund/account creation, auto-login
**Depends on:** Multi-Tenant Phase 1 (DEPLOYED: Organization model, subdomain routing, wildcard DNS+SSL)
**Spec Reference:** Architecture Doc Section 8 "Onboarding Flow", Spec Section 6 "Search Funds"

---

## Table of Contents

1. [What This Does](#1-what-this-does)
2. [User Journey](#2-user-journey)
3. [Vehicle Type Differentiation](#3-vehicle-type-differentiation)
4. [Step-by-Step Flow Detail](#4-step-by-step-flow-detail)
5. [Technical Architecture](#5-technical-architecture)
6. [Security Considerations](#6-security-considerations)
7. [UX Design](#7-ux-design)
8. [What Gets Created](#8-what-gets-created)
9. [Infrastructure Impact](#9-infrastructure-impact)
10. [Open Questions for Review](#10-open-questions-for-review)
11. [Scope Boundaries](#11-scope-boundaries)
12. [Implementation Timeline](#12-implementation-timeline)

---

## 1. What This Does

Today, BlackGem has **no self-service registration**. New users can only be created by:
- An admin manually creating accounts via `/admin/users`
- An LP invitation email flow (fund manager invites an investor)

The onboarding wizard introduces a **public `/register` route** on `blackgem.ai` where a new fund manager can:
1. Choose their vehicle type (Search Fund, Micro-PE, PE Fund)
2. Set up their firm (Organization)
3. Create their first fund
4. Create their personal account
5. Be automatically logged in and redirected to `{fund-slug}.blackgem.ai/dashboard`

This is the entry point for new customers to start using BlackGem.

---

## 2. User Journey

```
blackgem.ai (landing page)
    │
    └──→ "Get Started" CTA
          │
          ▼
    blackgem.ai/register
          │
          ├── Step 1: "What are you building?"
          │   Choose: Search Fund / Micro-PE / PE Fund
          │
          ├── Step 2: "About your firm"
          │   Organization name, URL slug, legal details
          │   (simplified for Search Funds)
          │
          ├── Step 3: "Your first fund"
          │   Fund name, type, target size, vintage
          │   (auto-created for Search Funds)
          │
          ├── Step 4: "Your account"
          │   Name, email, password
          │
          └── Success:
              ✓ Organization created
              ✓ Fund created
              ✓ Account created (SUPER_ADMIN)
              ✓ Auto-logged in
              ✓ Redirected to {fund-slug}.blackgem.ai/dashboard
```

**Post-registration experience:** The user lands on their fund's dashboard on their own subdomain. From there, they can:
- Invite team members
- Add investors / LPs
- Create deals
- Upload documents
- Configure fund settings

---

## 3. Vehicle Type Differentiation

The architecture document specifies that onboarding complexity should scale with the vehicle type. The same underlying data model is used for all — the wizard conditionally shows/hides fields.

| Aspect | Search Fund | Micro-PE | PE Fund |
|--------|-------------|----------|---------|
| **Target user** | Solo searcher, first-time | Small fund manager, 1-3 funds | Established firm |
| **Time to complete** | ~3 minutes | ~5 minutes | ~8 minutes |
| **Wizard steps** | 3 (type + combined firm/fund + account) | 4 (type + firm + fund + account) | 4 (type + firm + fund + account) |
| **Org fields** | Name only (legal name auto-filled) | Name, legal name | Name, legal name, entity type, jurisdiction |
| **Fund fields** | Target size only (name, type, vintage auto-filled) | Name, type, target size, currency | Name, type, target size, currency, vintage, strategy |
| **Fee fields** | Skipped (defaults applied) | Skipped (configurable later in settings) | Skipped (configurable later in settings) |
| **Fund type** | Auto: `TRADITIONAL_SEARCH_FUND` | User selects from all types | User selects from all types |
| **Slug** | Auto-generated from name | Auto-generated, editable | Auto-generated, editable |

### Why not show fee structure during onboarding?

Management fee, carried interest, hurdle rate, and catch-up rate have sensible defaults (`2%`, `20%`, `0%`, `0%`) that are already set by the existing `createFund` logic. Showing these during onboarding adds cognitive load without value — the user can configure them immediately after in Fund Settings. This follows the principle: **get them to the dashboard fast, let them configure at their own pace.**

---

## 4. Step-by-Step Flow Detail

### Step 1: Vehicle Type Selection

**Title:** "What are you building?"
**Subtitle:** "Select the type of investment vehicle you're setting up."

Three selection cards:

| Card | Title | Description |
|------|-------|-------------|
| 1 | **Search Fund** | "Raising capital to acquire and operate a single business." |
| 2 | **Micro-PE / Small Fund** | "Managing 1-3 funds with a small team." |
| 3 | **PE Fund** | "Institutional fund management with multiple vehicles." |

Each card maps to an `OrganizationType` enum value:
- Search Fund → `SEARCH_FUND`
- Micro-PE → `MICRO_PE`
- PE Fund → `MID_PE` (or `CONSOLIDATED_PE` if > 10 funds, but this distinction can be changed later in settings)

Clicking a card advances to Step 2.

---

### Step 2: Firm Information (Organization)

**Title:** "About your firm"

#### Search Fund variant:

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| orgName | "Fund name" | Text | Yes | Also used as firm name and fund name |
| orgSlug | — | Auto-generated | — | Shown as preview: "Your URL: `martha-fund.blackgem.ai`" |
| targetSize | "How much are you raising?" | Currency input | Yes | e.g., "$5,000,000" |

The org name is used for everything: Organization.name, Organization.legalName, Fund.name, Fund.slug. The user sees one simple screen.

#### PE / Micro-PE variant:

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| orgName | "Firm name" | Text | Yes | Display name ("Andes Capital Partners") |
| orgSlug | "URL" | Text (auto-generated, editable) | Yes | Preview: "`andes-capital.blackgem.ai`" |
| legalName | "Legal entity name" | Text | PE: Yes, Micro-PE: Optional | Registered legal name |
| entityType | "Entity type" | Select | PE: Yes, Micro-PE: Optional | LLC, LP, C Corp, etc. |
| jurisdiction | "Jurisdiction" | Text | Optional | Country/state of formation |

---

### Step 3: First Fund

**Title:** "Set up your first fund"

#### Search Fund variant:

This step is **skipped** (auto-created from Step 2 data):
- Fund.name = orgName
- Fund.slug = orgSlug
- Fund.type = `TRADITIONAL_SEARCH_FUND`
- Fund.targetSize = from Step 2
- Fund.vintage = current year
- Fund.currency = USD

The user goes directly from Step 2 to Account creation.

#### PE / Micro-PE variant:

| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| fundName | "Fund name" | Text | Yes | e.g., "Andes Capital Fund I" |
| fundSlug | "Fund URL" | Text (auto-generated, editable) | Yes | Preview: "`andes-capital-fund-i.blackgem.ai`" |
| fundType | "Fund type" | Select | Yes | PE Fund, Acquisition Fund, Holding Company, etc. |
| targetSize | "Target fund size" | Currency input | Yes | e.g., "$25,000,000" |
| vintage | "Vintage year" | Year picker or number | Micro-PE: Optional, PE: Yes | e.g., "2026" |
| currency | "Base currency" | Select | Yes (default: USD) | USD, EUR, GBP |
| strategy | "Investment thesis" | Textarea | Optional | Brief description |

---

### Step 4: Your Account

**Title:** "Create your account"
**Subtitle:** "You'll be the administrator of your firm on BlackGem."

| Field | Label | Type | Required | Validation |
|-------|-------|------|----------|------------|
| userName | "Full name" | Text | Yes | Min 1 character |
| userEmail | "Email address" | Email | Yes | Valid email, unique in system |
| userPassword | "Password" | Password | Yes | Min 8 characters |
| confirmPassword | "Confirm password" | Password | Yes | Must match password |

---

### Step 5: Success

**No form.** Shows:
- Green checkmark icon
- "Your account is ready."
- "Redirecting to your dashboard..."
- Auto-login happens in background
- Redirect to `{fund-slug}.blackgem.ai/dashboard`

If auto-login fails (edge case), shows: "Account created successfully." with a link to `/login`.

---

## 5. Technical Architecture

### Data Flow

```
Client (register-wizard.tsx)
    │
    │  Collects all data across steps
    │  Validates per-step with Zod schemas
    │
    ▼
Server Action: registerWithOnboarding(input)
    │
    ├── Rate limit check (5 per email per 5 min)
    ├── Full Zod validation
    ├── Check uniqueness (email, org slug, fund slug)
    ├── Hash password (bcrypt, 10 rounds)
    │
    ├── prisma.$transaction:
    │   ├── Create Organization
    │   ├── Create User (SUPER_ADMIN, linked to org)
    │   ├── Create Fund (linked to org)
    │   └── Create FundMember (PRINCIPAL, full permissions)
    │
    ├── logAudit × 3 (Organization, User, Fund)
    │
    └── Return { success: true, fundSlug }
         │
         ▼
Client: signIn('credentials', { email, password })
    │
    ├── JWT cookie set on .blackgem.ai domain
    │
    └── window.location.href = https://{fundSlug}.blackgem.ai/dashboard
```

### What Gets Created in the Database

For a PE Fund registration with firm "Andes Capital", fund "Andes Fund I", user "maria@andes.com":

```
Organization:
  id: cuid()
  name: "Andes Capital"
  slug: "andes-capital"
  type: MICRO_PE
  onboardingCompleted: true
  country: "USA"

User:
  id: cuid()
  email: "maria@andes.com"
  name: "Maria Rodriguez"
  passwordHash: bcrypt("password123", 10)
  role: SUPER_ADMIN
  organizationId: → Organization.id

Fund:
  id: cuid()
  name: "Andes Fund I"
  slug: "andes-fund-i"
  type: PE_FUND
  status: RAISING
  targetSize: 25000000.00
  vintage: 2026
  currency: USD
  managementFee: 0.0200
  carriedInterest: 0.2000
  organizationId: → Organization.id

FundMember:
  id: cuid()
  fundId: → Fund.id
  userId: → User.id
  role: PRINCIPAL
  permissions: [DEALS, INVESTORS, PORTFOLIO, CAPITAL, REPORTS, SETTINGS, TEAM]
  isActive: true
```

---

## 6. Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Abuse / spam registrations** | Rate limit: 5 registration attempts per email per 5 minutes |
| **Password security** | Minimum 8 characters, bcrypt with 10 rounds (same as existing) |
| **Slug squatting** | Reserved slugs list: www, api, admin, login, register, portal, dashboard, etc. (20 reserved words) |
| **Duplicate accounts** | Email uniqueness enforced at DB level (`@unique` constraint) |
| **Cross-tenant isolation** | Organization boundary validation already enforced in `requireFundAccess()` |
| **SQL injection** | All inputs validated through Zod schemas, Prisma parameterized queries |
| **XSS** | React's built-in escaping, no `dangerouslySetInnerHTML` |
| **Race conditions** | DB unique constraints catch duplicates that pass the initial check |
| **Password exposure** | Password held in React state only during wizard, never persisted, cleared on redirect |

### Not included (future considerations):
- Email verification (user can start using the platform immediately; verification can be added later)
- CAPTCHA (can be added if spam becomes an issue)
- Password strength meter (visual feedback beyond minimum length)
- Terms of Service acceptance checkbox

---

## 7. UX Design

### Visual Consistency

The register page matches the login page exactly:
- Same dark background (`#11141D`)
- Same vertical "BlackGem" brand mark on the left
- Same input styling (dark inputs, blue focus ring)
- Same CTA button style (Heritage Sapphire `#3E5CFF`)
- Same typography (`font-serif` for titles, `font-sans` for body)
- Same footer

### Step Indicator

A horizontal progress indicator at the top of the form:

```
Search Fund:    ● ─── ○ ─── ○
                Type  Fund  Account

PE Fund:        ● ─── ○ ─── ○ ─── ○
                Type  Firm  Fund  Account
```

- Current step: Blue dot (`#3E5CFF`)
- Completed steps: Green dot (`#059669`)
- Upcoming steps: Gray dot (`#334155`)
- Connecting lines: `#334155`

### Slug Preview

When the user types a name, the slug auto-generates and shows a URL preview:

```
Firm name: [Andes Capital Partners    ]

Your URL:  andes-capital-partners.blackgem.ai
           ↑ editable                ↑ fixed
```

The slug is auto-generated but the user can click to edit it. Validation feedback appears inline if the slug contains invalid characters or is reserved.

### Mobile Responsive

- Single column layout on mobile (< 768px)
- Step indicator simplified to "Step 2 of 4" text
- Full-width inputs and buttons
- No horizontal scrolling

### "Already have an account?" Link

At the bottom of the form: "Already have an account? [Sign in](/login)" — matching the muted style of the login page.

### "Back" Navigation

Steps 2+ show a "Back" link (ArrowLeft icon + "Back" text) in `text-slate-400`. Data from previous steps is preserved when navigating back.

---

## 8. What Gets Created

### Entity Relationships

```
Organization (top-level tenant)
├── User (SUPER_ADMIN, the registering person)
│   └── FundMember (PRINCIPAL, full permissions)
│       └── Fund (first fund, status: RAISING)
└── Fund belongs to Organization
    └── User belongs to Organization
```

### Default Values Applied

| Entity | Field | Default |
|--------|-------|---------|
| Organization | country | "USA" |
| Organization | baseCurrency | USD |
| Organization | isActive | true |
| Organization | onboardingCompleted | true |
| User | role | SUPER_ADMIN |
| User | isActive | true |
| Fund | status | RAISING |
| Fund | managementFee | 0.0200 (2%) |
| Fund | carriedInterest | 0.2000 (20%) |
| Fund | hurdleRate | null |
| Fund | catchUpRate | null |
| FundMember | role | PRINCIPAL |
| FundMember | permissions | All 7 modules |
| FundMember | isActive | true |

---

## 9. Infrastructure Impact

**None.** No schema changes, no DNS changes, no SSL changes, no nginx changes. Everything needed was deployed in Phase 1.

The only infra consideration: if registration volume grows significantly, we may need to monitor:
- Database connections (each registration is a single transaction)
- Rate limiting effectiveness

---

## 10. Open Questions for Review

### Q1: Should Search Fund merge steps 2+3+4 into a single page?

The current design gives Search Fund users 3 steps (Type → Fund details → Account). An alternative is to put fund name, target size, email, name, and password all on one page after vehicle selection, making it effectively a **2-step flow** (select type → fill everything → done).

**Pros:** Fastest possible onboarding (~2 minutes).
**Cons:** One long form can feel overwhelming. Three shorter steps with progress indication can feel simpler.

**Recommendation:** Keep 3 steps for Search Fund. The cognitive load per step stays low.

### Q2: Should we require email verification before accessing the dashboard?

Currently the plan allows immediate access after registration (no email verification). This is how most modern SaaS products work (Stripe, Linear, Notion, etc.) — verify later, reduce friction now.

**Recommendation:** No email verification at launch. Add it later if needed.

### Q3: What FundType options should Search Fund users see?

For Search Fund vehicle type, should we auto-set `TRADITIONAL_SEARCH_FUND`, or let the user choose between:
- Traditional Search Fund
- Self-Funded Search
- Accelerator Fund

**Recommendation:** Auto-set `TRADITIONAL_SEARCH_FUND`. If they're self-funded, they can change it in settings later. Fewer choices = faster onboarding.

### Q4: Should we add a "Login with Google" option to registration?

NextAuth supports Google OAuth. Adding it would:
- Reduce friction (no password to set)
- Require configuring Google OAuth credentials
- Still need the wizard for org/fund creation (just skip the password step)

**Recommendation:** Not in this phase. Add OAuth as a separate initiative if there's demand.

### Q5: Should there be a link from the landing page to `/register`?

The current landing page has "Request Access" buttons pointing to `#contact`. Should we:
- Replace them with "Get Started" → `/register`
- Add a separate "Get Started" button in the header
- Keep landing page as-is and share `/register` link directly

**Recommendation:** Add a "Get Started" link in the header nav. Keep "Request Access" for enterprise/custom inquiries.

### Q6: Minimum password requirements?

Current existing users have 6-character minimum. For new self-service accounts (which are SUPER_ADMIN with full access), we propose 8-character minimum.

**Recommendation:** 8 characters minimum for self-service registration.

---

## 11. Scope Boundaries

### In Scope

- Public `/register` route with multi-step wizard
- Organization + Fund + User + FundMember creation in a single transaction
- Auto-login and redirect to fund subdomain
- Search Fund simplified flow vs PE Fund full flow
- Rate limiting and input validation
- Audit logging for all created entities
- Unit tests

### Out of Scope (Future)

- Email verification flow
- Google/OAuth registration
- Team invitation during onboarding (invite colleagues)
- Fund settings configuration during onboarding (fees, dates)
- Organization settings page
- Billing/payment integration
- CAPTCHA
- Terms of Service acceptance
- Analytics/tracking of registration funnel
- Password strength meter
- "Complete your profile" nudges after registration

---

## 12. Implementation Timeline

Estimated: **3-4 days of engineering work**

| Day | Work |
|-----|------|
| 1 | Server action + Zod schemas + unit tests |
| 2 | Wizard UI component (all steps) |
| 3 | Auto-login integration + cross-subdomain redirect + auth config |
| 4 | Polish, edge cases, full test suite, build verification |

No deployment dependencies — ships as a normal push to `main`.

---

*Document version 1.0 — 2026-02-19*
*Author: Engineering (Claude) for review by Marcus*
*Prior art: Multi-Tenant Architecture Doc (2026-02-18), Phase 1 deployment*
