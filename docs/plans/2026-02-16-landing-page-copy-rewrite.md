# Landing Page Copy Rewrite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite landing page copy to embody institutional quality ("Autoridad Serena") instead of claiming it. Remove fabricated metrics, fake testimonials, SaaS marketing patterns. Move pricing to its own page.

**Architecture:** Surgical string replacements in `src/app/page.tsx` (all sections live in one file). One additional file: `src/components/landing/mobile-nav.tsx` for CTA text sync. New file: `src/app/pricing/page.tsx` for standalone pricing page.

**Tech Stack:** Next.js JSX, plain string edits. Build verification via `npm run build`.

---

### Task 1: Hero Section — Subtitle Fix

**Files:**
- Modify: `src/app/page.tsx:108`

Replace subtitle text from:
```
Private equity infrastructure for the next generation of fund managers.
```
to:
```
Private equity infrastructure for emerging fund managers.
```

Commit: `copy: hero subtitle — 'next generation' → 'emerging fund managers'`

---

### Task 2: Problem Section — Headline + Cards

**Files:**
- Modify: `src/app/page.tsx:146-181`

Replace headline from:
```
Fund managers spend more time on spreadsheets than on deals.
```
to:
```
Fund operations are an afterthought until they become the bottleneck.
```

Replace `problems` array with descriptive conditions (no fabricated stats):
- `Spreadsheets` / `still running your back office`
- `Manual processes` / `across every capital operation`
- `Fragmented access` / `for the investors who trust you`

Shrink stat font from `text-3xl md:text-4xl` → `text-xl md:text-2xl` (multi-word stats).

Commit: `copy: problem section — remove fabricated stats, use descriptive conditions`

---

### Task 3: Platform Section — Headline + Remove Screenshot Placeholder

**Files:**
- Modify: `src/app/page.tsx:221-241`

Replace headline: `Everything a fund needs. Nothing it doesn't.` → `One platform. Complete fund operations.`
Replace subtitle: → `Deal pipeline through LP reporting.`
DELETE screenshot placeholder block entirely (lines 234-241).
Update module pills FadeIn delay from 350 → 250.

Commit: `copy: platform section — institutional headline, remove screenshot placeholder`

---

### Task 4: Features Section — Three Description Tweaks

**Files:**
- Modify: `src/app/page.tsx:337-373`

- LP Management: `Professional from day one.` → `Structured from the start.`
- Quarterly Reports: `One-click professional PDFs. Auto-populated, institutional quality.` → `Quarterly reports. Auto-populated, formatted, distributed.`
- LP Portal: `White-label. Documents, statements, reports — 24/7 self-service for LPs.` → `Documents, statements, reports. Self-service access for your LPs.`

Commit: `copy: features — remove 'day one' echo, 'institutional quality' claim, SaaS jargon`

---

### Task 5: Social Proof Section — Delete and Replace

**Files:**
- Modify: `src/app/page.tsx:412-464`

Delete entire metrics row (70% / 0 / <60s / 24/7), divider, and fake testimonial.
Replace with single ethos statement:
```
Built by fund operators. For fund operators.
```
Styled as `font-display text-[22px] md:text-[28px] lg:text-[32px] text-slate-400`, centered.

Commit: `copy: replace fake metrics/testimonial with single ethos statement`

---

### Task 6: Move Pricing to Standalone Page

**Files:**
- Modify: `src/app/page.tsx` — Remove PricingSection from landing, remove `<SectionTransition variant="to-pricing" />`, remove Check import if no longer used
- Create: `src/app/pricing/page.tsx` — Standalone pricing page with clean, institutional tone
- Modify: `src/app/page.tsx` — Update nav links: "Pricing" href from `#pricing` to `/pricing`
- Modify: `src/components/landing/mobile-nav.tsx` — Update Pricing nav link href

Pricing page: Same 3 tiers but with institutional copy:
- Headline: `Transparent pricing.`
- Subtitle: `Flat monthly fee. No AUM basis. No per-seat scaling.`
- No "Most Popular" badge
- Sapphire border on Operator tier is sufficient visual emphasis

Commit: `refactor: move pricing to standalone /pricing page, remove from landing`

---

### Task 7: Final CTA Section — Rewrite

**Files:**
- Modify: `src/app/page.tsx` (FinalCtaSection)
- Modify: `src/app/page.tsx` (HeroSection CTA)
- Modify: `src/components/landing/mobile-nav.tsx` (mobile CTA)

Replace headline: `Your fund deserves better than spreadsheets.` → `Ready when you are.`
DELETE subtitle: `Join the next generation of fund managers.`
DELETE trust signals: `No credit card required · Free onboarding · Setup in minutes`
Change all CTA buttons: `Request a Demo` → `Request Access`

Commit: `copy: final CTA — 'Ready when you are', remove SaaS trust signals, 'Request Access'`

---

### Task 8: Final Verification

```bash
npm run build    # Zero errors
npm run lint     # Clean
git push origin main
```

---

## Change Summary

| Task | Section | Type | Key Change |
|------|---------|------|------------|
| 1 | Hero | Word swap | "next generation" → "emerging" |
| 2 | Problem | Rewrite | Remove fabricated stats, descriptive conditions |
| 3 | Platform | Rewrite + delete | Institutional headline, remove screenshot placeholder |
| 4 | Features | Tweaks | Remove "day one" echo, "institutional quality", SaaS jargon |
| 5 | Social Proof | Replace | Delete fake metrics/testimonial → single ethos line |
| 6 | Pricing | Move to /pricing | Remove from landing, create standalone page |
| 7 | Final CTA | Rewrite | "Ready when you are", remove trust signals, "Request Access" |
| 8 | All | Verify | Build + lint + push |
