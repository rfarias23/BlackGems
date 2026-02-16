# Landing Page Copy Audit — "Stop Telling, Start Being"

> **Date:** 2026-02-16
> **Approach:** Surgical copy rewrite (Approach A). Keep existing layout, rewrite words.
> **Principle:** Loro Piana, not Zara. Embody institutional quality; never claim it.
> **Key user directive:** Show only the Cockpit and Library screenshots. No other product imagery needed.

---

## Guiding Principle

The brand voice is "Autoridad Serena" — speak like a trusted partner, not a startup selling software. Every word must pass the Loro Piana test: would an institutional firm say this? If the answer is "only a SaaS marketing page would," cut it.

**Rules for this rewrite:**
1. No fabricated statistics
2. No unattributed testimonials
3. No borrowed prestige (name-dropping firms)
4. No defensive positioning ("no X, no Y")
5. No SaaS trust signals ("free onboarding", "no credit card")
6. No repeated slogans
7. Show less, not more

---

## Section-by-Section Changes

### Section 1: Hero
**Status:** Pass (minor tweak)

| Element | Current | New |
|---------|---------|-----|
| Subtitle | "Private equity infrastructure for the next generation of fund managers." | "Private equity infrastructure for emerging fund managers." |

Everything else stays. The headline "Institutional excellence from day one." is correct.

---

### Section 2: The Problem
**Status:** Medium rewrite

| Element | Current | New |
|---------|---------|-----|
| Headline | "Fund managers spend more time on spreadsheets than on deals." | "Fund operations are an afterthought until they become the bottleneck." |
| Card 1 stat | "8-10 hrs" | "Spreadsheets" |
| Card 1 label | "per week on admin" | "still running your back office" |
| Card 1 desc | "Hours spent updating spreadsheets, sending LP emails, compiling reports." | "Capital accounts in Excel. LP updates by email. Reports compiled manually." |
| Card 2 stat | "Manual" | "Manual processes" |
| Card 2 label | "capital calculations" | "across every capital operation" |
| Card 2 desc | "Error-prone Excel formulas for capital accounts, pro-rata, and waterfalls." | "Pro-rata allocations, waterfall calculations, and distribution schedules built on formulas." |
| Card 3 stat | "Zero" | "Fragmented access" |
| Card 3 label | "LP visibility" | "for the investors who trust you" |
| Card 3 desc | "Investors have no self-service access. Every question requires an email." | "No single source of truth. Every LP question requires a manual response." |

**Rationale:** Replace fabricated statistics with descriptions of the actual situation. State problems as conditions, not accusations.

---

### Section 3: The Platform
**Status:** Medium rewrite + remove screenshot placeholder

| Element | Current | New |
|---------|---------|-----|
| Headline | "Everything a fund needs. Nothing it doesn't." | "One platform. Complete fund operations." |
| Subtitle | "One platform for deals, investors, portfolio, capital, and reporting." | "Deal pipeline through LP reporting." |
| Screenshot placeholder | `<div>Platform Screenshot</div>` (240-520px gray box) | **DELETE entirely** |

The real product screenshots appear in Section 4 (Dual Interface). No placeholder needed.

---

### Section 4: Dual Interface
**Status:** Pass. No changes.

This is the strongest section. The Cockpit/Library split with real screenshots embodies institutional quality perfectly.

---

### Section 5: Capabilities
**Status:** Minor copy tweaks

| Feature | Current description | New description |
|---------|-------------------|-----------------|
| LP Management | "Commitments, communications, portal access. Professional from day one." | "Commitments, communications, portal access. Structured from the start." |
| Quarterly Reports | "One-click professional PDFs. Auto-populated, institutional quality." | "Quarterly reports. Auto-populated, formatted, distributed." |
| LP Portal | "White-label. Documents, statements, reports — 24/7 self-service for LPs." | "Documents, statements, reports. Self-service access for your LPs." |

**Rationale:** Remove "professional from day one" (repeats hero slogan), "one-click" (SaaS marketing), "institutional quality" (telling not being), "white-label" (technical jargon for a marketing page), "24/7" (every web app is 24/7).

---

### Section 6: Social Proof / Metrics
**Status:** Delete and replace

**DELETE entirely:**
- All 4 metric cards (70% / 0 / <60s / 24/7)
- The testimonial quote and attribution

**REPLACE with:** A single centered statement:

```
Built by fund operators. For fund operators.
```

Styled: `font-display`, medium size, `text-slate-400`, centered. Minimal. One line.

The section becomes a quiet breathing space between Features and Pricing — like a palate cleanser. No metrics, no quotes, no borrowed authority.

**Rationale:** Every metric was fabricated or trivial. The testimonial was the most egregious "Zara" moment on the entire page. Real social proof (fund logos, named testimonials) can be added later when they exist. Until then, silence is better than fiction.

---

### Section 7: Pricing
**Status:** Medium tweaks

| Element | Current | New |
|---------|---------|-----|
| Headline | "Right-sized for every stage." | "Transparent pricing." |
| Subtitle | "No AUM-based pricing. No per-seat fees. Predictable." | "Flat monthly fee. No AUM basis. No per-seat scaling." |
| "Most Popular" badge | Present on Operator tier | **DELETE** |

The highlighted sapphire border on the Operator card already provides visual emphasis. The badge is a SaaS conversion trick that undermines institutional tone.

---

### Section 8: Final CTA
**Status:** Significant rewrite

| Element | Current | New |
|---------|---------|-----|
| Headline | "Your fund deserves better than spreadsheets." | "Ready when you are." |
| Subtitle | "Join the next generation of fund managers." | **DELETE** |
| CTA button | "Request a Demo" | "Request Access" |
| Trust signals | "No credit card required · Free onboarding · Setup in minutes" | **DELETE entirely** |

**Rationale:** "Deserves better" is emotional SaaS language. "Join the next generation" implies a movement. Trust signals are for skeptical consumers, not fund managers allocating capital. "Request Access" shifts from "let us sell to you" to "apply to use this" — subtle exclusivity.

---

### Section 9: Footer
**Status:** Pass. No changes needed.

---

## Summary of Changes

| Section | Action | Impact |
|---------|--------|--------|
| Hero | Subtitle word swap | Low |
| Problem | Rewrite headline + all 3 cards | Medium |
| Platform | Rewrite headline/subtitle, delete screenshot placeholder | Medium |
| Dual Interface | No changes | — |
| Features | 3 description tweaks | Low |
| Social Proof | Delete metrics + testimonial, replace with single statement | High |
| Pricing | Rewrite headline/subtitle, delete badge | Medium |
| Final CTA | Rewrite headline, delete subtitle + trust signals, change CTA text | High |
| Footer | No changes | — |

**Files to modify:**
- `src/app/page.tsx` (all sections)
- `src/components/landing/mobile-nav.tsx` (if CTA text appears there)

**Estimated effort:** 1-2 hours of careful copy editing.
