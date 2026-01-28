# BlackGem - PRD Overview

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.1 |
| Last Updated | January 26, 2026 |
| Author | NIRO Group LLC |
| Status | Ready for Development |

---

## 1. Executive Summary

### 1.1 Product Vision

BlackGem is a purpose-built platform for managing the complete lifecycle of search funds and micro-PE funds. From raising capital to exit, it serves as the operating system that makes any fund look institutional from day one.

### 1.2 Business Context

A Search Fund is an investment vehicle where entrepreneurs raise capital from investors (typically $300K-$500K initial) to search for, acquire, and operate a private company valued between $5M-$30M.

**Lifecycle:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SEARCH FUND LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   RAISING        SEARCHING       UNDER LOI       ACQUIRED       OPERATING   │
│   (3-6 mo)  ───► (12-24 mo) ───► (2-4 mo)   ───► (Day 1)   ───► (3-7 yrs)  │
│      │              │               │              │              │          │
│      │              │               │              │              ▼          │
│      │              │               │              │         PREPARING      │
│      │              │               │              │           EXIT         │
│      │              │               │              │              │          │
│      │              ▼               ▼              │              ▼          │
│      │          DISSOLVED        PASSED           │           EXITED        │
│      │         (no target)     (deal lost)        │              │          │
│      │                                            │              ▼          │
│      └────────────────────────────────────────────┴──────────► CLOSED      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Target Users

> **Source of Truth:** See `00_Product_Strategy.md` for detailed personas and user journeys.

| User Type | Interface | Primary Needs |
|-----------|-----------|---------------|
| Fund Principals | Cockpit (Dark) | Full platform access, deal management, portfolio monitoring |
| Analysts | Cockpit (Dark) | Deal research, data entry, document management |
| Limited Partners | Library (Light) | Portal access to reports, capital account, documents |
| Advisors | Library (Light) | Limited access to portfolio metrics, board materials |

### 1.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Deal tracking efficiency | 50% reduction in admin time | User surveys |
| LP communication | 100% on-time quarterly reports | Delivery dates |
| Data accuracy | Zero manual calculation errors | Audit reconciliation |
| User adoption | 80% daily active use | Analytics |

---

## 2. Technical Architecture

### 2.1 Tech Stack

> **Implementation Details:** See `09_Claude_Instructions.md` for complete configuration including Tailwind theme, font setup, and component patterns.

```yaml
Frontend:
  Framework: Next.js 14+ (App Router)
  Language: TypeScript (strict mode)
  Styling: Tailwind CSS + shadcn/ui (BlackGem theme)
  State Management: TanStack Query (server) + Zustand (client)
  Charts: Recharts (with BlackGem visualization rules)
  Forms: React Hook Form + Zod validation
  Date Handling: date-fns

Backend:
  Runtime: Next.js API Routes
  ORM: Prisma
  Database: PostgreSQL (Supabase or Neon)
  Authentication: NextAuth.js v5 (Auth.js)
  File Storage: AWS S3 or Cloudflare R2
  Email: Resend
  PDF Generation: @react-pdf/renderer

Infrastructure:
  Hosting: Vercel
  Database Hosting: Supabase
  CDN: Cloudflare (via Vercel)
  Monitoring: Vercel Analytics + Sentry
  Logging: Axiom or Logtail

Development:
  Package Manager: pnpm
  Testing: Vitest + Playwright
  CI/CD: GitHub Actions
  Code Quality: ESLint + Prettier + Husky
```

### 2.2 Design System

> **Source of Truth:** See `11_Brand_System.md` for complete visual specifications.

BlackGem implements a **Dual Interface Strategy**:

| Interface | Route Group | Mode | CSS Class | Users |
|-----------|-------------|------|-----------|-------|
| The Cockpit | `(dashboard)` | Dark | `.dark` | Managers, Analysts |
| The Library | `(portal)` | Light | (default) | LPs, Advisors |

**Key Design Principles:**
- Stealth Wealth aesthetic (monochromatic, institutional)
- Serif typography for headings (Source Serif Pro)
- Monospace for financial data (JetBrains Mono)
- No pie charts, no 3D, no excessive animations
- 1px borders, minimal shadows

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │
│  │    Web App        │  │   Mobile (PWA)    │  │   LP Portal           │   │
│  │   (Next.js SSR)   │  │   (Responsive)    │  │   (Read-only views)   │   │
│  └─────────┬─────────┘  └─────────┬─────────┘  └───────────┬───────────┘   │
└────────────┼─────────────────────┼─────────────────────────┼───────────────┘
             │                     │                         │
             └─────────────────────┼─────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ Auth        │ │ Validation  │ │ Rate        │ │ Audit       │   │   │
│  │  │ Middleware  │ │ (Zod)       │ │ Limiting    │ │ Logging     │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ FundService  │ │ DealService  │ │ PortfolioSvc │ │ InvestorSvc  │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ CapitalSvc   │ │ ReportSvc    │ │ DocumentSvc  │ │ NotificationS│       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│  ┌──────────────┐ ┌──────────────┐                                         │
│  │ AuditService │ │ CalculationS │  (IRR, MOIC, Waterfall)                 │
│  └──────────────┘ └──────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────┐    │
│  │      PostgreSQL         │    │        File Storage (S3/R2)         │    │
│  │      (via Prisma)       │    │  - Documents (PDFs, contracts)      │    │
│  │                         │    │  - Reports (generated)              │    │
│  │  - Transactional data   │    │  - Exports (Excel, CSV)             │    │
│  │  - Audit logs           │    │                                     │    │
│  └─────────────────────────┘    └─────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User Login                                                                 │
│       │                                                                      │
│       ▼                                                                      │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │ Credentials │ ──► │  NextAuth   │ ──► │   Session   │                   │
│   │  or OAuth   │     │  Verify     │     │   Created   │                   │
│   └─────────────┘     └─────────────┘     └──────┬──────┘                   │
│                                                   │                          │
│                                                   ▼                          │
│                                           ┌─────────────┐                    │
│                                           │ JWT Token   │                    │
│                                           │ (contains:  │                    │
│                                           │  userId,    │                    │
│                                           │  role,      │                    │
│                                           │  fundIds[]) │                    │
│                                           └──────┬──────┘                    │
│                                                   │                          │
│   API Request ◄───────────────────────────────────┘                          │
│       │                                                                      │
│       ▼                                                                      │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │ Auth        │ ──► │ Fund Access │ ──► │ Role-based  │ ──► Resource      │
│   │ Middleware  │     │ Check       │     │ Permission  │                   │
│   └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Role-Based Access Control (RBAC)

| Permission | ADMIN | FUND_MANAGER | ANALYST | LP_USER | VIEWER |
|------------|-------|--------------|---------|---------|--------|
| **Fund Settings** | Full | Edit | View | None | None |
| **User Management** | Full | Invite/Edit | None | None | None |
| **Deals - View** | All | All | All | None | All |
| **Deals - Create/Edit** | Yes | Yes | Yes | No | No |
| **Deals - Delete** | Yes | Yes | No | No | No |
| **Investors - View** | All | All | All | Own only | None |
| **Investors - Edit** | Yes | Yes | No | No | No |
| **Portfolio - View** | All | All | All | Summary | Summary |
| **Portfolio - Edit** | Yes | Yes | No | No | No |
| **Capital Calls** | Full | Full | View | Own only | None |
| **Distributions** | Full | Full | View | Own only | None |
| **Reports - Generate** | Yes | Yes | Yes | No | No |
| **Reports - View** | All | All | All | Published | Published |
| **Documents - Upload** | Yes | Yes | Yes | No | No |
| **Documents - View** | All | All | All | Shared | Shared |
| **Audit Log** | View | View | None | None | None |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| Page Load (initial) | < 2 seconds | Lighthouse, Web Vitals |
| Page Load (subsequent) | < 500ms | Client-side navigation |
| API Response (simple) | < 200ms | p95 latency |
| API Response (complex) | < 1 second | p95 latency |
| Search Results | < 500ms | Full-text search response |
| Report Generation | < 30 seconds | PDF generation time |

### 3.2 Availability & Reliability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.9% (8.76 hours downtime/year max) |
| RTO (Recovery Time Objective) | < 4 hours |
| RPO (Recovery Point Objective) | < 1 hour (hourly backups) |
| Error Rate | < 0.1% of requests |

### 3.3 Security

| Area | Requirement |
|------|-------------|
| Data Encryption (at rest) | AES-256 |
| Data Encryption (in transit) | TLS 1.3 |
| Password Storage | bcrypt with cost factor 12 |
| Session Management | HTTP-only, Secure, SameSite cookies |
| API Security | Rate limiting, CORS, input validation |
| File Uploads | Virus scanning, type validation, size limits |
| Audit Trail | All data modifications logged |

### 3.4 Compliance Considerations

| Area | Approach |
|------|----------|
| Data Privacy | User consent for data collection, data export capability |
| Financial Data | Encryption, access controls, audit logging |
| Document Retention | Configurable retention policies |
| Access Logs | 7-year retention for financial audit trail |

### 3.5 Browser & Device Support

| Browser | Versions |
|---------|----------|
| Chrome | Latest 2 versions |
| Safari | Latest 2 versions |
| Firefox | Latest 2 versions |
| Edge | Latest 2 versions |

| Device | Breakpoints |
|--------|-------------|
| Mobile | 375px - 639px |
| Tablet | 640px - 1023px |
| Desktop | 1024px - 1279px |
| Large Desktop | 1280px+ |

---

## 4. Project Structure

```
blackgem/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed data for development
├── public/
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, register)
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── (portal)/           # LP portal routes
│   │   ├── api/                # API routes
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── layout/             # Layout components
│   │   ├── forms/              # Reusable form components
│   │   └── [module]/           # Module-specific components
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # Auth configuration
│   │   ├── utils.ts            # General utilities
│   │   ├── validations/        # Zod schemas
│   │   ├── calculations/       # Financial calculations
│   │   └── services/           # Business logic services
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # API integration tests
│   └── e2e/                    # Playwright E2E tests
├── docs/                       # Documentation (these PRD files)
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Development Phases

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Core infrastructure and authentication

**Deliverables:**
- Project setup with all tooling configured
- Database schema deployed
- Authentication system (email/password + OAuth)
- Base UI components and layout
- User management with RBAC
- Audit logging infrastructure

### Phase 2: Deal Pipeline (Weeks 5-8)
**Goal:** Complete deal management functionality

**Deliverables:**
- Deal CRUD with all fields
- Kanban and table views
- Stage management with validation
- Contact management
- Activity logging
- Due diligence checklist
- Document uploads
- Basic pipeline analytics

### Phase 3: Investor Management (Weeks 9-11)
**Goal:** LP management and portal

**Deliverables:**
- Investor CRUD
- Capital account tracking
- Communication logging
- LP portal (read-only)
- Investor-User linking

### Phase 4: Portfolio Management (Weeks 12-15)
**Goal:** Portfolio company tracking

**Deliverables:**
- Portfolio company profiles
- Deal-to-Portfolio conversion
- Financial data entry and dashboards
- KPI tracking
- Valuation management
- Strategic initiatives
- Board meeting management

### Phase 5: Capital Operations (Weeks 16-18)
**Goal:** Capital calls and distributions

**Deliverables:**
- Capital call creation and tracking
- Pro-rata calculations
- Distribution management
- Waterfall calculations
- PDF notice generation
- Capital transaction history

### Phase 6: Reporting & Analytics (Weeks 19-22)
**Goal:** Comprehensive reporting

**Deliverables:**
- Quarterly investor update builder
- IRR/MOIC calculations
- Performance dashboards
- PDF report generation
- Report distribution to LPs
- Excel/CSV exports

### Phase 7: Polish & Launch (Weeks 23-26)
**Goal:** Production readiness

**Deliverables:**
- Performance optimization
- Security audit and fixes
- Mobile responsiveness refinement
- Error handling improvements
- User documentation
- Production deployment

---

## 6. Related Documents

| Document | Description |
|----------|-------------|
| `02_PRD_Schema.md` | Complete database schema with all models |
| `03_Module_Deals.md` | Deal pipeline module specification |
| `04_Module_Investors.md` | Investor/LP management specification |
| `05_Module_Portfolio.md` | Portfolio management specification |
| `06_Module_Capital.md` | Capital calls & distributions specification |
| `07_Module_Reports.md` | Reporting module specification |
| `08_Business_Rules.md` | Business rules and validations |
| `09_Claude_Instructions.md` | Instructions for Claude Code |

---

## Appendix A: Environment Variables

```env
# .env.example

# ============ DATABASE ============
DATABASE_URL="postgresql://user:password@localhost:5432/searchfund_db"

# ============ AUTHENTICATION ============
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ============ FILE STORAGE ============
# Option 1: AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET="searchfund-documents"

# Option 2: Cloudflare R2
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET=""
R2_ENDPOINT=""

# ============ EMAIL ============
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourdomain.com"

# ============ MONITORING ============
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""

# ============ APP CONFIG ============
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="BlackGem"
```

---

## Appendix B: Initial Setup Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest blackgem --typescript --tailwind --eslint --app --src-dir

# 2. Navigate to project
cd blackgem

# 3. Install core dependencies
pnpm add @prisma/client next-auth @auth/prisma-adapter
pnpm add zod react-hook-form @hookform/resolvers
pnpm add @tanstack/react-query zustand
pnpm add recharts date-fns
pnpm add lucide-react
pnpm add clsx tailwind-merge class-variance-authority
pnpm add @react-pdf/renderer
pnpm add resend

# 4. Install dev dependencies
pnpm add -D prisma
pnpm add -D vitest @vitejs/plugin-react
pnpm add -D @playwright/test
pnpm add -D @types/node

# 5. Initialize Prisma
npx prisma init

# 6. Initialize shadcn/ui
npx shadcn@latest init

# 7. Add shadcn/ui components
npx shadcn@latest add button card input label table dialog sheet \
  dropdown-menu avatar badge tabs select textarea checkbox \
  toast sonner calendar popover command separator scroll-area \
  alert alert-dialog form skeleton

# 8. Setup database
npx prisma migrate dev --name init
npx prisma generate

# 9. Run development server
pnpm dev
```

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **AUM** | Assets Under Management - total value managed by the fund |
| **Capital Call** | Request to LPs to contribute committed capital |
| **Carried Interest** | GP's share of profits (typically 20%) after hurdle |
| **CIM** | Confidential Information Memorandum - deal summary document |
| **DD** | Due Diligence - investigation process before acquisition |
| **Distribution** | Payment of proceeds to investors |
| **GP** | General Partner - fund manager(s) |
| **Hurdle Rate** | Minimum return LPs must receive before carry (typically 8%) |
| **IRR** | Internal Rate of Return - annualized return metric |
| **LOI** | Letter of Intent - non-binding acquisition offer |
| **LP** | Limited Partner - passive investor in the fund |
| **LPA** | Limited Partnership Agreement - fund governing document |
| **MOIC** | Multiple on Invested Capital - total return multiple |
| **NAV** | Net Asset Value - current fund value |
| **NDA** | Non-Disclosure Agreement |
| **Search Fund** | Investment vehicle to find, acquire, and operate a company |
| **Vintage Year** | Year the fund was formed/first capital called |
| **Waterfall** | Distribution priority structure between LPs and GP |
