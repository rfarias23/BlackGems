# BlackGem

**Fund Management Platform for Search Funds & Micro-PE**

> *Institutional Excellence from Day One.*

---

## What is BlackGem?

BlackGem is the operating system for search funds and micro-PE funds. It consolidates deal pipeline, investor relations, portfolio monitoring, capital operations, and reporting into one integrated platform, making a $5M fund look as professional as a $500M fund.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BLACKGEM                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐│
│   │    DEALS     │   │  INVESTORS   │   │  PORTFOLIO   │   │   CAPITAL    ││
│   │   Pipeline   │──▶│   & LPs      │──▶│   Companies  │──▶│  Operations  ││
│   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘│
│          │                  │                  │                  │         │
│          └──────────────────┴──────────────────┴──────────────────┘         │
│                                      │                                       │
│                             ┌────────┴────────┐                             │
│                             ▼                 ▼                              │
│                    ┌──────────────┐   ┌──────────────┐                      │
│                    │  REPORTING   │   │  LP PORTAL   │                      │
│                    │  (Cockpit)   │   │  (Library)   │                      │
│                    └──────────────┘   └──────────────┘                      │
│                       Dark Mode          Light Mode                          │
│                       Managers            Investors                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Documentation Architecture

This project has 12 documents organized in three layers. Understanding this architecture is critical before diving in.

### Layer 1: Strategy (WHY we build)

| # | Document | Purpose | Source of Truth For |
|---|----------|---------|---------------------|
| 00 | [Product Strategy](docs/00_Product_Strategy.md) | Vision, personas, user journeys, MVP | **Users & their needs** |
| 10 | [Lean Canvas](docs/10_Lean_Canvas.md) | Business model, pricing, go-to-market | **Business viability** |
| 11 | [Brand System](docs/11_Brand_System.md) | Visual identity, voice, UX principles | **How it looks & feels** |

### Layer 2: Architecture (WHAT we build)

| # | Document | Purpose | Source of Truth For |
|---|----------|---------|---------------------|
| 01 | [PRD Overview](docs/01_PRD_Overview.md) | Tech stack, architecture, project structure | **Technical decisions** |
| 02 | [Database Schema](docs/02_PRD_Schema.md) | Complete Prisma schema (25+ models) | **Data model** |
| 08 | [Business Rules](docs/08_Business_Rules.md) | Validations, state machines, permissions | **Domain logic** |

### Layer 3: Modules (HOW we build each feature)

| # | Document | Purpose | Interface |
|---|----------|---------|-----------|
| 03 | [Deals Module](docs/03_Module_Deals.md) | Deal pipeline, DD tracking | Cockpit (Dark) |
| 04 | [Investors Module](docs/04_Module_Investors.md) | LP management, portal | Cockpit + Library |
| 05 | [Portfolio Module](docs/05_Module_Portfolio.md) | Company tracking, KPIs | Cockpit (Dark) |
| 06 | [Capital Module](docs/06_Module_Capital.md) | Capital calls, distributions | Cockpit (Dark) |
| 07 | [Reports Module](docs/07_Module_Reports.md) | Quarterly reports, PDFs | Both |

### Implementation Guide

| # | Document | Purpose |
|---|----------|---------|
| 09 | [Claude Instructions](docs/09_Claude_Instructions.md) | Code patterns, design system config, implementation guide |

---

## Reading Order

### For Stakeholders / Product Review

Read in this order to understand what we're building and why:

```
00_Product_Strategy  →  10_Lean_Canvas  →  11_Brand_System
     (Problem)           (Business)         (Experience)
```

### For Developers / Claude Code

Read in this order to understand how to build:

```
11_Brand_System      →  09_Claude_Instructions  →  01_PRD_Overview
   (Design System)       (Code Patterns)           (Architecture)
        │
        ▼
   02_PRD_Schema     →  08_Business_Rules
   (Data Model)          (Domain Logic)
        │
        ▼
   03-07_Modules (as needed for each feature)
```

**Critical:** The Brand System (11) and Claude Instructions (09) must be read BEFORE starting any UI work. These documents define the visual language, color palette, typography, and component patterns.

---

## Key Architectural Decisions

### Dual Interface Strategy

BlackGem has two distinct visual experiences based on user psychology:

| Interface | Codename | Mode | Users | Purpose |
|-----------|----------|------|-------|---------|
| Manager Dashboard | **The Cockpit** | Dark | Fund Managers, Analysts | Efficiency, control, technical mastery |
| LP Portal | **The Library** | Light | Investors, Advisors | Trust, clarity, traditional finance |

This is implemented via separate route groups with different CSS themes. See `11_Brand_System.md` Section 3 and `09_Claude_Instructions.md` Section 2.5.

### Stealth Wealth Aesthetic

The visual design follows a "stealth wealth" philosophy: minimal, monochromatic, and institutional. No bright colors, no playful illustrations, no startup aesthetics. The platform should feel like internal software from Morgan Stanley or Goldman Sachs.

### Domain-Driven Structure

The codebase mirrors the business domain:

```
/deals      → Deal pipeline and acquisition tracking
/investors  → LP management and communications
/portfolio  → Post-acquisition company management
/capital    → Fund economics and transactions
/reports    → Reporting and document generation
/portal     → Read-only LP experience (Library mode)
```

---

## Tech Stack Summary

```yaml
Frontend:
  Framework: Next.js 14+ (App Router)
  Language: TypeScript (strict mode)
  Styling: Tailwind CSS + shadcn/ui (customized palette)
  Fonts: Inter (UI), Source Serif Pro (reports), JetBrains Mono (numbers)
  State: TanStack Query + Zustand
  Charts: Recharts (with BlackGem theme)

Backend:
  Runtime: Next.js API Routes
  ORM: Prisma
  Database: PostgreSQL (Supabase)
  Auth: NextAuth.js v5
  Storage: AWS S3 / Cloudflare R2
  PDF: @react-pdf/renderer

Infrastructure:
  Hosting: Vercel
  Monitoring: Sentry + Vercel Analytics
```

---

## Pricing Tiers

| Tier | Price | Target | Key Features |
|------|-------|--------|--------------|
| **Searcher** | €49/mo | Pre-acquisition | Deal pipeline, DD checklist, 2 users |
| **Operator** | €199/mo | Post-acquisition | + LP Portal, Capital ops, Reports, 5 users |
| **Fund Manager** | €399/mo | Multi-fund | + Multiple funds, White-label, API, Unlimited users |

---

## Development Phases

| Phase | Focus | Duration |
|-------|-------|----------|
| 1 | Foundation (Auth, DB, Layout) | 2 weeks |
| 2 | Deals Module | 2 weeks |
| 3 | Investors Module + Portal | 3 weeks |
| 4 | Portfolio Module | 2 weeks |
| 5 | Capital Module | 2 weeks |
| 6 | Reports Module | 2 weeks |
| 7 | Polish, Testing, Launch | 2 weeks |

---

## Document Relationships

```
                    ┌─────────────────────┐
                    │  00_Product_Strategy │ ◄─── Source of truth: USERS
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 10_Lean_Canvas  │  │ 11_Brand_System │  │ 01_PRD_Overview │
│   (Business)    │  │    (Design)     │  │  (Architecture) │
└─────────────────┘  └────────┬────────┘  └────────┬────────┘
                              │                    │
                              ▼                    ▼
                    ┌─────────────────┐  ┌─────────────────┐
                    │09_Claude_Instr. │  │ 02_PRD_Schema   │
                    │(Implementation) │  │  (Data Model)   │
                    └────────┬────────┘  └────────┬────────┘
                             │                    │
                             └─────────┬──────────┘
                                       ▼
                    ┌─────────────────────────────────┐
                    │         03-07 MODULES           │
                    │  (Feature Specifications)        │
                    └─────────────────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────┐
                    │       08_Business_Rules         │
                    │  (Validations & Permissions)    │
                    └─────────────────────────────────┘
```

---

## Files in This Repository

```
blackgem/
├── README.md                      ◄─── You are here
├── docs/
│   ├── 00_Product_Strategy.md
│   ├── 01_PRD_Overview.md
│   ├── 02_PRD_Schema.md
│   ├── 03_Module_Deals.md
│   ├── 04_Module_Investors.md
│   ├── 05_Module_Portfolio.md
│   ├── 06_Module_Capital.md
│   ├── 07_Module_Reports.md
│   ├── 08_Business_Rules.md
│   ├── 09_Claude_Instructions.md
│   ├── 10_Lean_Canvas.md
│   └── 11_Brand_System.md
├── assets/
│   └── BlackGem_Logo.png
├── onepager_cocreation_es.pdf     ◄─── Marketing: Co-creation program
├── onepager_general_es.pdf        ◄─── Marketing: General one-pager
└── onepager_*.html                ◄─── Source files for PDFs
```

---

## Quick Reference: Sources of Truth

| Question | Document |
|----------|----------|
| Who are our users? | `00_Product_Strategy.md` |
| What's the business model? | `10_Lean_Canvas.md` |
| What colors/fonts to use? | `11_Brand_System.md` |
| What tech stack? | `01_PRD_Overview.md` + `09_Claude_Instructions.md` |
| What's the data model? | `02_PRD_Schema.md` |
| What validations apply? | `08_Business_Rules.md` |
| How to implement feature X? | `03-07_Module_*.md` |
| How to write code for this project? | `09_Claude_Instructions.md` |

---

*NIRO Group LLC © 2026*
