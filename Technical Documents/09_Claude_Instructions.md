# BlackGem - Claude Code Instructions

## Document Information
| Field | Value |
|-------|-------|
| Version | 3.0 |
| Purpose | Guide Claude Code in implementing this platform |
| Design Reference | See `11_Brand_System.md` for complete visual guidelines |

---

## 1. Project Context

You are building **BlackGem** - a fund management platform for Search Funds and Micro-PE. The platform must project **Institutional Excellence** from day one, making a $5M fund look as professional as a $500M fund.

**Key Domain Concepts:**
- **Fund**: The investment vehicle that raises money from investors (LPs) to acquire a company
- **Deal**: A potential acquisition target being evaluated
- **Investor/LP**: Limited Partners who commit capital to the fund
- **Portfolio Company**: A company that has been acquired by the fund
- **Capital Call**: A request for investors to contribute their committed capital
- **Distribution**: Returning profits/proceeds to investors

**Critical Design Principle - Dual Interface:**
BlackGem has two distinct visual experiences:
1. **The Cockpit** (Manager Dashboard) - Soft dark mode for fund managers
2. **The Library** (LP Portal) - Pristine light mode for investors

This is not a preference toggle—it's a deliberate UX decision based on user psychology. See section 2.2 for implementation details.

---

## 2. Technology Stack & Design Configuration

### 2.1 Core Stack

```yaml
Framework: Next.js 14+ with App Router
Language: TypeScript (strict mode)
Styling: Tailwind CSS + shadcn/ui (customized for BlackGem)
Database: PostgreSQL with Prisma ORM
Auth: NextAuth.js v5 (Auth.js)
State: TanStack Query (server) + Zustand (client)
Forms: React Hook Form + Zod
Charts: Recharts (with BlackGem theme)
PDF: @react-pdf/renderer
```

### 2.2 Tailwind Configuration (CRITICAL)

Create `tailwind.config.ts` with the BlackGem design system. This is non-negotiable—do not use default shadcn colors.

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === BLACKGEM STEALTH WEALTH PALETTE ===
        // Primary Backgrounds
        "midnight-ink": "#11141D",      // Dark mode background
        "soft-parchment": "#F9FAFB",    // Light mode background
        
        // Neutrals (Slate scale)
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        
        // Semantic colors (used sparingly)
        error: "#DC2626",
        success: "#059669",    // Emerald Forest - only for positive metrics
        warning: "#D97706",
        
        // shadcn/ui variable mapping
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        // Primary sans-serif for UI
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Serif for headings and reports
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        // Monospace for financial data
        mono: ["var(--font-jetbrains)", "Consolas", "monospace"],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      boxShadow: {
        // Minimal shadows - "stealth wealth" aesthetic
        "card": "0 1px 3px rgba(0, 0, 0, 0.05)",
        "card-dark": "0 1px 3px rgba(0, 0, 0, 0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 2.3 CSS Variables for Theme Modes

Create `src/app/globals.css` with both Cockpit (dark) and Library (light) themes:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ============================================
     THE LIBRARY - Light Mode (LP Portal)
     Used for: (portal) routes
     Psychology: Trust, clarity, traditional finance
     ============================================ */
  :root {
    --background: 210 20% 98%;        /* soft-parchment */
    --foreground: 215 25% 17%;        /* midnight-ink */
    
    --card: 0 0% 100%;
    --card-foreground: 215 25% 17%;
    
    --primary: 215 25% 17%;           /* midnight-ink as primary */
    --primary-foreground: 210 20% 98%;
    
    --secondary: 215 16% 47%;         /* slate-600 */
    --secondary-foreground: 210 20% 98%;
    
    --muted: 210 40% 96%;             /* slate-100 */
    --muted-foreground: 215 16% 47%;  /* slate-600 */
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 214 32% 91%;            /* slate-200 */
    --ring: 215 25% 17%;
    
    --radius: 8px;
  }
  
  /* ============================================
     THE COCKPIT - Dark Mode (Manager Dashboard)
     Used for: (dashboard) routes
     Psychology: Control, efficiency, technical mastery
     ============================================ */
  .dark {
    --background: 220 26% 9%;         /* midnight-ink */
    --foreground: 210 40% 98%;        /* slate-50 */
    
    --card: 217 33% 17%;              /* slate-800 */
    --card-foreground: 210 40% 98%;
    
    --primary: 210 40% 98%;           /* inverted: light on dark */
    --primary-foreground: 220 26% 9%;
    
    --secondary: 217 19% 27%;         /* slate-700 */
    --secondary-foreground: 210 40% 98%;
    
    --muted: 217 33% 17%;             /* slate-800 */
    --muted-foreground: 215 20% 65%;  /* slate-400 */
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 217 19% 27%;            /* slate-700 */
    --ring: 210 40% 98%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 2.4 Font Configuration

Configure fonts in `src/app/layout.tsx`:

```typescript
// src/app/layout.tsx
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

### 2.5 Implementing Cockpit vs Library Modes

The two experiences are implemented via separate layout groups:

```typescript
// src/app/(dashboard)/layout.tsx - THE COCKPIT
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <Header />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

// src/app/(portal)/layout.tsx - THE LIBRARY
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Light mode by default - no "dark" class */}
      <PortalHeader />
      <main className="max-w-5xl mx-auto p-8">{children}</main>
      <PortalFooter />
    </div>
  );
}
```

### 2.6 Chart Configuration (Recharts Theme)

All charts must follow the Boardroom Standard from the Brand System:

```typescript
// src/lib/chart-config.ts
export const BLACKGEM_CHART_THEME = {
  // Color palette for charts - monochromatic
  colors: {
    primary: "#334155",    // slate-700
    secondary: "#64748B",  // slate-500
    tertiary: "#94A3B8",   // slate-400
    success: "#059669",    // Only for positive metrics (IRR, returns)
    error: "#DC2626",      // Only for negative metrics
    grid: "#E2E8F0",       // slate-200
    gridDark: "#334155",   // slate-700
  },
  
  // Standard styling
  style: {
    strokeWidth: 2,
    dotRadius: 0,          // No dots by default
    dotRadiusHover: 4,     // Dots appear on hover
    animationDuration: 200, // Fast, functional - not decorative
    fontSize: 12,
    fontFamily: "var(--font-inter)",
  },
};

// Reusable chart components
export const chartDefaults = {
  margin: { top: 20, right: 20, bottom: 20, left: 40 },
  
  // X Axis styling
  xAxis: {
    stroke: "#94A3B8",
    fontSize: 11,
    tickLine: false,
    axisLine: { stroke: "#E2E8F0" },
  },
  
  // Y Axis styling  
  yAxis: {
    stroke: "#94A3B8",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
    width: 60,
  },
  
  // Grid styling
  grid: {
    strokeDasharray: "3 3",
    stroke: "#E2E8F0",
    vertical: false,  // Horizontal lines only
  },
  
  // Tooltip styling
  tooltip: {
    contentStyle: {
      backgroundColor: "#11141D",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
    },
    itemStyle: { color: "#F1F5F9" },
    labelStyle: { color: "#94A3B8", fontWeight: 600 },
  },
};

// PROHIBITED: Pie charts, 3D charts, excessive animations
// See 11_Brand_System.md Section 4 for complete rules
```

---

## 3. Project Structure

Follow this exact structure:

```
src/
├── app/
│   ├── (auth)/                    # Auth pages (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Protected dashboard routes
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   ├── page.tsx               # Dashboard home
│   │   ├── deals/
│   │   │   ├── page.tsx           # Deal list
│   │   │   ├── [id]/page.tsx      # Deal detail
│   │   │   └── new/page.tsx       # New deal form
│   │   ├── investors/
│   │   ├── portfolio/
│   │   ├── capital/
│   │   ├── reports/
│   │   └── settings/
│   ├── (portal)/                  # LP Portal (separate layout)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/                       # API routes
│       ├── auth/[...nextauth]/route.ts
│       ├── deals/
│       │   ├── route.ts           # GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts       # GET, PUT, DELETE
│       │       └── stage/route.ts # PATCH (change stage)
│       ├── investors/
│       ├── portfolio/
│       └── ...
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/                    # Layout components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── mobile-nav.tsx
│   ├── deals/                     # Deal-specific components
│   ├── investors/
│   ├── portfolio/
│   └── shared/                    # Shared components
├── lib/
│   ├── prisma.ts                  # Prisma client singleton
│   ├── auth.ts                    # Auth configuration
│   ├── utils.ts                   # General utilities
│   ├── validations/               # Zod schemas
│   │   ├── deal.ts
│   │   ├── investor.ts
│   │   └── ...
│   ├── services/                  # Business logic
│   │   ├── deal-service.ts
│   │   ├── investor-service.ts
│   │   ├── capital-service.ts
│   │   └── ...
│   └── calculations/              # Financial calculations
│       ├── irr.ts
│       ├── waterfall.ts
│       └── ...
├── hooks/                         # Custom React hooks
│   ├── use-deals.ts
│   ├── use-investors.ts
│   └── ...
├── stores/                        # Zustand stores
│   └── deal-view-store.ts
└── types/                         # TypeScript types
    └── index.ts
```

---

## 4. Implementation Order

Build the application in this order:

### Phase 1: Foundation (Do First)

1. **Project Setup**
   ```bash
   npx create-next-app@latest blackgem --typescript --tailwind --eslint --app --src-dir
   cd blackgem
   npx shadcn@latest init
   ```

2. **Database Setup**
   - Copy the Prisma schema from `02_PRD_Schema.md`
   - Run `npx prisma migrate dev --name init`
   - Create seed file for initial data

3. **Authentication**
   - Configure NextAuth.js with credentials provider
   - Create login/register pages
   - Set up middleware for protected routes
   - Implement RBAC checks

4. **Layout**
   - Create dashboard layout with sidebar
   - Implement responsive navigation
   - Add user menu with logout

### Phase 2: Deal Pipeline

Build the complete deal module:
1. Deal list page (table + kanban views)
2. Deal detail page with tabs
3. Deal form (create/edit)
4. Stage change functionality
5. Due diligence tracker
6. Activity logging

### Phase 3: Investors

1. Investor list page
2. Investor detail with capital account
3. Communication logging
4. Portal access management

### Phase 4: Portfolio

1. Portfolio overview
2. Deal-to-portfolio conversion
3. Financial data entry
4. KPI tracking
5. Valuation management

### Phase 5: Capital Operations

1. Capital call creation
2. Distribution management
3. Waterfall calculations
4. PDF notice generation

### Phase 6: Reporting

1. Report builder
2. PDF generation
3. Distribution to LPs

---

## 5. Code Patterns

### 5.1 API Routes Pattern

Always follow this pattern for API routes:

```typescript
// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDealSchema } from '@/lib/validations/deal';
import { createAuditLog } from '@/lib/services/audit-service';

// GET /api/deals - List deals with filters
export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const fundId = searchParams.get('fundId');
    const stage = searchParams.get('stage');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 3. Build query with fund access check
    const where = {
      fundId: fundId || { in: session.user.fundIds },
      ...(stage && { stage }),
    };

    // 4. Execute query
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          _count: { select: { activities: true, documents: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    // 5. Return response
    return NextResponse.json({ deals, total, page, limit });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Create new deal
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Permission check
    if (!['ADMIN', 'FUND_MANAGER', 'ANALYST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse and validate body
    const body = await request.json();
    const validationResult = createDealSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // 4. Fund access check
    if (!session.user.fundIds.includes(validationResult.data.fundId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 5. Create record
    const deal = await prisma.deal.create({
      data: {
        ...validationResult.data,
        name: validationResult.data.name || validationResult.data.companyName,
      },
    });

    // 6. Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Deal',
      entityId: deal.id,
      entityName: deal.companyName,
    });

    // 7. Return response
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5.2 Service Layer Pattern

Business logic should be in service files:

```typescript
// src/lib/services/deal-service.ts
import { prisma } from '@/lib/prisma';
import { DealStage, DealStatus } from '@prisma/client';
import { canTransitionDealStage, validateDealForStage } from '@/lib/business-rules/deal-rules';

export class DealService {
  /**
   * Change deal stage with validation
   */
  static async changeStage(
    dealId: string,
    newStage: DealStage,
    userId: string,
    reason?: string
  ) {
    // Get current deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      throw new Error('Deal not found');
    }

    // Validate transition is allowed
    if (!canTransitionDealStage(deal.stage, newStage)) {
      throw new Error(`Cannot transition from ${deal.stage} to ${newStage}`);
    }

    // Validate required fields for new stage
    const validation = validateDealForStage(deal, newStage);
    if (!validation.valid) {
      throw new Error(`Missing required fields: ${validation.errors.join(', ')}`);
    }

    // Update deal
    const updatedDeal = await prisma.$transaction(async (tx) => {
      // Update the deal
      const updated = await tx.deal.update({
        where: { id: dealId },
        data: {
          stage: newStage,
          status: newStage === 'PASSED' ? DealStatus.PASSED : 
                  newStage === 'CLOSED' ? DealStatus.WON : 
                  deal.status,
          ...(newStage === 'PASSED' && {
            passedDate: new Date(),
            passedReason: reason,
            passedBy: userId,
          }),
        },
      });

      // Create activity log
      await tx.activity.create({
        data: {
          userId,
          dealId,
          type: 'STAGE_CHANGE',
          title: `Stage changed to ${newStage}`,
          description: reason,
          metadata: {
            previousStage: deal.stage,
            newStage,
          },
        },
      });

      return updated;
    });

    return updatedDeal;
  }

  /**
   * Convert closed deal to portfolio company
   */
  static async convertToPortfolio(
    dealId: string,
    data: ConvertToPortfolioInput,
    userId: string
  ) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { fund: true },
    });

    if (!deal) throw new Error('Deal not found');
    if (deal.stage !== 'CLOSED') throw new Error('Only closed deals can be converted');
    if (deal.status !== 'WON') throw new Error('Only won deals can be converted');
    if (deal.portfolioCompanyId) throw new Error('Deal already converted');

    const result = await prisma.$transaction(async (tx) => {
      // Create portfolio company
      const portfolioCompany = await tx.portfolioCompany.create({
        data: {
          fundId: deal.fundId,
          sourceDealId: deal.id,
          name: data.name || deal.companyName,
          legalName: data.legalName,
          website: deal.website,
          description: deal.description,
          industry: deal.industry,
          acquisitionDate: data.acquisitionDate,
          acquisitionPrice: data.acquisitionPrice,
          equityInvested: data.equityInvested,
          debtUsed: data.debtUsed || 0,
          sellerNote: data.sellerNote || 0,
          earnout: data.earnout || 0,
          ownershipPct: data.ownershipPct,
          headquarters: `${deal.city}, ${deal.state}`,
          status: 'ACTIVE',
        },
      });

      // Create initial valuation at cost basis
      await tx.valuation.create({
        data: {
          companyId: portfolioCompany.id,
          date: data.acquisitionDate,
          value: data.acquisitionPrice,
          methodology: 'COST_BASIS',
          isOfficial: true,
          preparedBy: userId,
          notes: 'Initial valuation at acquisition cost',
        },
      });

      // Update fund status if this is the first acquisition
      const portfolioCount = await tx.portfolioCompany.count({
        where: { fundId: deal.fundId },
      });

      if (portfolioCount === 1) {
        await tx.fund.update({
          where: { id: deal.fundId },
          data: { status: 'ACQUIRED' },
        });
      }

      return portfolioCompany;
    });

    return result;
  }
}
```

### 5.3 React Query Hooks Pattern

```typescript
// src/hooks/use-deals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Deal, DealStage } from '@prisma/client';

interface DealFilters {
  fundId?: string;
  stage?: DealStage;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface DealsResponse {
  deals: Deal[];
  total: number;
  page: number;
  limit: number;
}

// Fetch functions
async function fetchDeals(filters: DealFilters): Promise<DealsResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  
  const res = await fetch(`/api/deals?${params}`);
  if (!res.ok) throw new Error('Failed to fetch deals');
  return res.json();
}

async function fetchDeal(id: string): Promise<Deal> {
  const res = await fetch(`/api/deals/${id}`);
  if (!res.ok) throw new Error('Failed to fetch deal');
  return res.json();
}

// Hooks
export function useDeals(filters: DealFilters = {}) {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: () => fetchDeal(id),
    enabled: !!id, // Don't fetch if no id
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateDealInput) => {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create deal');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate deals list to refetch
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      stage, 
      reason 
    }: { 
      id: string; 
      stage: DealStage; 
      reason?: string 
    }) => {
      const res = await fetch(`/api/deals/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update stage');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', id] });
    },
  });
}
```

### 5.4 Component Pattern

```typescript
// src/components/deals/deal-list/deal-table.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeals } from '@/hooks/use-deals';
import { useDealViewStore } from '@/stores/deal-view-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StageBadge } from '../shared/stage-badge';

export function DealTable() {
  const router = useRouter();
  const { filters } = useDealViewStore();
  const { data, isLoading, error } = useDeals(filters);

  if (isLoading) {
    return <DealTableSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading deals: {error.message}
      </div>
    );
  }

  if (!data?.deals.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No deals found. Create your first deal to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">EBITDA</TableHead>
          <TableHead className="text-right">Ask</TableHead>
          <TableHead>Last Activity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.deals.map((deal) => (
          <TableRow
            key={deal.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/deals/${deal.id}`)}
          >
            <TableCell>
              <div>
                <div className="font-medium">{deal.companyName}</div>
                <div className="text-sm text-muted-foreground">
                  {deal.industry}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <StageBadge stage={deal.stage} />
            </TableCell>
            <TableCell className="text-right">
              {deal.revenue ? formatCurrency(deal.revenue) : '-'}
            </TableCell>
            <TableCell className="text-right">
              {deal.ebitda ? formatCurrency(deal.ebitda) : '-'}
            </TableCell>
            <TableCell className="text-right">
              {deal.askingPrice ? formatCurrency(deal.askingPrice) : '-'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(deal.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DealTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

---

## 6. Error Handling

Always handle errors gracefully:

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

// API error handler
export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with this value already exists' },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## 7. UI/UX Guidelines

### Design Philosophy

BlackGem follows the principle of **Institutional Excellence**. The interface should feel like a tool designed by Morgan Stanley's internal team, not a consumer SaaS startup. Reference `11_Brand_System.md` for complete guidelines.

**Core Principles:**
1. **Espaciado de Lujo** - Generous whitespace communicates control
2. **Líneas de Precisión** - 1px borders, no heavy shadows
3. **Economía de Lenguaje** - If the data is solid, it needs no embellishment

### Component Styling (Aligned with Brand System)

```typescript
// Cards - minimal shadow, precise borders
<div className="rounded-lg border bg-card p-6 shadow-card">

// Page headers - serif for authority
<div className="flex items-center justify-between">
  <div>
    <h1 className="font-serif text-2xl font-bold tracking-tight">Title</h1>
    <p className="text-muted-foreground">Description</p>
  </div>
  <Button>Action</Button>
</div>

// Financial data - ALWAYS use monospace for numbers
<span className="font-mono text-right tabular-nums">
  {formatCurrency(amount)}
</span>

// Tables - the heart of BlackGem
<div className="rounded-lg border">
  <Table>
    <TableHeader>
      <TableRow className="border-b border-border hover:bg-transparent">
        <TableHead className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Column
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="border-b border-border hover:bg-muted/50">
        <TableCell className="font-mono tabular-nums">
          {/* Numerical data */}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### Microcopy Guidelines (Voice & Tone)

BlackGem speaks with **Autoridad Serena** - like a trusted partner, not a software vendor.

```typescript
// ❌ WRONG - Generic SaaS copy
"No deals found. Create your first deal to get started."
"Oops! Something went wrong."
"Great job! Your report was created successfully!"

// ✓ CORRECT - BlackGem tone
"Sin deals activos."
"No se pudo completar la acción."
"Reporte generado."

// ❌ WRONG - Verbose buttons
"Save Changes Now"
"Click Here to Export"

// ✓ CORRECT - Economy of language
"Guardar"
"Exportar"
```

**Microcopy Reference:**

| Context | Wrong | Correct |
|---------|-------|---------|
| Empty state | "You haven't added any investors yet!" | "Sin inversores registrados." |
| Success toast | "Successfully created!" | "Creado." |
| Error toast | "Oops, something went wrong" | "Error al procesar." |
| Confirm delete | "Are you sure you want to delete?" | "¿Eliminar?" |
| Loading | "Please wait..." | (Use skeleton, no text) |
| Button labels | "Click to Submit" | "Enviar" |

### Empty States

Minimal, dignified empty states - no illustrations or emojis:

```typescript
function EmptyState({ 
  title, 
  action 
}: { 
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground">{title}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Usage
<EmptyState 
  title="Sin deals activos." 
  action={<Button>Agregar Deal</Button>} 
/>
```

### Loading States

Use skeletons that match layout. Never use spinning animations or loading text:

```typescript
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
```

### Data Visualization Rules

**ALLOWED:**
- Line charts (thin, 2px stroke, single color)
- Area charts (subtle gradient to transparent)
- Horizontal bar charts (for comparisons)
- Tables (preferred for most data)

**PROHIBITED:**
- Pie charts (imprecise)
- 3D charts (distort perception)
- Donut charts (same problem as pie)
- Excessive animations (>200ms)
- Multiple bright colors in one chart

```typescript
// Example: IRR Over Time (correct implementation)
<LineChart data={irrData} margin={chartDefaults.margin}>
  <CartesianGrid {...chartDefaults.grid} />
  <XAxis dataKey="quarter" {...chartDefaults.xAxis} />
  <YAxis {...chartDefaults.yAxis} tickFormatter={(v) => `${v}%`} />
  <Line 
    type="monotone"
    dataKey="irr"
    stroke="#334155"
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 4, fill: "#334155" }}
  />
  <Tooltip {...chartDefaults.tooltip} />
</LineChart>
```

### Status Badges

Use muted colors that don't distract from the data:

```typescript
const STAGE_STYLES: Record<DealStage, string> = {
  INITIAL_REVIEW: "bg-slate-100 text-slate-700 border-slate-200",
  FIRST_MEETING: "bg-slate-100 text-slate-700 border-slate-200",
  ANALYSIS: "bg-slate-200 text-slate-800 border-slate-300",
  MANAGEMENT_MEETING: "bg-slate-200 text-slate-800 border-slate-300",
  LOI_SUBMITTED: "bg-slate-300 text-slate-900 border-slate-400",
  LOI_NEGOTIATION: "bg-slate-300 text-slate-900 border-slate-400",
  DUE_DILIGENCE: "bg-slate-700 text-white border-slate-800",
  CLOSING: "bg-slate-700 text-white border-slate-800",
  CLOSED_WON: "bg-slate-900 text-white border-slate-950",
  PASSED: "bg-slate-100 text-slate-400 border-slate-200",
  DEAD: "bg-slate-100 text-slate-400 border-slate-200",
};

function StageBadge({ stage }: { stage: DealStage }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border",
      STAGE_STYLES[stage]
    )}>
      {STAGE_LABELS[stage]}
    </span>
  );
}
```

---

## 8. Testing Guidelines

Write tests for:

1. **Business logic** (services, calculations)
2. **API routes** (integration tests)
3. **Critical user flows** (E2E with Playwright)

```typescript
// tests/unit/calculations/waterfall.test.ts
import { describe, it, expect } from 'vitest';
import { calculateWaterfall } from '@/lib/calculations/waterfall';

describe('calculateWaterfall', () => {
  it('should return all to return of capital when amount < contributions', () => {
    const result = calculateWaterfall(
      50000,   // distribution
      100000,  // contributions
      0,       // prior distributions
      0.08,    // hurdle
      0.20,    // carry
      1.0,     // catch-up
      1        // years
    );
    
    expect(result.returnOfCapital).toBe(50000);
    expect(result.preferredReturn).toBe(0);
    expect(result.carriedInterest).toBe(0);
  });

  it('should calculate preferred return after ROC', () => {
    const result = calculateWaterfall(
      120000,  // distribution
      100000,  // contributions
      0,       // prior distributions
      0.08,    // hurdle
      0.20,    // carry
      1.0,     // catch-up
      1        // years
    );
    
    expect(result.returnOfCapital).toBe(100000);
    expect(result.preferredReturn).toBe(8000); // 8% of 100k
    expect(result.carriedInterest).toBeGreaterThan(0);
  });
});
```

---

## 9. Common Mistakes to Avoid

1. **Don't store derived data** - Calculate ownership %, margins, multiples dynamically
2. **Don't forget fund access checks** - Always verify user has access to the fund
3. **Don't skip validation** - Always validate with Zod before database operations
4. **Don't forget audit logs** - Log all CREATE, UPDATE, DELETE operations
5. **Don't use `any` type** - Define proper TypeScript types
6. **Don't forget loading/error states** - Every async operation needs them
7. **Don't hardcode values** - Use environment variables for configuration
8. **Don't forget mobile** - Test responsive behavior

---

## 10. Quick Reference

### Key Files to Reference

| Need | File |
|------|------|
| Database schema | `02_PRD_Schema.md` |
| Deal requirements | `03_Module_Deals.md` |
| Investor requirements | `04_Module_Investors.md` |
| Portfolio requirements | `05_Module_Portfolio.md` |
| Capital operations | `06_Module_Capital.md` |
| Reports | `07_Module_Reports.md` |
| Business rules | `08_Business_Rules.md` |

### Key Commands

```bash
# Database
npx prisma migrate dev --name <name>  # Create migration
npx prisma generate                    # Generate client
npx prisma studio                      # Open Prisma Studio

# Development
pnpm dev                               # Start dev server
pnpm build                             # Build for production
pnpm test                              # Run tests
pnpm lint                              # Run linter

# shadcn/ui
npx shadcn@latest add <component>      # Add component
```

---

## 11. Questions to Ask Yourself

Before implementing any feature:

1. What business rule governs this? (Check `08_Business_Rules.md`)
2. What permissions are required? (Check RBAC table)
3. What should be logged to audit? (Always log mutations)
4. What validation is needed? (Check validation schemas)
5. What happens on error? (Always handle gracefully)
6. What's the mobile experience? (Always test responsive)
