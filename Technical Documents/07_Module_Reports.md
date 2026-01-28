# BlackGem - Reporting Module

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.0 |
| Related To | 02_PRD_Schema.md |

---

## 1. Module Overview

The Reports module generates investor communications and fund performance reports. This includes quarterly investor updates, capital call/distribution notices, K-1 preparation support, and performance analytics dashboards. The module emphasizes automation while allowing customization.

---

## 2. User Stories

**As a Fund Manager, I want to:**
- Generate quarterly investor updates with consistent formatting
- Include fund performance metrics (IRR, MOIC) in reports
- Distribute reports to all LPs with one click
- Track which LPs have viewed their reports
- Export data for tax preparation (K-1 support)
- Create ad-hoc reports as needed

**As an LP (via portal), I want to:**
- Access my quarterly reports and past communications
- Download tax documents when available
- See my personal performance metrics

---

## 3. Features & Screens

### 3.1 Reports Dashboard

**Wireframe - Reports Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REPORTS & COMMUNICATIONS                              [+ Create New Report] │
├─────────────────────────────────────────────────────────────────────────────┤
│ QUICK ACTIONS                                                               │
│ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐       │
│ │ 📄 Quarterly Update │ │ 📊 Fund Performance│ │ 📑 Capital Statement│       │
│ │ Generate Q4 2025   │ │ View Dashboard     │ │ Generate for LPs   │       │
│ └────────────────────┘ └────────────────────┘ └────────────────────┘       │
├─────────────────────────────────────────────────────────────────────────────┤
│ RECENT REPORTS                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Type             │ Title                │ Period   │ Status  │ Actions  ││
│ ├──────────────────┼──────────────────────┼──────────┼─────────┼──────────┤│
│ │ Quarterly Update │ Q4 2025 Investor Ltr │ Q4 2025  │ Sent    │ View     ││
│ │ Quarterly Update │ Q3 2025 Investor Ltr │ Q3 2025  │ Sent    │ View     ││
│ │ Capital Call     │ Call #3 Notice       │ Feb 2026 │ Sent    │ View     ││
│ │ K-1 Package      │ 2025 Tax Documents   │ 2025     │ Draft   │ Edit     ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ FUND PERFORMANCE SNAPSHOT                                                   │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ GROSS IRR     │ │ NET IRR       │ │ GROSS MOIC    │ │ NET MOIC      │    │
│ │ 24.5%         │ │ 18.2%         │ │ 1.72x         │ │ 1.58x         │    │
│ │ Since Incept. │ │ Since Incept. │ │               │ │               │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Quarterly Update Builder

The quarterly update is a templated report that can be customized for each period.

**Sections (Typical):**
1. Letter from the Principal(s)
2. Fund Summary (Status, NAV, Performance)
3. Portfolio Company Updates
4. Financial Summary
5. Capital Account Summary (per LP, in individual notices)
6. Looking Ahead

**Wireframe - Quarterly Update Builder:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Quarterly Investor Update                                              [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Period: [Q4 2025 ▼]                          Status: Draft                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ SECTIONS                                           [+ Add Section]      ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │ ≡ 1. Letter from the Principals                              [Edit] [↕]││
│ │      Preview: "Dear Partners, We are pleased to report..."             ││
│ │                                                                         ││
│ │ ≡ 2. Fund Summary                                   [Auto-generated] [↕]││
│ │      • Status: Acquired                                                 ││
│ │      • NAV: $3,450,000                                                  ││
│ │      • Gross IRR: 24.5%                                                 ││
│ │                                                                         ││
│ │ ≡ 3. Portfolio Update: ABC Manufacturing                     [Edit] [↕]││
│ │      Preview: "ABC Manufacturing had an excellent quarter..."          ││
│ │                                                                         ││
│ │ ≡ 4. Financial Highlights                           [Auto-generated] [↕]││
│ │      Revenue, EBITDA, Margins chart                                     ││
│ │                                                                         ││
│ │ ≡ 5. Looking Ahead                                           [Edit] [↕]││
│ │      Preview: "In 2026, we plan to focus on..."                        ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ DISTRIBUTION                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Recipients: All Active LPs (14)                                         ││
│ │ Include individual capital account statement: [✓]                       ││
│ │ Delivery method: Email with PDF attachment                              ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                      [Save Draft]  [Preview PDF]  [Approve & Send to LPs]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Fund Performance Dashboard

Interactive dashboard showing key fund metrics over time.

**Wireframe - Performance Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FUND PERFORMANCE                                        As of Dec 31, 2025  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ KEY METRICS                                                                 │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ GROSS IRR     │ │ NET IRR       │ │ GROSS MOIC    │ │ NET MOIC      │    │
│ │ 24.5%         │ │ 18.2%         │ │ 1.72x         │ │ 1.58x         │    │
│ │ ▲ 2.3% vs Q3  │ │ ▲ 1.8% vs Q3  │ │ ▲ 0.12x vs Q3 │ │ ▲ 0.10x vs Q3 │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                             │
│ CAPITAL SUMMARY                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Committed Capital          $1,250,000                                   ││
│ │ Called Capital             $350,000      ████████░░░░░░░░ 28%           ││
│ │ Distributions              $0            ░░░░░░░░░░░░░░░░ 0%            ││
│ │ Current NAV                $3,450,000                                   ││
│ │ Total Value (NAV + Dist)   $3,450,000                                   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ NAV PROGRESSION                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ $4M ┤                                                     ●             ││
│ │ $3M ┤                              ●────────●────────●────┘             ││
│ │ $2M ┤         ●────────●───────────┘                                    ││
│ │ $1M ┤         │                                                         ││
│ │  $0 ┼─────────┴───────────────────────────────────────────────          ││
│ │     Acq      Q1'26    Q2'26    Q3'26    Q4'26    Q1'27                  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ IRR & MOIC TREND                                            [Export Data]  │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │      │ Q1'26  │ Q2'26  │ Q3'26  │ Q4'26  │ Current                      ││
│ │ IRR  │ 8.2%   │ 15.1%  │ 22.2%  │ 24.5%  │ 24.5%                        ││
│ │ MOIC │ 1.08x  │ 1.32x  │ 1.60x  │ 1.72x  │ 1.72x                        ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 LP Capital Account Statement

Individual statement generated for each LP showing their personal capital account activity.

**Wireframe - Capital Account Statement:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           XYZ SEARCH FUND, LP                               │
│                        CAPITAL ACCOUNT STATEMENT                            │
│                                                                             │
│                          Smith Family Office                                │
│                     Period Ending: December 31, 2025                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ACCOUNT SUMMARY                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Capital Commitment                                        $200,000.00   ││
│ │ Ownership Percentage                                           16.00%   ││
│ │                                                                         ││
│ │ Contributed Capital                                        $56,000.00   ││
│ │ Unfunded Commitment                                       $144,000.00   ││
│ │                                                                         ││
│ │ Current NAV (as of 12/31/25)                              $58,800.00   ││
│ │ Cumulative Distributions                                       $0.00   ││
│ │ Total Value                                                $58,800.00   ││
│ │                                                                         ││
│ │ MOIC                                                            1.05x   ││
│ │ IRR (Since First Contribution)                                  8.2%   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ TRANSACTION HISTORY                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Date       │ Description                    │ Amount      │ Balance    ││
│ ├────────────┼────────────────────────────────┼─────────────┼────────────┤│
│ │ 10/01/25   │ Capital Call #1                │ +$16,000.00 │ $16,000.00 ││
│ │ 10/15/25   │ Management Fee - Q4 2025       │ -$500.00    │ $15,500.00 ││
│ │ 01/15/26   │ Capital Call #2                │ +$24,000.00 │ $39,500.00 ││
│ │ 02/15/26   │ Capital Call #3                │ +$16,000.00 │ $55,500.00 ││
│ │ 03/31/26   │ Q1 Valuation Adjustment        │ +$3,300.00  │ $58,800.00 ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ This statement is provided for informational purposes only and does not    │
│ constitute tax advice. Please consult your tax advisor.                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Endpoints

### 4.1 Reports CRUD

```
GET    /api/reports
       Query params: fundId, type, status, startDate, endDate, page, limit
       Response: { reports: Report[], total: number }

POST   /api/reports
       Body: CreateReportInput
       Response: Report

GET    /api/reports/:id
       Response: Report (with content)

PUT    /api/reports/:id
       Body: UpdateReportInput
       Response: Report

DELETE /api/reports/:id
       Response: { success: true }
       Note: Only allowed if status is DRAFT
```

### 4.2 Report Generation

```
POST   /api/reports/generate/quarterly-update
       Body: { fundId: string, period: { year: number, quarter: number } }
       Response: Report (draft with auto-populated content)

POST   /api/reports/generate/capital-statement
       Body: { fundId: string, investorId?: string, asOfDate: Date }
       Response: Report or PDF (if single investor)

POST   /api/reports/:id/preview
       Response: PDF file (preview)

POST   /api/reports/:id/approve
       Body: { publishedBy: string }
       Response: Report (status updated to APPROVED)
```

### 4.3 Report Distribution

```
POST   /api/reports/:id/distribute
       Body: { 
         recipientIds?: string[], // If empty, all active LPs
         includeCapitalStatement: boolean,
         emailSubject?: string,
         emailBody?: string 
       }
       Response: { 
         success: true, 
         sentCount: number, 
         sentAt: Date 
       }
       Side effects: 
         - Generates personalized PDFs
         - Sends emails
         - Updates report status to PUBLISHED
         - Logs distribution
```

### 4.4 Performance Metrics

```
GET    /api/funds/:fundId/performance
       Query params: asOfDate
       Response: {
         grossIRR: number,
         netIRR: number,
         grossMOIC: number,
         netMOIC: number,
         totalCommitted: number,
         totalCalled: number,
         totalDistributed: number,
         currentNAV: number,
         totalValue: number
       }

GET    /api/funds/:fundId/performance/history
       Query params: startDate, endDate, frequency (monthly|quarterly)
       Response: {
         periods: {
           date: Date,
           nav: number,
           irr: number,
           moic: number
         }[]
       }

GET    /api/funds/:fundId/performance/cashflows
       Response: {
         cashflows: {
           date: Date,
           type: 'contribution' | 'distribution',
           amount: number
         }[]
       }
       Note: Used for IRR calculation verification
```

### 4.5 Tax Support

```
GET    /api/funds/:fundId/tax/k1-data
       Query params: taxYear
       Response: {
         investors: {
           id: string,
           name: string,
           tin: string,
           address: string,
           allocations: {
             ordinaryIncome: number,
             capitalGains: number,
             // ... other K-1 line items
           }
         }[]
       }

POST   /api/funds/:fundId/tax/export
       Body: { taxYear: number, format: 'csv' | 'xlsx' }
       Response: File download
```

---

## 5. IRR & MOIC Calculations

```typescript
// lib/calculations/performance.ts

/**
 * Calculate Internal Rate of Return (IRR)
 * Uses Newton-Raphson method for numerical approximation
 */
export function calculateIRR(cashflows: CashFlow[], precision = 0.0001): number {
  // Cashflows: negative = contribution, positive = distribution/NAV
  // Must have at least one negative and one positive
  
  const hasNegative = cashflows.some(cf => cf.amount < 0);
  const hasPositive = cashflows.some(cf => cf.amount > 0);
  
  if (!hasNegative || !hasPositive) {
    return null; // Cannot calculate IRR
  }
  
  // Sort by date
  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Convert dates to years from first cashflow
  const firstDate = sorted[0].date;
  const yearFractions = sorted.map(cf => {
    const diffMs = cf.date.getTime() - firstDate.getTime();
    return diffMs / (365.25 * 24 * 60 * 60 * 1000);
  });
  
  // Newton-Raphson iteration
  let rate = 0.1; // Initial guess: 10%
  
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let j = 0; j < sorted.length; j++) {
      const t = yearFractions[j];
      const amount = sorted[j].amount;
      const discountFactor = Math.pow(1 + rate, -t);
      
      npv += amount * discountFactor;
      derivative -= t * amount * Math.pow(1 + rate, -t - 1);
    }
    
    if (Math.abs(npv) < precision) {
      return rate;
    }
    
    if (derivative === 0) {
      break; // Avoid division by zero
    }
    
    rate = rate - npv / derivative;
    
    // Bound the rate to reasonable values
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return rate;
}

/**
 * Calculate Multiple on Invested Capital (MOIC)
 */
export function calculateMOIC(
  totalContributions: number,
  totalDistributions: number,
  currentNAV: number
): number {
  if (totalContributions === 0) return 0;
  return (totalDistributions + currentNAV) / totalContributions;
}

/**
 * Calculate Net IRR (after fees and carry)
 */
export function calculateNetIRR(
  cashflows: CashFlow[],
  managementFeeRate: number,
  carriedInterest: number
): number {
  // Adjust cashflows for fees
  const netCashflows = cashflows.map(cf => {
    if (cf.type === 'contribution') {
      // Add management fee to contribution
      return {
        ...cf,
        amount: cf.amount * (1 + managementFeeRate),
      };
    } else if (cf.type === 'distribution') {
      // Reduce distribution by carry (simplified)
      const profit = Math.max(0, cf.amount - cf.costBasis);
      const carry = profit * carriedInterest;
      return {
        ...cf,
        amount: cf.amount - carry,
      };
    }
    return cf;
  });
  
  return calculateIRR(netCashflows);
}

/**
 * Get fund cashflows for IRR calculation
 */
export async function getFundCashflows(fundId: string, asOfDate: Date): Promise<CashFlow[]> {
  const cashflows: CashFlow[] = [];
  
  // Get all capital contributions (negative cashflow)
  const contributions = await prisma.capitalTransaction.findMany({
    where: {
      fundId,
      type: 'CONTRIBUTION',
      date: { lte: asOfDate },
    },
  });
  
  contributions.forEach(c => {
    cashflows.push({
      date: c.date,
      amount: -Number(c.amount), // Negative = outflow from LP perspective
      type: 'contribution',
    });
  });
  
  // Get all distributions (positive cashflow)
  const distributions = await prisma.capitalTransaction.findMany({
    where: {
      fundId,
      type: 'DISTRIBUTION',
      date: { lte: asOfDate },
    },
  });
  
  distributions.forEach(d => {
    cashflows.push({
      date: d.date,
      amount: Number(d.amount), // Positive = inflow to LP
      type: 'distribution',
    });
  });
  
  // Add current NAV as terminal value
  const currentNAV = await getCurrentFundNAV(fundId, asOfDate);
  cashflows.push({
    date: asOfDate,
    amount: currentNAV,
    type: 'nav',
  });
  
  return cashflows;
}
```

---

## 6. Component Structure

```
src/components/reports/
├── reports-dashboard/
│   ├── reports-dashboard.tsx
│   ├── quick-actions.tsx
│   ├── recent-reports-table.tsx
│   └── performance-snapshot.tsx
├── quarterly-update/
│   ├── quarterly-update-builder.tsx
│   ├── section-editor.tsx
│   ├── section-preview.tsx
│   ├── distribution-settings.tsx
│   └── letter-editor.tsx
├── performance/
│   ├── performance-dashboard.tsx
│   ├── key-metrics-cards.tsx
│   ├── capital-summary.tsx
│   ├── nav-chart.tsx
│   ├── irr-moic-table.tsx
│   └── cashflow-table.tsx
├── capital-statement/
│   ├── capital-statement-generator.tsx
│   └── capital-statement-preview.tsx
├── tax/
│   ├── k1-data-export.tsx
│   └── tax-year-selector.tsx
└── shared/
    ├── report-status-badge.tsx
    ├── metric-card.tsx
    └── report-viewer.tsx
```

---

## 7. PDF Templates

Reports are generated as PDFs using `@react-pdf/renderer`. Templates are structured for consistency:

```typescript
// lib/pdf/quarterly-update.tsx

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

export function QuarterlyUpdatePDF({ fund, report, sections }: Props) {
  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.fundName}>{fund.name}</Text>
          <Text style={styles.reportTitle}>Quarterly Investor Update</Text>
          <Text style={styles.period}>{report.periodLabel}</Text>
        </View>
      </Page>
      
      {/* Content Pages */}
      {sections.map((section, index) => (
        <Page key={index} size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <Text>{fund.name}</Text>
            <Text>{report.periodLabel}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.type === 'text' && (
              <Text style={styles.body}>{section.content}</Text>
            )}
            {section.type === 'metrics' && (
              <MetricsSection data={section.data} />
            )}
            {section.type === 'chart' && (
              <Image src={section.chartImage} style={styles.chart} />
            )}
          </View>
          
          <View style={styles.footer}>
            <Text>Confidential - For Investor Use Only</Text>
            <Text>Page {index + 1}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
```

---

## 8. Validation Schemas

```typescript
// lib/validations/report.ts

export const createReportSchema = z.object({
  fundId: z.string().cuid(),
  type: z.nativeEnum(ReportType),
  title: z.string().min(1).max(200),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  content: z.record(z.unknown()).optional(), // JSON content
  notes: z.string().max(2000).optional(),
});

export const updateReportSchema = createReportSchema.partial().extend({
  status: z.nativeEnum(ReportStatus).optional(),
});

export const distributeReportSchema = z.object({
  recipientIds: z.array(z.string().cuid()).optional(),
  includeCapitalStatement: z.boolean().default(true),
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(5000).optional(),
});

export const generateQuarterlyUpdateSchema = z.object({
  fundId: z.string().cuid(),
  period: z.object({
    year: z.number().int().min(2020).max(2100),
    quarter: z.number().int().min(1).max(4),
  }),
});
```

---

## 9. Related Documents

- `02_PRD_Schema.md` - Report model
- `04_Module_Investors.md` - LP data for reports
- `05_Module_Portfolio.md` - Portfolio data for reports
- `06_Module_Capital.md` - Capital data for reports
