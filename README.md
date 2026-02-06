# BlackGem

Private Equity fund management platform built with Next.js 15, React 19, Prisma, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon) |
| Auth | NextAuth v5 (JWT + Credentials) |
| Testing | Vitest |
| Icons | Lucide React |

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | Central hub with fund analytics |
| Deal Pipeline | `/deals` | Full deal lifecycle management (Identified → Closed) |
| Investors | `/investors` | LP management with KYC/AML tracking |
| Portfolio | `/portfolio` | Post-acquisition company performance tracking |
| Capital | `/capital/calls` | Capital call notices and tracking |
| Distributions | `/capital/distributions` | Distribution processing |
| Reports | `/reports` | Analytics and PDF export |
| Settings | `/settings` | User profile and fund configuration |
| LP Portal | `/portal` | Investor self-service portal (stub) |

## Deal Detail Tabs

Each deal has 5 functional tabs:

- **Overview** — Inline editing of financials, company details, dates, and analysis fields
- **Documents** — Data room with drag-and-drop upload, preview (PDF/images), and download
- **Contacts** — Deal team and external contacts with role badges
- **Activity** — Filterable table combining manual activity logging with system audit events
- **Notes** — Threaded notes system with author tracking and timestamps

## User Roles

| Role | Access Level |
|------|-------------|
| `SUPER_ADMIN` | Full access, bypasses all checks |
| `FUND_ADMIN` | Full fund access, bypasses fund-level checks |
| `INVESTMENT_MANAGER` | Read/write on deals, contacts, documents, notes, activities |
| `ANALYST` | Read/write on deals, contacts, documents, notes, activities |
| `LP_PRIMARY` | Read-only |
| `LP_VIEWER` | Read-only |
| `AUDITOR` | Read-only |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))

### Setup

```bash
# Clone the repository
git clone https://github.com/rfarias23/BlackGems.git
cd BlackGems

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your database URL
```

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/blackgem
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup

```bash
# Push schema to database
npx prisma db push

# Seed with sample data
npx prisma db seed

# Open Prisma Studio (optional)
npx prisma studio
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@blackgem.com` | `admin123` | FUND_ADMIN |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── deals/            # Deal pipeline (list, detail, new)
│   │   ├── investors/        # Investor management
│   │   ├── portfolio/        # Portfolio companies
│   │   ├── capital/          # Capital calls & distributions
│   │   ├── reports/          # Reporting
│   │   └── settings/         # Configuration
│   ├── (portal)/             # LP investor portal
│   ├── api/                  # API routes (auth, document upload/download)
│   └── login/                # Authentication page
├── components/
│   ├── deals/                # Deal-specific components
│   ├── documents/            # Document upload, list, preview
│   └── ui/                   # shadcn/ui base components
└── lib/
    ├── actions/              # Server actions (deals, documents, notes, activities, etc.)
    └── shared/               # Shared utilities (audit, soft-delete, fund-access, formatters)
```

## Key Architecture Decisions

**Server Actions** — All mutations use Next.js `'use server'` actions with auth checks, fund-level access control, and audit logging.

**Soft Deletes** — Deals, investors, portfolio companies, and documents use `deletedAt` timestamps instead of hard deletes.

**Audit Trail** — All mutations log to `AuditLog` with user, action, entity, and change diffs.

**Fund-Scoped Access** — Operations are scoped to funds via `requireFundAccess()`. Super/Fund admins bypass checks.

**Dark Mode** — Dashboard uses inline CSS variable overrides. Portal components (Dialog, Select) that render outside the layout div use hardcoded hex colors.

**Document Storage** — Files stored locally in `uploads/{dealId}/` directory. Designed for future S3 migration.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check
npm run test       # Run tests (Vitest)
npm run test:watch # Run tests in watch mode
```

## Database Models

27 models organized across these domains:

- **Auth**: User, Account, Session, VerificationToken
- **Fund**: Fund, FundMember
- **Deals**: Deal, DealSource, DealContact, DueDiligenceItem
- **Investors**: Investor, Commitment
- **Capital**: CapitalCall, CapitalCallItem, Distribution, DistributionItem
- **Portfolio**: PortfolioCompany, PortfolioMetric
- **Shared**: Document, Activity, Comment, Task, Notification, AuditLog

## License

Private — All rights reserved.
