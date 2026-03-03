# Stripe Billing & Registration Flow — Implementation Plan

## Context

BlackGem needs a billing layer so that new users register with a 14-day free trial,
then pay via Stripe to continue. Beta users get 60 days via a code (`BETA2026`).

### Decisions (already made)
- **Flow:** Trial-first (Option C) — register freely, 14-day trial, pay before expiry
- **Payment UI:** Stripe Elements (embedded in wizard), NOT Checkout redirect
- **Billing unit:** `Organization` (one subscription per org)
- **Gating:** Hard gate — redirect to billing page when trial/subscription expires
- **Management:** Stripe Customer Portal at `/settings/billing`
- **Existing users:** Grandfather into a trial starting from deployment
- **Scope:** Monthly billing only. No annual, coupons, usage-based, or billing emails in v1.

### Stripe Configuration (test mode)
- Search: `price_1T4oK29Wz2qbSeqlJCDX9Hl3` ($59/mo)
- Operate: `price_1T4oKJ9Wz2qbSeqlQ4hYWUks` ($179/mo)
- Scale: `price_1T4oKd9Wz2qbSeqlJV8kJSbu` ($349/mo)

### Beta Access
- URL: `blackgem.ai/register?type=pe&code=BETA2026`
- 60-day trial, auto-skips payment step
- Same schema fields (`trialEndsAt`, `subscriptionStatus: TRIALING`)
- To end beta: empty `BETA_CODES = {}` in onboarding.ts

---

## Pre-existing Issues (Task 0)

The current `main` has a **Turbopack build panic** related to having dual middleware files
(`middleware.ts` + `src/middleware.ts`). The installed Next.js is 15.5.10 but reports as 16.1.6.
This needs investigation and fix before any feature work.

### Task 0: Fix build
- Investigate Turbopack panic (dual middleware files?)
- Try `--no-turbopack` build to isolate
- Fix or pin Next.js version if needed
- Ensure `npm run build` passes cleanly on main

---

## Group A: Schema & Dependencies (Tasks 1-2)

### Task 1: Prisma Schema — Add billing fields to Organization

**File:** `prisma/schema.prisma`

Add two enums and 5 fields to `Organization`:

```prisma
enum SubscriptionTier {
  SEARCH
  OPERATE
  SCALE
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
}
```

Fields on `Organization` (after `onboardingCompleted`):
```prisma
  // Billing
  subscriptionTier     SubscriptionTier?
  subscriptionStatus   SubscriptionStatus?
  stripeCustomerId     String?    @unique
  stripeSubscriptionId String?    @unique
  trialEndsAt          DateTime?
```

**Migration:** `prisma migrate dev --name add_billing_fields`

**Validation:**
- `prisma migrate status` shows no drift
- `prisma generate` succeeds

### Task 2: Install Stripe + update .env.example

**Packages:**
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

**Add to `.env.example`:**
```
# ============ BILLING (Stripe) ============
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SEARCH=price_...
STRIPE_PRICE_OPERATE=price_...
STRIPE_PRICE_SCALE=price_...
```

---

## Group B: Core Utilities (Tasks 3-5)

### Task 3: Stripe server client

**New file:** `src/lib/stripe.ts`

Lazy-init pattern (same as Resend client in `email.ts`):
```typescript
import Stripe from 'stripe'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' })
  }
  return _stripe
}
```

Also export price ID constants:
```typescript
export const STRIPE_PRICES = {
  SEARCH: process.env.STRIPE_PRICE_SEARCH!,
  OPERATE: process.env.STRIPE_PRICE_OPERATE!,
  SCALE: process.env.STRIPE_PRICE_SCALE!,
} as const
```

### Task 4: Subscription access utility + tests (TDD)

**New file:** `src/lib/shared/subscription-access.ts`
**New file:** `src/lib/shared/__tests__/subscription-access.test.ts`

Pure function (no DB, no Stripe API — just logic):
```typescript
export function checkSubscriptionAccess(org: {
  subscriptionStatus: SubscriptionStatus | null
  trialEndsAt: Date | null
  stripeSubscriptionId: string | null
}): { allowed: boolean; reason?: string; daysRemaining?: number }
```

Logic:
- `ACTIVE` → allowed
- `TRIALING` + `trialEndsAt > now` → allowed, return daysRemaining
- `TRIALING` + `trialEndsAt <= now` → blocked ("Trial expired")
- `PAST_DUE` → allowed with warning (grace period)
- `CANCELED` / `UNPAID` / null → blocked
- No status + no trial → blocked

**Tests (write first):** 9+ cases covering all branches.

### Task 5: Modify onboarding action for trial + beta codes

**Modified file:** `src/lib/actions/onboarding.ts`
**Modified file:** `src/lib/shared/onboarding-schemas.ts`

Changes to schema:
- Add optional `code?: string` field to `onboardingSchema`

Changes to action:
- Add `BETA_CODES` constant: `{ BETA2026: { trialDays: 60, skipPayment: true } }`
- On Organization create, add:
  - `subscriptionStatus: 'TRIALING'`
  - `trialEndsAt: new Date(Date.now() + trialDays * 86400000)` (14 default, 60 for beta)
  - `subscriptionTier: null` (set after payment)
- Return `{ success: true, fundSlug, skipPayment }` so wizard knows whether to show payment step

---

## Group C: API Routes (Tasks 6-8)

### Task 6: Stripe webhook handler

**New file:** `src/app/api/stripe/webhook/route.ts`

POST handler:
1. Read raw body via `req.text()` (NOT `req.json()` — signature verification needs raw bytes)
2. Verify signature with `stripe.webhooks.constructEvent(body, sig, webhookSecret)`
3. Handle events:
   - `customer.subscription.updated` → update Org `subscriptionStatus`, `subscriptionTier`
   - `customer.subscription.deleted` → set `subscriptionStatus: CANCELED`
   - `invoice.payment_failed` → set `subscriptionStatus: PAST_DUE`
   - `invoice.payment_succeeded` → set `subscriptionStatus: ACTIVE`
4. Audit log each event
5. Return 200

**Important:** Must exclude `/api/stripe/webhook` from middleware auth checks.

### Task 7: Create checkout session route

**New file:** `src/app/api/stripe/checkout/route.ts`

POST handler (authenticated):
1. Get session, verify auth
2. Look up Organization, find or create Stripe Customer
3. Create `stripe.checkout.sessions.create()` with:
   - `mode: 'subscription'`
   - `line_items: [{ price: priceId, quantity: 1 }]`
   - `customer: stripeCustomerId`
   - `success_url`, `cancel_url`
   - `subscription_data.trial_end` (if org still in trial)
4. Return `{ clientSecret }` for embedded Elements

### Task 8: Billing portal session route

**New file:** `src/app/api/stripe/portal/route.ts`

POST handler (authenticated):
1. Get session, verify auth + SUPER_ADMIN role
2. Look up Organization's `stripeCustomerId`
3. Create `stripe.billingPortal.sessions.create()`
4. Return `{ url }` — client redirects

---

## Group D: UI Components (Tasks 9-13)

### Task 9: Stripe Elements provider

**New file:** `src/components/billing/stripe-provider.tsx`

Client component wrapping `<Elements>` from `@stripe/react-stripe-js`.
Lazy-loads `loadStripe()` via `@stripe/stripe-js`.

### Task 10: Payment step component

**New file:** `src/components/billing/payment-step.tsx`

Client component rendered inside the wizard on the "Plan" step:
- Tier selection cards (Search/Operate/Scale) with pricing
- Stripe `<PaymentElement />` embedded below
- Submit creates checkout session, confirms payment
- On success → advance to Done step

### Task 11: Integrate payment step into register wizard

**Modified file:** `src/components/auth/register-wizard.tsx`

Changes:
- Read `code` from `searchParams` (`?code=BETA2026`)
- Add `skipPayment` state (set by server action response)
- Update step labels: add "Plan" before "Done" (when `!skipPayment`)
- After `registerWithOnboarding` succeeds:
  - If `skipPayment` → go to Done, auto-login, redirect
  - If not → advance to Plan step, render `<PaymentStep />`
- `<PaymentStep />` wrapped in `<StripeProvider />`

Step flow after changes:
- **Search Fund (no beta):** Type → Fund → Plan → Done (4 steps)
- **Search Fund (beta):** Type → Fund → Done (3 steps, same as today)
- **PE Fund (no beta):** Type → Firm → Fund → Account → Plan → Done (6 steps)
- **PE Fund (beta):** Type → Firm → Fund → Account → Done (5 steps, same as today)

### Task 12: Trial banner component

**New file:** `src/components/billing/trial-banner.tsx`

Thin banner at top of dashboard layout:
- Shows "X days remaining in your trial" with "Upgrade" CTA
- Only renders when `subscriptionStatus === 'TRIALING'`
- Muted styling per brand guidelines

### Task 13: Subscription block modal

**New file:** `src/components/billing/block-modal.tsx`

Full-screen modal/overlay when subscription is expired:
- "Your trial has expired" / "Subscription inactive"
- CTA to billing page
- Cannot be dismissed (hard gate)

---

## Group E: Dashboard Integration (Tasks 14-16)

### Task 14: Billing server action + settings page

**New file:** `src/lib/actions/billing.ts`

Server actions:
- `getSubscriptionStatus()` → returns org billing state for dashboard
- `createCheckoutSession(tier)` → calls Stripe, returns clientSecret
- `createBillingPortalSession()` → calls Stripe, returns URL

**New file or integrate:** `/settings/billing` page (or section in existing settings)

### Task 15: Dashboard layout gating

**Modified file:** `src/app/(dashboard)/layout.tsx`

After existing data fetch, add:
1. Query Organization billing fields
2. Call `checkSubscriptionAccess(org)`
3. If blocked → render `<BlockModal />`
4. If trialing → render `<TrialBanner daysRemaining={N} />`

**Modified file:** `src/middleware.ts` (or equivalent)
- Exclude `/api/stripe/webhook` from auth middleware

### Task 16: Final verification

- `npm run build` passes
- All existing tests pass
- New subscription-access tests pass
- Manual flow: register → trial → payment → dashboard
- Beta flow: register with `?code=BETA2026` → 60-day trial, skip payment

---

## File Impact Summary

### New files (12)
| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe client (lazy-init) |
| `src/lib/shared/subscription-access.ts` | Pure subscription check logic |
| `src/lib/shared/__tests__/subscription-access.test.ts` | Tests for above |
| `src/app/api/stripe/webhook/route.ts` | Webhook handler |
| `src/app/api/stripe/checkout/route.ts` | Checkout session creation |
| `src/app/api/stripe/portal/route.ts` | Billing portal redirect |
| `src/components/billing/stripe-provider.tsx` | Elements provider |
| `src/components/billing/payment-step.tsx` | Wizard payment step |
| `src/components/billing/trial-banner.tsx` | Dashboard trial banner |
| `src/components/billing/block-modal.tsx` | Expired subscription modal |
| `src/lib/actions/billing.ts` | Billing server actions |
| `prisma/migrations/YYYYMMDD_add_billing_fields/migration.sql` | Schema migration |

### Modified files (5)
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add enums + billing fields to Organization |
| `.env.example` | Add Stripe env vars |
| `src/lib/actions/onboarding.ts` | Add trial init + beta codes |
| `src/lib/shared/onboarding-schemas.ts` | Add optional `code` field |
| `src/components/auth/register-wizard.tsx` | Add payment step, beta code handling |
| `src/app/(dashboard)/layout.tsx` | Add subscription gating, banner, block modal |
| `src/middleware.ts` | Exclude Stripe webhook from auth |

### Dependencies to add
- `stripe` (server SDK)
- `@stripe/stripe-js` (client loader)
- `@stripe/react-stripe-js` (React bindings)

---

## Implementation Order

Optimal parallelization:

```
Task 0 ─────────────────────────────── (fix build, if needed)
        │
Task 1 ─┤── Task 2 ──────────────────── (schema + deps, parallel)
        │
Task 3 ─┤── Task 4 ─┤── Task 5 ──────── (utilities, parallel after 1+2)
        │           │
Task 6 ─┤── Task 7 ─┤── Task 8 ──────── (API routes, parallel after 3)
        │           │
Task 9 ─┤── Task 10 ┤── Task 11 ─────── (UI, sequential: 9→10→11)
        │           │
Task 12 ┤── Task 13 ┤── Task 14 ─────── (dashboard UI, parallel after 4)
        │           │
Task 15 ┤── (depends on 12, 13, 14) ─── (integration)
        │
Task 16 ┤── (final verification) ─────── (everything done)
```

Estimated: ~12 new files, ~5 modified files, ~1500 lines of new code.
