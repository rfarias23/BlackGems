# Landing Page Copy Rewrite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite landing page copy to embody institutional quality ("Autoridad Serena") instead of claiming it. Remove fabricated metrics, fake testimonials, SaaS marketing patterns.

**Architecture:** Surgical string replacements in `src/app/page.tsx` (all sections live in one file). One additional file: `src/components/landing/mobile-nav.tsx` for CTA text sync. No new components, no layout changes, no structural refactoring.

**Tech Stack:** Next.js JSX, plain string edits. Build verification via `npm run build`.

---

### Task 1: Hero Section — Subtitle Fix

**Files:**
- Modify: `src/app/page.tsx:108`

**Step 1: Replace subtitle text**

Change line 108 from:
```
Private equity infrastructure for the next generation of fund managers.
```
to:
```
Private equity infrastructure for emerging fund managers.
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, zero errors

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "copy: hero subtitle — 'next generation' → 'emerging fund managers'"
```

---

### Task 2: Problem Section — Headline + Cards

**Files:**
- Modify: `src/app/page.tsx:146-165` (problems array) and `177-181` (headline)

**Step 1: Replace headline**

Change lines 177-181 from:
```jsx
Fund managers spend more time
<br className="hidden md:block" />
{' '}on spreadsheets than on deals.
```
to:
```jsx
Fund operations are an afterthought
<br className="hidden md:block" />
{' '}until they become the bottleneck.
```

**Step 2: Replace problems array**

Change the `problems` const (lines 146-165) to:
```typescript
const problems = [
    {
        stat: 'Spreadsheets',
        label: 'still running your back office',
        description:
            'Capital accounts in Excel. LP updates by email. Reports compiled manually.',
    },
    {
        stat: 'Manual processes',
        label: 'across every capital operation',
        description:
            'Pro-rata allocations, waterfall calculations, and distribution schedules built on formulas.',
    },
    {
        stat: 'Fragmented access',
        label: 'for the investors who trust you',
        description:
            'No single source of truth. Every LP question requires a manual response.',
    },
];
```

**Note:** The `stat` values are now longer strings. The card layout uses `font-mono text-3xl md:text-4xl` which may need to shrink for multi-word stats. Change the stat styling from:
```
font-mono text-3xl md:text-4xl font-medium text-heritage-sapphire
```
to:
```
font-mono text-xl md:text-2xl font-medium text-heritage-sapphire
```

This ensures "Spreadsheets", "Manual processes", and "Fragmented access" fit cleanly in the cards.

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "copy: problem section — remove fabricated stats, use descriptive conditions"
```

---

### Task 3: Platform Section — Headline + Remove Screenshot Placeholder

**Files:**
- Modify: `src/app/page.tsx:221-241`

**Step 1: Replace headline and subtitle**

Change lines 221-231 from:
```jsx
<h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
    Everything a fund needs.
    <br />
    Nothing it doesn&apos;t.
</h2>
...
<p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-8 md:mb-12">
    One platform for deals, investors, portfolio, capital, and reporting.
</p>
```
to:
```jsx
<h2 className="font-display text-[28px] md:text-[34px] lg:text-[40px] leading-[1.15] font-normal text-slate-100 text-center max-w-[800px] mx-auto mb-3 md:mb-4">
    One platform.
    <br />
    Complete fund operations.
</h2>
...
<p className="text-base md:text-lg text-slate-400 text-center max-w-[700px] mx-auto mb-8 md:mb-12">
    Deal pipeline through LP reporting.
</p>
```

**Step 2: Delete the screenshot placeholder block**

Delete lines 234-241 entirely (the `{/* Screenshot placeholder */}` FadeIn block containing the gray box with "Platform Screenshot" text).

Also update the FadeIn delay on the module pills from `delay={350}` to `delay={250}` since the screenshot FadeIn at delay 250 is gone.

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "copy: platform section — institutional headline, remove screenshot placeholder"
```

---

### Task 4: Features Section — Three Description Tweaks

**Files:**
- Modify: `src/app/page.tsx:337-373` (features array)

**Step 1: Update three feature descriptions**

In the `features` array, change only these three descriptions:

LP Management (currently line 348):
```
'Commitments, communications, portal access. Professional from day one.'
```
→
```
'Commitments, communications, portal access. Structured from the start.'
```

Quarterly Reports (currently line 366):
```
'One-click professional PDFs. Auto-populated, institutional quality.'
```
→
```
'Quarterly reports. Auto-populated, formatted, distributed.'
```

LP Portal (currently line 372):
```
'White-label. Documents, statements, reports — 24/7 self-service for LPs.'
```
→
```
'Documents, statements, reports. Self-service access for your LPs.'
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "copy: features — remove 'day one' echo, 'institutional quality' claim, SaaS jargon"
```

---

### Task 5: Social Proof Section — Delete and Replace

**Files:**
- Modify: `src/app/page.tsx:412-464` (entire SocialProofSection function)

**Step 1: Replace entire SocialProofSection function**

Replace the full function (lines 412-464) with:

```tsx
/* ----- SECTION 6: ETHOS STATEMENT ----- */
function SocialProofSection() {
    return (
        <section className="bg-midnight-ink py-16 px-6 md:py-20 md:px-12 lg:py-[100px] lg:px-[120px] relative overflow-hidden">
            {/* Subtle top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent" aria-hidden="true" />

            <div className="max-w-[1200px] mx-auto">
                <FadeIn>
                    <p className="font-display text-[22px] md:text-[28px] lg:text-[32px] text-slate-400 text-center leading-relaxed">
                        Built by fund operators. For fund operators.
                    </p>
                </FadeIn>
            </div>
        </section>
    );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "copy: replace fake metrics/testimonial with single ethos statement"
```

---

### Task 6: Pricing Section — Headline + Remove Badge

**Files:**
- Modify: `src/app/page.tsx:519-527` (headline/subtitle) and `541-546` (badge)

**Step 1: Replace headline and subtitle**

Change headline (line 520):
```
Right-sized for every stage.
```
→
```
Transparent pricing.
```

Change subtitle (line 526):
```
No AUM-based pricing. No per-seat fees. Predictable.
```
→
```
Flat monthly fee. No AUM basis. No per-seat scaling.
```

**Step 2: Delete "Most Popular" badge**

Delete lines 541-546 (the `{/* Badge */}` block):
```jsx
{/* Badge */}
{tier.highlighted && (
    <span className="inline-flex self-start px-3 py-1 bg-heritage-sapphire text-white text-[11px] font-semibold rounded-full mb-4">
        Most Popular
    </span>
)}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "copy: pricing — declarative headline, remove 'Most Popular' badge"
```

---

### Task 7: Final CTA Section — Rewrite

**Files:**
- Modify: `src/app/page.tsx:592-631` (FinalCtaSection)
- Modify: `src/components/landing/mobile-nav.tsx:69-75` (CTA button text)

**Step 1: Replace FinalCtaSection content**

Replace the entire section content (lines 600-627) with:

```tsx
<FadeIn>
    <h2 className="font-display text-[28px] md:text-[36px] lg:text-[44px] leading-[1.15] font-normal text-white mb-6 md:mb-8">
        Ready when you are.
    </h2>
</FadeIn>

<FadeIn delay={200}>
    <SmoothScrollLink
        href="#contact"
        className="inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4 bg-heritage-sapphire text-white text-sm md:text-[15px] font-semibold rounded-md hover:bg-[#3350E0] transition-all hover:shadow-[0_0_32px_rgba(62,92,255,0.3)]"
    >
        Request Access
    </SmoothScrollLink>
</FadeIn>
```

This removes:
- "Your fund deserves better than spreadsheets" headline
- "Join the next generation of fund managers" subtitle
- "No credit card required · Free onboarding · Setup in minutes" trust signals

**Step 2: Update hero CTA button text to match**

In HeroSection (line 117), change:
```
Request a Demo
```
→
```
Request Access
```

**Step 3: Update mobile nav CTA text**

In `src/components/landing/mobile-nav.tsx` line 74, change:
```
Request a Demo
```
→
```
Request Access
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/landing/mobile-nav.tsx
git commit -m "copy: final CTA — 'Ready when you are', remove SaaS trust signals, 'Request Access'"
```

---

### Task 8: Final Verification

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build, zero errors

**Step 2: Lint check**

Run: `npm run lint`
Expected: Clean

**Step 3: Push**

```bash
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
| 6 | Pricing | Tweaks | Declarative headline, remove "Most Popular" badge |
| 7 | Final CTA | Rewrite | "Ready when you are", remove trust signals, "Request Access" |
| 8 | All | Verify | Build + lint + push |
