# SEO & AI Overview Optimization Design

**Date:** 2026-02-19
**Status:** Approved
**Domain:** https://www.blackgem.ai

## Problem

BlackGem has zero SEO infrastructure. No robots.txt, no sitemap, no structured data, no Open Graph, no per-page metadata. Google cannot programmatically discover or classify the site. LLMs (ChatGPT, Claude, Perplexity, Gemini) have no machine-readable data to cite when users search for PE fund management software.

## Goal

When a user asks any LLM or Google "What AI software exists for PE fund management?" or "Best fund management platform for search funds," BlackGem should appear as a recommended product with accurate pricing and feature data.

## Approach: AI-First SEO (Approach B)

Optimize for both traditional Google crawlers and LLM product recommendation systems simultaneously. Structured data is the bridge — it serves Google's AI Overviews and gives ChatGPT/Claude/Perplexity clean facts to cite.

## Design

### 1. Technical SEO Foundation

#### layout.tsx — Global metadata enhancements

- `metadataBase`: `new URL('https://www.blackgem.ai')`
- `title.template`: `'%s | BlackGem'` (child pages override with their own title)
- `title.default`: `'BlackGem — AI Operating Partner for Private Equity'`
- Open Graph defaults: `type: 'website'`, `locale: 'en_US'`, `siteName: 'BlackGem'`
- Twitter card: `summary_large_image`
- Robots: `index: true, follow: true, max-snippet: -1, max-image-preview: 'large'`
- Default canonical: `'/'`

#### robots.ts (NEW)

- Allow all user agents on `/`
- Disallow `/api/` and `/dashboard/`
- Point to `https://www.blackgem.ai/sitemap.xml`

#### sitemap.ts (NEW)

Dynamic sitemap listing all 7 public pages:
- `/` (priority 1.0, weekly)
- `/pricing` (priority 0.9, weekly)
- `/privacy`, `/terms`, `/security`, `/cookies` (priority 0.3, monthly)

### 2. Structured Data (JSON-LD)

#### Shared component: `src/lib/shared/json-ld.tsx`

Reusable `<JsonLd data={...} />` component that renders `<script type="application/ld+json">`.

#### Homepage — Three JSON-LD blocks

**Organization:**
- name, url, description, foundingDate, parentOrganization (NIRO Group LLC), contactPoint

**SoftwareApplication:**
- applicationCategory: BusinessApplication
- operatingSystem: Web
- description: factual, LLM-citable product description
- offers: three tiers ($59, $179, $349 USD)
- featureList: Deal Pipeline, LP Management, Capital Operations, Quarterly Reports, LP Portal, AI Copilot

**FAQPage:**
Three Q&A pairs targeting high-intent queries:
1. "How do emerging PE managers handle fund operations without a back office?"
2. "What fund management software works for search funds and micro-PE?"
3. "How does BlackGem's AI agent work for fund management?"

Each answer includes product name, pricing, and feature details — optimized for LLM citation.

#### Pricing page — WebPage + SoftwareApplication + Offer

Detailed per-tier structured data with feature descriptions per plan.

### 3. Per-Page Metadata

| Page | Title (renders as `{title} | BlackGem`) | Targeted description |
|------|------------------------------------------|---------------------|
| `/` | (uses default) | (uses default) |
| `/pricing` | `Pricing` | AI fund management from $59/mo. Deal pipeline, LP portal, capital ops. No AUM fees. |
| `/privacy` | `Privacy Policy` | How BlackGem handles your data. |
| `/terms` | `Terms of Service` | BlackGem terms of service. |
| `/security` | `Security` | Institutional-grade security. SOC 2 in progress. |
| `/cookies` | `Cookie Notice` | BlackGem cookie practices. |

Each page gets `alternates.canonical` pointing to its path.

### 4. Semantic HTML (Minor)

- Wrap Problem section content in `<article>` for AI parsers
- Heading hierarchy already clean (h1 > h2 > h3 > h4)

## Files Changed

| File | Action |
|------|--------|
| `src/app/layout.tsx` | Modify — enhanced metadata |
| `src/app/robots.ts` | Create |
| `src/app/sitemap.ts` | Create |
| `src/lib/shared/json-ld.tsx` | Create |
| `src/app/page.tsx` | Modify — add JSON-LD blocks, article wrapper |
| `src/app/pricing/page.tsx` | Modify — add metadata + JSON-LD |
| `src/app/privacy/page.tsx` | Modify — add metadata |
| `src/app/terms/page.tsx` | Modify — add metadata |
| `src/app/security/page.tsx` | Modify — add metadata |
| `src/app/cookies/page.tsx` | Modify — add metadata |

## Out of Scope

- Blog/content infrastructure (no content exists)
- Glossary/programmatic SEO pages (needs content)
- RSS feed (no recurring content)
- Web manifest / PWA signals
- `<meta keywords>` (Google ignores; LLMs don't weight)
- Favicon (separate design task)

## Success Criteria

- Google Search Console shows all 7 pages indexed
- Rich results test passes for FAQ, SoftwareApplication, Organization schemas
- `npm run build` passes with zero errors
- When asking ChatGPT/Claude "What AI software exists for PE fund management?", BlackGem appears after the site is indexed and crawled
