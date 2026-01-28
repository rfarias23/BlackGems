# BlackGem - Portfolio Management Module

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.0 |
| Related To | 02_PRD_Schema.md, 03_Module_Deals.md |

---

## 1. Module Overview

The Portfolio Management module tracks acquired companies from the moment a deal closes through exit. It provides tools for financial monitoring, KPI tracking, valuation management, strategic initiatives, and board meeting coordination. This module is the operational heart of the platform during the 3-7+ year operating phase.

---

## 2. User Stories

### 2.1 Fund Manager Perspective

**As a Fund Principal (also typically the CEO), I want to:**
- Convert a closed deal into a portfolio company automatically
- Track monthly/quarterly financial performance against budget
- Monitor key performance indicators (KPIs) relevant to my business
- Document strategic initiatives and track their progress
- Prepare for and document board meetings
- Track company valuation over time with supporting methodology
- Plan and execute an eventual exit

### 2.2 Analyst/Admin Perspective

**As an Analyst, I want to:**
- Enter monthly financial data efficiently
- Upload supporting documents and reports
- Track action items from board meetings
- Generate financial reports and charts

---

## 3. Features & Screens

### 3.1 Portfolio Overview

The overview shows all portfolio companies (typically 1 for a traditional search fund, but the system supports multiple for holding company structures).

**Wireframe - Portfolio Overview:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PORTFOLIO                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ AGGREGATE METRICS (All Portfolio Companies)                                 │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ TOTAL EQUITY  │ │ CURRENT VALUE │ │ AGGREGATE     │ │ WEIGHTED      │    │
│ │ INVESTED      │ │               │ │ REVENUE (LTM) │ │ MOIC          │    │
│ │ $2,100,000    │ │ $3,450,000    │ │ $8,200,000    │ │ 1.64x         │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ABC MANUFACTURING CO                                          [Active] ││
│ │ Industrial Equipment │ Chicago, IL                                      ││
│ │                                                                         ││
│ │ Acquired: Mar 1, 2026    │  Equity: $2.1M    │  Ownership: 85%          ││
│ │                                                                         ││
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        ││
│ │ │ Revenue LTM │ │ EBITDA LTM  │ │ Valuation   │ │ MOIC        │        ││
│ │ │ $8.2M       │ │ $1.52M      │ │ $9.2M       │ │ 1.64x       │        ││
│ │ │ +12% YoY    │ │ +18% YoY    │ │ as of Q4'25 │ │             │        ││
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        ││
│ │                                                                         ││
│ │ [Revenue Trend Chart - Last 12 Months]                                  ││
│ │ ████▌████▌████▌████▌█████▌█████▌█████▌██████▌██████▌██████▌            ││
│ │                                                                         ││
│ │                                                        [View Details →] ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Portfolio Company Detail View

**Layout Sections:**

1. **Header**
   - Company name, industry, location
   - Status indicator (Active, Underperforming, etc.)
   - Quick actions: Edit, Add Financial Data, Record Valuation
   - Navigation tabs: Overview, Financials, KPIs, Initiatives, Board, Documents

2. **Overview Tab**
   - Investment summary card (acquisition details, ownership)
   - Current valuation card
   - Key metrics dashboard
   - Recent activity
   - Upcoming board meeting

3. **Financials Tab**
   - Period selector (Monthly/Quarterly/Annual)
   - Actual vs Budget toggle
   - Financial data table (Income Statement format)
   - Trend charts (Revenue, EBITDA, Margins)
   - Add/Edit financial data modal

4. **KPIs Tab**
   - KPI dashboard with cards for each metric
   - Target vs Actual visualization
   - Trend charts per KPI
   - Add/Edit KPI modal

5. **Initiatives Tab**
   - Strategic initiatives list
   - Status filter (Planned, In Progress, Completed)
   - Priority sorting
   - Progress indicators
   - Add/Edit initiative modal

6. **Board Tab**
   - Upcoming meetings
   - Past meetings with minutes
   - Action items tracker
   - Board materials documents
   - Schedule meeting modal

7. **Documents Tab**
   - Categorized document list
   - Upload functionality
   - Filtering by type

**Wireframe - Company Financials:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ABC MANUFACTURING CO                                                        │
│ [Overview] [Financials] [KPIs] [Initiatives] [Board] [Documents]            │
├─────────────────────────────────────────────────────────────────────────────┤
│ FINANCIAL PERFORMANCE                                                       │
│                                                                             │
│ Period: [Monthly ▼]  View: [Actual ○ Budget ○ Variance]  [+ Add Data]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │            │ Jan 26  │ Feb 26  │ Mar 26  │ Apr 26  │ May 26  │ Jun 26  ││
│ ├────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤│
│ │ Revenue    │ $682K   │ $695K   │ $710K   │ $705K   │ $720K   │ $735K   ││
│ │ COGS       │ $392K   │ $398K   │ $405K   │ $401K   │ $408K   │ $415K   ││
│ │ Gross Prof │ $290K   │ $297K   │ $305K   │ $304K   │ $312K   │ $320K   ││
│ │ Gross Marg │ 42.5%   │ 42.7%   │ 43.0%   │ 43.1%   │ 43.3%   │ 43.5%   ││
│ │ OpEx       │ $175K   │ $178K   │ $180K   │ $182K   │ $185K   │ $188K   ││
│ │ EBITDA     │ $115K   │ $119K   │ $125K   │ $122K   │ $127K   │ $132K   ││
│ │ EBITDA Mrg │ 16.9%   │ 17.1%   │ 17.6%   │ 17.3%   │ 17.6%   │ 18.0%   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌──────────────────────────────────┐ ┌──────────────────────────────────┐  │
│ │ REVENUE TREND                    │ │ EBITDA & MARGIN                  │  │
│ │                                  │ │                                  │  │
│ │ $800K ┤                     ●    │ │ $150K ┤                     ●    │  │
│ │ $750K ┤                 ●──      │ │ $125K ┤              ●──●──      │  │
│ │ $700K ┤        ●───●───●         │ │ $100K ┤     ●───●───●            │  │
│ │ $650K ┤   ●────┘                 │ │  $75K ┤                          │  │
│ │ $600K ┼───────────────────────── │ │  $50K ┼────────────────────────  │  │
│ │       Jan Feb Mar Apr May Jun    │ │       Jan Feb Mar Apr May Jun    │  │
│ └──────────────────────────────────┘ └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Deal to Portfolio Conversion

When a deal reaches status `WON` and stage `CLOSED`, a modal prompts the user to convert it to a portfolio company.

**Conversion Flow:**
1. User closes deal (sets stage to CLOSED)
2. System prompts: "Convert to Portfolio Company?"
3. Modal shows pre-filled data from deal
4. User confirms/adjusts acquisition details
5. Portfolio Company created with link to source deal
6. Fund status updated to `ACQUIRED` (if first portfolio company)

**Wireframe - Conversion Modal:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Convert Deal to Portfolio Company                                      [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Congratulations on closing ABC Manufacturing!                               │
│                                                                             │
│ Please confirm the acquisition details:                                     │
│                                                                             │
│ COMPANY INFORMATION (from deal)                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Company Name       [ABC Manufacturing Co                              ] ││
│ │ Legal Name         [ABC Manufacturing, LLC                            ] ││
│ │ Industry           [Industrial Equipment                              ] ││
│ │ Website            [www.abcmfg.com                                    ] ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ACQUISITION DETAILS                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Acquisition Date   [March 1, 2026                     ] 📅              ││
│ │ Acquisition Price  [$7,300,000                        ] (Enterprise Val)││
│ │ Equity Invested    [$2,100,000                        ] (from fund)     ││
│ │ Debt Used          [$4,500,000                        ] (acquisition)   ││
│ │ Seller Note        [$700,000                          ] (if any)        ││
│ │ Ownership %        [85.0%                             ]                 ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ⓘ This will also update the fund status to "Acquired"                      │
│                                                                             │
│                                         [Cancel]  [Create Portfolio Company]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Valuation Management

Track company valuations over time with supporting methodology and documentation.

**Wireframe - Valuation History:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VALUATION HISTORY                                       [+ Record Valuation]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CURRENT VALUATION                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Enterprise Value: $9,200,000         Method: EBITDA Multiple            ││
│ │ As of: December 31, 2025             Multiple: 6.0x LTM EBITDA          ││
│ │ Prepared by: Fund Manager            Status: Official (for LP reporting)││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ VALUATION CHART                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ $10M ┤                                                         ●        ││
│ │  $9M ┤                                              ●─────────●         ││
│ │  $8M ┤                            ●────────●────────┘                   ││
│ │  $7M ┤●────────●────────●────────●                                      ││
│ │  $6M ┼─────────────────────────────────────────────────────────────     ││
│ │      Q1'26    Q2'26    Q3'26    Q4'26    Q1'27    Q2'27    Q3'27        ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ HISTORY                                                                     │
│ ┌───────────┬────────────┬─────────────────────┬──────────┬───────────────┐│
│ │ Date      │ Value      │ Method              │ Official │ Prepared By   ││
│ ├───────────┼────────────┼─────────────────────┼──────────┼───────────────┤│
│ │ Dec 31 25 │ $9,200,000 │ EBITDA Multiple     │ Yes      │ Fund Manager  ││
│ │ Sep 30 25 │ $8,800,000 │ EBITDA Multiple     │ Yes      │ Fund Manager  ││
│ │ Jun 30 25 │ $8,100,000 │ Comparable Trans.   │ Yes      │ Third Party   ││
│ │ Mar 1 25  │ $7,300,000 │ Cost Basis          │ Yes      │ Fund Manager  ││
│ └───────────┴────────────┴─────────────────────┴──────────┴───────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Endpoints

### 4.1 Portfolio Company CRUD

```
GET    /api/portfolio
       Query params: fundId, status, page, limit
       Response: { companies: PortfolioCompany[], total: number, aggregate: AggregateMetrics }

POST   /api/portfolio
       Body: CreatePortfolioCompanyInput
       Response: PortfolioCompany
       Note: Usually called via deal conversion

GET    /api/portfolio/:id
       Response: PortfolioCompany (with current valuation, latest financials)

PUT    /api/portfolio/:id
       Body: UpdatePortfolioCompanyInput
       Response: PortfolioCompany

POST   /api/deals/:dealId/convert-to-portfolio
       Body: ConvertToPortfolioInput
       Response: PortfolioCompany
       Note: Creates portfolio company from closed deal
```

### 4.2 Financial Data

```
GET    /api/portfolio/:id/financials
       Query params: periodType, startDate, endDate, isActual
       Response: PortfolioFinancial[]

POST   /api/portfolio/:id/financials
       Body: CreateFinancialInput
       Response: PortfolioFinancial

PUT    /api/portfolio/:id/financials/:financialId
       Body: UpdateFinancialInput
       Response: PortfolioFinancial

DELETE /api/portfolio/:id/financials/:financialId
       Response: { success: true }

GET    /api/portfolio/:id/financials/summary
       Query params: periodType, periods (e.g., 12 for LTM)
       Response: { 
         ltmRevenue, ltmEbitda, revenueGrowth, ebitdaMargin,
         trend: { period, revenue, ebitda }[]
       }
```

### 4.3 KPIs

```
GET    /api/portfolio/:id/kpis
       Query params: category, startDate, endDate
       Response: PortfolioKPI[]

POST   /api/portfolio/:id/kpis
       Body: CreateKPIInput
       Response: PortfolioKPI

PUT    /api/portfolio/:id/kpis/:kpiId
       Body: UpdateKPIInput
       Response: PortfolioKPI

GET    /api/portfolio/:id/kpis/definitions
       Response: { name, category, unit, description }[]
       Note: Returns unique KPI names used for this company
```

### 4.4 Valuations

```
GET    /api/portfolio/:id/valuations
       Response: Valuation[]

POST   /api/portfolio/:id/valuations
       Body: CreateValuationInput
       Response: Valuation

GET    /api/portfolio/:id/valuations/current
       Response: Valuation (latest official valuation)

PUT    /api/portfolio/:id/valuations/:valuationId
       Body: UpdateValuationInput
       Response: Valuation
```

### 4.5 Strategic Initiatives

```
GET    /api/portfolio/:id/initiatives
       Query params: status, category, priority
       Response: StrategicInitiative[]

POST   /api/portfolio/:id/initiatives
       Body: CreateInitiativeInput
       Response: StrategicInitiative

PUT    /api/portfolio/:id/initiatives/:initiativeId
       Body: UpdateInitiativeInput
       Response: StrategicInitiative

DELETE /api/portfolio/:id/initiatives/:initiativeId
       Response: { success: true }
```

### 4.6 Board Meetings

```
GET    /api/portfolio/:id/board-meetings
       Query params: upcoming, past, limit
       Response: BoardMeeting[]

POST   /api/portfolio/:id/board-meetings
       Body: CreateBoardMeetingInput
       Response: BoardMeeting

GET    /api/portfolio/:id/board-meetings/:meetingId
       Response: BoardMeeting (with documents, action items)

PUT    /api/portfolio/:id/board-meetings/:meetingId
       Body: UpdateBoardMeetingInput
       Response: BoardMeeting
```

---

## 5. Component Structure

```
src/components/portfolio/
├── portfolio-overview/
│   ├── portfolio-list.tsx
│   ├── portfolio-aggregate-metrics.tsx
│   └── company-summary-card.tsx
├── company-detail/
│   ├── company-header.tsx
│   ├── company-overview.tsx
│   ├── investment-summary-card.tsx
│   ├── current-valuation-card.tsx
│   ├── financials-tab.tsx
│   ├── financials-table.tsx
│   ├── financials-charts.tsx
│   ├── financial-form.tsx
│   ├── kpis-tab.tsx
│   ├── kpi-dashboard.tsx
│   ├── kpi-card.tsx
│   ├── kpi-form.tsx
│   ├── initiatives-tab.tsx
│   ├── initiative-list.tsx
│   ├── initiative-card.tsx
│   ├── initiative-form.tsx
│   ├── board-tab.tsx
│   ├── board-meeting-list.tsx
│   ├── board-meeting-card.tsx
│   └── board-meeting-form.tsx
├── valuation/
│   ├── valuation-history.tsx
│   ├── valuation-chart.tsx
│   ├── valuation-form.tsx
│   └── valuation-card.tsx
├── conversion/
│   └── deal-to-portfolio-modal.tsx
└── shared/
    ├── status-badge.tsx
    ├── financial-metric.tsx
    └── trend-indicator.tsx
```

---

## 6. Financial Calculations

```typescript
// lib/calculations/portfolio.ts

/**
 * Calculate LTM (Last Twelve Months) financials
 */
export function calculateLTM(financials: PortfolioFinancial[]): LTMFinancials {
  // Sort by period descending
  const sorted = financials
    .filter(f => f.periodType === 'MONTHLY' && f.isActual)
    .sort((a, b) => b.period.getTime() - a.period.getTime())
    .slice(0, 12);
  
  if (sorted.length < 12) {
    // Not enough data for full LTM
    return null;
  }
  
  return {
    revenue: sum(sorted, 'revenue'),
    ebitda: sum(sorted, 'ebitda'),
    grossProfit: sum(sorted, 'grossProfit'),
    netIncome: sum(sorted, 'netIncome'),
    grossMargin: sum(sorted, 'grossProfit') / sum(sorted, 'revenue'),
    ebitdaMargin: sum(sorted, 'ebitda') / sum(sorted, 'revenue'),
  };
}

/**
 * Calculate YoY (Year-over-Year) growth
 */
export function calculateYoYGrowth(
  currentPeriodValue: number,
  priorYearPeriodValue: number
): number {
  if (priorYearPeriodValue === 0) return null;
  return (currentPeriodValue - priorYearPeriodValue) / priorYearPeriodValue;
}

/**
 * Calculate MOIC for a portfolio company
 */
export function calculateCompanyMOIC(
  currentValuation: number,
  distributions: number,
  equityInvested: number,
  ownershipPct: number
): number {
  const currentEquityValue = currentValuation * ownershipPct;
  return (currentEquityValue + distributions) / equityInvested;
}
```

---

## 7. Validation Schemas

```typescript
// lib/validations/portfolio.ts

export const convertToPortfolioSchema = z.object({
  // Pre-filled from deal
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  
  // Acquisition details - required
  acquisitionDate: z.date(),
  acquisitionPrice: z.number().positive('Acquisition price is required'),
  equityInvested: z.number().positive('Equity invested is required'),
  ownershipPct: z.number().min(0).max(1),
  
  // Optional acquisition details
  debtUsed: z.number().min(0).default(0),
  sellerNote: z.number().min(0).default(0),
  earnout: z.number().min(0).default(0),
  workingCapital: z.number().optional(),
});

export const createFinancialSchema = z.object({
  period: z.date(),
  periodType: z.nativeEnum(PeriodType),
  isActual: z.boolean().default(true),
  
  // Income statement - revenue required, others optional
  revenue: z.number(),
  cogs: z.number().optional(),
  grossProfit: z.number().optional(),
  opex: z.number().optional(),
  ebitda: z.number().optional(),
  depreciation: z.number().optional(),
  amortization: z.number().optional(),
  interestExp: z.number().optional(),
  taxExpense: z.number().optional(),
  netIncome: z.number().optional(),
  
  // Balance sheet - all optional
  cash: z.number().optional(),
  accountsRecv: z.number().optional(),
  inventory: z.number().optional(),
  totalAssets: z.number().optional(),
  accountsPay: z.number().optional(),
  totalDebt: z.number().optional(),
  equity: z.number().optional(),
  
  notes: z.string().max(2000).optional(),
});

export const createValuationSchema = z.object({
  date: z.date(),
  value: z.number().positive('Valuation must be positive'),
  equityValue: z.number().positive().optional(),
  methodology: z.nativeEnum(ValuationMethod),
  
  // Multiples
  revenueMultiple: z.number().positive().optional(),
  ebitdaMultiple: z.number().positive().optional(),
  
  // Assumptions stored as JSON
  assumptions: z.record(z.unknown()).optional(),
  
  // Process
  preparedBy: z.string().max(200).optional(),
  reviewedBy: z.string().max(200).optional(),
  isOfficial: z.boolean().default(false),
  notes: z.string().max(5000).optional(),
});

export const createInitiativeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.nativeEnum(InitiativeCategory),
  priority: z.number().int().min(1).max(5).default(3),
  owner: z.string().max(200).optional(),
  sponsor: z.string().max(200).optional(),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
  expectedImpact: z.string().max(2000).optional(),
  estimatedValue: z.number().optional(),
});
```

---

## 8. Related Documents

- `02_PRD_Schema.md` - Database models for PortfolioCompany, PortfolioFinancial, Valuation, etc.
- `03_Module_Deals.md` - Deal conversion flow
- `06_Module_Capital.md` - How valuations affect capital accounts
- `07_Module_Reports.md` - Portfolio data in investor reports
