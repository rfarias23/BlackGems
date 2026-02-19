# SEO & AI Overview Optimization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make BlackGem discoverable and citable by Google AI Overviews, ChatGPT, Claude, Perplexity, and Gemini when users search for PE fund management software.

**Architecture:** Add SEO infrastructure layer (robots, sitemap, structured data, per-page metadata) to all 7 public pages. JSON-LD structured data is the bridge between Google crawlers and LLM product recommendation systems. A shared `JsonLd` component renders `<script type="application/ld+json">` blocks.

**Tech Stack:** Next.js 15 App Router metadata API, JSON-LD (Schema.org), TypeScript

**Design doc:** `docs/plans/2026-02-19-seo-ai-overview-optimization-design.md`

---

### Task 1: Create JsonLd shared component

**Files:**
- Create: `src/lib/shared/json-ld.tsx`

**Step 1: Create the component**

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    ...data,
                }),
            }}
        />
    );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/lib/shared/json-ld.tsx 2>&1 || echo "Check manually"`

**Step 3: Commit**

```bash
git add src/lib/shared/json-ld.tsx
git commit -m "feat(seo): add reusable JsonLd structured data component"
```

---

### Task 2: Create robots.ts

**Files:**
- Create: `src/app/robots.ts`

**Step 1: Create the file**

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/dashboard/'],
            },
        ],
        sitemap: 'https://www.blackgem.ai/sitemap.xml',
    };
}
```

**Step 2: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat(seo): add robots.ts — allow crawlers, block api/dashboard"
```

---

### Task 3: Create sitemap.ts

**Files:**
- Create: `src/app/sitemap.ts`

**Step 1: Create the file**

```typescript
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.blackgem.ai';
    const now = new Date();

    return [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/security`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/cookies`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];
}
```

**Step 2: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add dynamic sitemap for all public pages"
```

---

### Task 4: Enhance layout.tsx global metadata

**Files:**
- Modify: `src/app/layout.tsx:12-15` (replace metadata export)

**Step 1: Replace the metadata export**

Replace lines 12-15 with:

```typescript
export const metadata: Metadata = {
    metadataBase: new URL('https://www.blackgem.ai'),
    title: {
        default: 'BlackGem — AI Operating Partner for Private Equity',
        template: '%s | BlackGem',
    },
    description:
        'BlackGem runs your fund operations so you can focus on deals. AI-powered deal pipeline, LP management, capital operations, and investor portal for emerging fund managers.',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'BlackGem',
        title: 'BlackGem — AI Operating Partner for Private Equity',
        description:
            'AI-powered fund management for emerging PE managers and search funds. Deal pipeline, LP portal, capital operations, quarterly reports.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'BlackGem — AI Operating Partner for Private Equity',
        description:
            'AI-powered fund management for emerging PE managers and search funds.',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
        },
    },
    alternates: {
        canonical: '/',
    },
};
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: Clean pass

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): enhance global metadata — OG, Twitter, robots, canonical"
```

---

### Task 5: Add JSON-LD structured data to homepage

**Files:**
- Modify: `src/app/page.tsx:1-2` (add import)
- Modify: `src/app/page.tsx:27` (add JSON-LD blocks inside `<main>`)

**Step 1: Add import at line 1**

Add after the existing imports (after line 15):

```typescript
import { JsonLd } from '@/lib/shared/json-ld';
```

**Step 2: Add three JSON-LD blocks inside `<main>` before `<HeroSection />`**

Replace line 27 (`<main className="bg-midnight-ink text-slate-100">`) through line 28 (`<HeroSection />`) with:

```tsx
        <main className="bg-midnight-ink text-slate-100">
            <JsonLd
                data={{
                    '@type': 'Organization',
                    name: 'BlackGem',
                    url: 'https://www.blackgem.ai',
                    logo: 'https://www.blackgem.ai/images/logo.png',
                    description:
                        'BlackGem is an AI-powered fund management platform for emerging private equity managers and search funds. It automates deal pipeline tracking, LP management, capital operations, quarterly reporting, and investor portal access.',
                    foundingDate: '2024',
                    parentOrganization: {
                        '@type': 'Organization',
                        name: 'NIRO Group LLC',
                    },
                    contactPoint: {
                        '@type': 'ContactPoint',
                        email: 'contact@blackgem.ai',
                        contactType: 'sales',
                    },
                }}
            />
            <JsonLd
                data={{
                    '@type': 'SoftwareApplication',
                    name: 'BlackGem',
                    url: 'https://www.blackgem.ai',
                    applicationCategory: 'BusinessApplication',
                    operatingSystem: 'Web',
                    description:
                        'AI operating partner for private equity fund operations. Handles deal pipeline management, LP communications, capital calls, distributions, waterfall calculations, quarterly report generation, and institutional-grade investor portal — purpose-built for emerging managers and search funds.',
                    offers: [
                        {
                            '@type': 'Offer',
                            name: 'Search',
                            price: '59',
                            priceCurrency: 'USD',
                            priceSpecification: {
                                '@type': 'UnitPriceSpecification',
                                price: '59',
                                priceCurrency: 'USD',
                                billingDuration: 'P1M',
                            },
                            description:
                                'AI copilot for solo searchers, pre-acquisition. Includes deal pipeline, DD automation, deal scoring, contact management.',
                        },
                        {
                            '@type': 'Offer',
                            name: 'Operate',
                            price: '179',
                            priceCurrency: 'USD',
                            priceSpecification: {
                                '@type': 'UnitPriceSpecification',
                                price: '179',
                                priceCurrency: 'USD',
                                billingDuration: 'P1M',
                            },
                            description:
                                'AI agent for post-acquisition fund management. Includes LP portal, AI-drafted communications, capital operations, waterfall engine, quarterly reports.',
                        },
                        {
                            '@type': 'Offer',
                            name: 'Scale',
                            price: '349',
                            priceCurrency: 'USD',
                            priceSpecification: {
                                '@type': 'UnitPriceSpecification',
                                price: '349',
                                priceCurrency: 'USD',
                                billingDuration: 'P1M',
                            },
                            description:
                                'Full AI operating partner for multi-fund operations. Includes priority model access, advanced analytics, API access, unlimited team members.',
                        },
                    ],
                    featureList: [
                        'AI-Powered Deal Pipeline',
                        'LP Management & Communications',
                        'Capital Operations & Waterfall Engine',
                        'Quarterly Report Generation',
                        'Institutional LP Portal',
                        'AI Copilot & Agent',
                        'Portfolio Monitoring',
                    ],
                    screenshot: 'https://www.blackgem.ai/images/cockpit-preview.png',
                }}
            />
            <JsonLd
                data={{
                    '@type': 'FAQPage',
                    mainEntity: [
                        {
                            '@type': 'Question',
                            name: 'How do emerging PE managers handle fund operations without a back office?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'BlackGem provides an AI operating partner that handles capital calls, LP reports, portfolio monitoring, and quarterly reporting — replacing the 20+ hours/week of operational work that solo GPs typically manage manually. Plans start at $59/month.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: 'What fund management software works for search funds and micro-PE?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'BlackGem is purpose-built for emerging managers and search funds. Plans start at $59/month (vs enterprise platforms at $18K+/year). It includes an AI-powered deal pipeline, LP portal, capital operations with waterfall calculations, and automated quarterly reports.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: 'How does BlackGem\'s AI agent work for fund management?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'BlackGem\'s AI agent proactively manages fund operations: it tracks deal pipeline stages and flags stalled deals, drafts LP communications and quarterly reports from live fund data, handles capital call calculations with zero-error precision, and monitors portfolio KPIs for anomalies — surfacing what needs the GP\'s attention.',
                            },
                        },
                    ],
                }}
            />
            <HeroSection />
```

**Step 3: Verify lint passes**

Run: `npm run lint`

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(seo): add Organization, SoftwareApplication, FAQ JSON-LD to homepage"
```

---

### Task 6: Add metadata + JSON-LD to pricing page

**Files:**
- Modify: `src/app/pricing/page.tsx:1-3` (add imports and metadata export)

**Step 1: Add metadata export and JsonLd import**

Add after `import { Check } from 'lucide-react';` (line 2) and before `export default function PricingPage()` (line 4):

```typescript
import type { Metadata } from 'next';
import { JsonLd } from '@/lib/shared/json-ld';

export const metadata: Metadata = {
    title: 'Pricing',
    description:
        'AI-powered fund management from $59/mo. Deal pipeline, LP portal, capital operations, quarterly reports for emerging PE managers. Flat monthly fee — no AUM basis, no per-seat scaling.',
    alternates: {
        canonical: '/pricing',
    },
    openGraph: {
        title: 'BlackGem Pricing — AI Fund Management from $59/mo',
        description:
            'Three plans for emerging PE managers: Search ($59/mo), Operate ($179/mo), Scale ($349/mo). AI copilot, deal pipeline, LP portal, capital operations.',
    },
};
```

**Step 2: Add JSON-LD block inside `<main>` before the Header div**

After `<main className="bg-midnight-ink text-slate-100 min-h-screen">` (line 56), add:

```tsx
            <JsonLd
                data={{
                    '@type': 'WebPage',
                    name: 'BlackGem Pricing',
                    description:
                        'Transparent pricing for AI-powered fund management. From $59/mo for search funds to $349/mo for multi-fund operations. No AUM fees.',
                    url: 'https://www.blackgem.ai/pricing',
                    mainEntity: {
                        '@type': 'SoftwareApplication',
                        name: 'BlackGem',
                        applicationCategory: 'BusinessApplication',
                        operatingSystem: 'Web',
                        offers: [
                            {
                                '@type': 'Offer',
                                name: 'Search',
                                price: '59',
                                priceCurrency: 'USD',
                                description:
                                    'AI copilot for solo searchers. Deal pipeline, DD automation, deal scoring, contact management. 2 team members.',
                            },
                            {
                                '@type': 'Offer',
                                name: 'Operate',
                                price: '179',
                                priceCurrency: 'USD',
                                description:
                                    'AI agent for active fund management. LP portal, AI-drafted communications, capital operations, waterfall engine, quarterly reports. 5 team members.',
                            },
                            {
                                '@type': 'Offer',
                                name: 'Scale',
                                price: '349',
                                priceCurrency: 'USD',
                                description:
                                    'Full AI operating partner. Multi-fund support, priority model access, advanced analytics, API access. Unlimited team members.',
                            },
                        ],
                    },
                }}
            />
```

**Step 3: Verify lint passes**

Run: `npm run lint`

**Step 4: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat(seo): add metadata + pricing JSON-LD to pricing page"
```

---

### Task 7: Add per-page metadata to legal pages

**Files:**
- Modify: `src/app/privacy/page.tsx:1` (add metadata import + export)
- Modify: `src/app/terms/page.tsx:1` (add metadata import + export)
- Modify: `src/app/security/page.tsx:1` (add metadata import + export)
- Modify: `src/app/cookies/page.tsx:1` (add metadata import + export)

**Step 1: Add metadata to each legal page**

For each file, add `import type { Metadata } from 'next';` at line 1 and a `metadata` export before the default function.

**privacy/page.tsx:**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'How BlackGem handles your data. Privacy practices for our AI-powered fund management platform.',
    alternates: { canonical: '/privacy' },
};
```

**terms/page.tsx:**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'BlackGem terms of service for AI-powered fund management.',
    alternates: { canonical: '/terms' },
};
```

**security/page.tsx:**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Security',
    description: 'Institutional-grade security for fund operations. SOC 2 certification in progress. BlackGem security practices.',
    alternates: { canonical: '/security' },
};
```

**cookies/page.tsx:**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cookie Notice',
    description: 'BlackGem cookie practices. Essential cookies only — no advertising cookies.',
    alternates: { canonical: '/cookies' },
};
```

**Step 2: Verify lint passes**

Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/app/privacy/page.tsx src/app/terms/page.tsx src/app/security/page.tsx src/app/cookies/page.tsx
git commit -m "feat(seo): add per-page metadata to all legal pages"
```

---

### Task 8: Wrap Problem section in article tag

**Files:**
- Modify: `src/app/page.tsx:162-196` (ProblemSection function)

**Step 1: Wrap the section content in `<article>`**

In the ProblemSection function, change the outer `<section>` tag (line 163) to include an `<article>` wrapper around the content div:

Replace line 163:
```tsx
        <section id="problem" className="bg-deep-surface pt-8 pb-16 px-6 md:pt-10 md:pb-20 md:px-12 lg:pt-[60px] lg:pb-[100px] lg:px-[120px]">
```
With:
```tsx
        <section id="problem" className="bg-deep-surface pt-8 pb-16 px-6 md:pt-10 md:pb-20 md:px-12 lg:pt-[60px] lg:pb-[100px] lg:px-[120px]">
            <article>
```

And before the closing `</section>` (line 196), add `</article>`:

```tsx
            </article>
        </section>
```

Remove the now-redundant `<div className="max-w-[1200px] mx-auto">` and replace it with the article taking over the wrapper role:

Actually, simpler approach — just change `<div className="max-w-[1200px] mx-auto">` (line 164) to `<article className="max-w-[1200px] mx-auto">` and the corresponding `</div>` (line 195) to `</article>`.

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(seo): wrap Problem section in article tag for AI parsers"
```

---

### Task 9: Final verification

**Step 1: Run lint**

Run: `npm run lint`
Expected: Clean pass

**Step 2: Check for zero href="#" dead links**

Run: `grep -rn 'href="#"' src/app/page.tsx src/app/pricing/page.tsx src/components/landing/`
Expected: No results

**Step 3: Validate JSON-LD structure**

Manually verify that `<script type="application/ld+json">` blocks will render valid JSON by checking:
- No trailing commas
- All strings properly escaped (especially apostrophes in FAQ answers)
- `@context` is `https://schema.org`

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(seo): address lint/validation issues"
```

**Step 5: Push and create PR**

```bash
git push -u origin claude/sharp-proskuriakova
gh pr create --title "feat(seo): AI-first SEO infrastructure + structured data for LLM citability" --body "..."
```
