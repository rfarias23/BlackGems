# BlackGem - Capital Operations Module

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.0 |
| Related To | 02_PRD_Schema.md, 04_Module_Investors.md |

---

## 1. Module Overview

The Capital Management module handles the mechanics of moving money in and out of the fund: capital calls to bring in committed capital from LPs, and distributions to return proceeds. This module includes pro-rata calculations, waterfall distribution logic, notice generation, and complete transaction tracking.

---

## 2. User Stories

**As a Fund Manager, I want to:**
- Create capital calls with automatic pro-rata allocation to each LP
- Track payment status for each LP on each capital call
- Generate professional capital call notices (PDF)
- Calculate and execute distributions using the fund's waterfall
- Maintain a complete audit trail of all capital movements
- See unfunded commitments at a glance

**As an LP (via portal), I want to:**
- Receive capital call notices with clear payment instructions
- See my share of each capital call
- View my payment history and outstanding obligations
- Receive distribution notices with waterfall breakdown

---

## 3. Features & Screens

### 3.1 Capital Calls List

**Wireframe - Capital Calls:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAPITAL CALLS                                            [+ New Capital Call]│
├─────────────────────────────────────────────────────────────────────────────┤
│ SUMMARY                                                                     │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ TOTAL CALLED  │ │ TOTAL FUNDED  │ │ OUTSTANDING   │ │ UNFUNDED      │    │
│ │ $350,000      │ │ $325,000      │ │ $25,000       │ │ COMMITMENT    │    │
│ │               │ │ 93%           │ │               │ │ $900,000      │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Call # │ Date       │ Amount    │ Purpose              │ Status    │ Funded │
├────────┼────────────┼───────────┼──────────────────────┼───────────┼────────┤
│ 3      │ Feb 15, 26 │ $100,000  │ Acquisition - ABC    │ Partial   │ 75%    │
│ 2      │ Jan 15, 26 │ $150,000  │ Acquisition - ABC    │ Funded    │ 100%   │
│ 1      │ Oct 1, 25  │ $100,000  │ Search Capital       │ Funded    │ 100%   │
├────────┴────────────┴───────────┴──────────────────────┴───────────┴────────┤
│ Showing 3 capital calls                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Create Capital Call

**Flow:**
1. Enter total amount and purpose
2. System calculates pro-rata amounts for each LP based on commitments
3. Review allocation and adjust if needed
4. Set call date and due date
5. Generate notices (optional - can draft first)
6. Send notices to LPs

**Wireframe - Create Capital Call:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Create Capital Call                                                    [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CALL DETAILS                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Call Number        [4                           ] (auto-generated)      ││
│ │ Total Amount       [$75,000                     ]                       ││
│ │ Purpose            [Operating Expenses - Q2 2026                      ] ││
│ │ Call Date          [March 1, 2026               ] 📅                    ││
│ │ Due Date           [March 15, 2026              ] 📅                    ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ LP ALLOCATION (Pro-rata based on commitments)                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ LP Name              │ Commitment │ Ownership │ Called  │ Unfunded     ││
│ ├──────────────────────┼────────────┼───────────┼─────────┼──────────────┤│
│ │ John Anderson        │ $100,000   │ 8.0%      │ $6,000  │ $57,000  ✓  ││
│ │ Smith Family Office  │ $200,000   │ 16.0%     │ $12,000 │ $114,000 ✓  ││
│ │ Jane Williams        │ $75,000    │ 6.0%      │ $4,500  │ $42,750  ✓  ││
│ │ Acme Ventures        │ $300,000   │ 24.0%     │ $18,000 │ $171,000 ✓  ││
│ │ ...                  │ ...        │ ...       │ ...     │ ...         ││
│ ├──────────────────────┼────────────┼───────────┼─────────┼──────────────┤│
│ │ TOTAL                │ $1,250,000 │ 100.0%    │ $75,000 │              ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ⓘ Amounts calculated pro-rata. Edit individual amounts if needed.          │
│                                                                             │
│                               [Save as Draft]  [Create & Generate Notices]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Capital Call Detail

**Wireframe - Capital Call Detail:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Capital Calls                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Capital Call #3                                        [Partially Funded]   │
│ $100,000 for Acquisition - ABC Manufacturing                                │
│ Call Date: Feb 15, 2026  │  Due Date: Mar 1, 2026     [Edit] [Send Notices] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ FUNDING PROGRESS                                    $75,000 / $100,000 (75%)│
│ ████████████████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░   │
│                                                                             │
│ LP PAYMENTS                                                                 │
│ ┌───────────────────┬──────────┬──────────┬──────────┬────────────────────┐│
│ │ LP Name           │ Called   │ Paid     │ Status   │ Actions            ││
│ ├───────────────────┼──────────┼──────────┼──────────┼────────────────────┤│
│ │ John Anderson     │ $8,000   │ $8,000   │ ✓ Paid   │ [View]             ││
│ │ Smith Family Off  │ $16,000  │ $16,000  │ ✓ Paid   │ [View]             ││
│ │ Jane Williams     │ $6,000   │ $0       │ ○ Pending│ [Record Payment]   ││
│ │ Acme Ventures     │ $24,000  │ $24,000  │ ✓ Paid   │ [View]             ││
│ │ Bob Johnson       │ $10,000  │ $5,000   │ ◐ Partial│ [Record Payment]   ││
│ │ ...               │ ...      │ ...      │ ...      │ ...                ││
│ └───────────────────┴──────────┴──────────┴──────────┴────────────────────┘│
│                                                                             │
│ NOTICES                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ 📄 Capital_Call_3_Notice.pdf                   Generated: Feb 15, 2026  ││
│ │    Sent to 14 LPs on Feb 15, 2026              [Download] [Resend All]  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Distributions List & Detail

Similar structure to capital calls, but focused on money going out.

**Wireframe - Distributions:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DISTRIBUTIONS                                          [+ New Distribution] │
├─────────────────────────────────────────────────────────────────────────────┤
│ SUMMARY                                                                     │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ TOTAL         │ │ RETURN OF     │ │ PREFERRED     │ │ CARRIED       │    │
│ │ DISTRIBUTED   │ │ CAPITAL       │ │ RETURN        │ │ INTEREST      │    │
│ │ $500,000      │ │ $350,000      │ │ $120,000      │ │ $30,000       │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Dist # │ Date       │ Amount    │ Type              │ Source              │
├────────┼────────────┼───────────┼───────────────────┼─────────────────────┤
│ 1      │ Jun 30, 27 │ $500,000  │ Exit Proceeds     │ Sale of ABC Mfg     │
├────────┴────────────┴───────────┴───────────────────┴─────────────────────┤
│ Showing 1 distribution                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Create Distribution with Waterfall

**Wireframe - Create Distribution:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Create Distribution                                                    [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ DISTRIBUTION DETAILS                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Total Amount       [$500,000                    ]                       ││
│ │ Distribution Date  [June 30, 2027               ] 📅                    ││
│ │ Type               [Exit Proceeds              ▼]                       ││
│ │ Source             [Sale of ABC Manufacturing                         ] ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ WATERFALL CALCULATION                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Fund Terms: 8% Hurdle, 100% GP Catch-up to 20%, 80/20 LP/GP thereafter ││
│ │                                                                         ││
│ │ Step 1: Return of Capital                              $350,000         ││
│ │         (Total contributed capital not yet returned)                    ││
│ │                                                                         ││
│ │ Step 2: Preferred Return (8% annually)                 $84,000          ││
│ │         (On contributed capital for holding period)                     ││
│ │                                                                         ││
│ │ Step 3: GP Catch-up (to 20% of profits)               $33,000          ││
│ │         (100% to GP until 20% of total profits)                        ││
│ │                                                                         ││
│ │ Step 4: 80/20 Split                                    $33,000         ││
│ │         LP Share (80%):        $26,400                                  ││
│ │         GP Carried Interest:   $6,600                                   ││
│ │                                                        ─────────        ││
│ │ TOTAL                                                  $500,000         ││
│ │                                                                         ││
│ │ Summary:                                                                ││
│ │   To LPs (Return + Pref + Split):    $460,400  (92.1%)                 ││
│ │   To GP (Catch-up + Split):          $39,600   (7.9%)                  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ LP ALLOCATION (based on ownership %)                    [View Details]      │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ LP Name              │ Ownership │ Gross Dist │ Withhold │ Net Amount  ││
│ ├──────────────────────┼───────────┼────────────┼──────────┼─────────────┤│
│ │ John Anderson        │ 8.0%      │ $36,832    │ $0       │ $36,832     ││
│ │ Smith Family Office  │ 16.0%     │ $73,664    │ $0       │ $73,664     ││
│ │ Jane Williams        │ 6.0%      │ $27,624    │ $0       │ $27,624     ││
│ │ ...                  │ ...       │ ...        │ ...      │ ...         ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                              [Save as Draft]  [Create & Generate Notices]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Endpoints

### 4.1 Capital Calls

```
GET    /api/capital-calls
       Query params: fundId, status, page, limit
       Response: { 
         capitalCalls: CapitalCall[], 
         total: number,
         summary: { totalCalled, totalFunded, outstanding, unfundedCommitments }
       }

POST   /api/capital-calls
       Body: CreateCapitalCallInput
       Response: CapitalCall (with items)
       Side effects: Creates CapitalCallItems for each LP pro-rata

GET    /api/capital-calls/:id
       Response: CapitalCall (with items and LP details)

PUT    /api/capital-calls/:id
       Body: UpdateCapitalCallInput
       Response: CapitalCall

DELETE /api/capital-calls/:id
       Response: { success: true }
       Note: Only allowed if status is DRAFT

POST   /api/capital-calls/:id/send-notices
       Response: { success: true, sentCount: number }
       Side effects: Generates PDFs, sends emails, updates noticeSentAt

GET    /api/capital-calls/:id/notice-pdf
       Response: PDF file
```

### 4.2 Capital Call Items (Payments)

```
GET    /api/capital-calls/:id/items
       Response: CapitalCallItem[]

PATCH  /api/capital-calls/:id/items/:itemId/payment
       Body: { paidAmount: number, paidDate: Date, paymentMethod: string, paymentRef: string }
       Response: CapitalCallItem
       Side effects: 
         - Updates CapitalCallItem status
         - Creates CapitalTransaction
         - Updates CapitalCall status if all items paid
         - Recalculates fund currentSize
```

### 4.3 Distributions

```
GET    /api/distributions
       Query params: fundId, page, limit
       Response: { 
         distributions: Distribution[], 
         total: number,
         summary: { totalDistributed, returnOfCapital, preferredReturn, carriedInterest }
       }

POST   /api/distributions
       Body: CreateDistributionInput
       Response: Distribution (with items and waterfall breakdown)
       Side effects: 
         - Calculates waterfall
         - Creates DistributionItems for each LP
         - Creates CapitalTransactions

GET    /api/distributions/:id
       Response: Distribution (with items)

POST   /api/distributions/:id/send-notices
       Response: { success: true, sentCount: number }

GET    /api/distributions/:id/notice-pdf
       Response: PDF file
```

### 4.4 Waterfall Calculator

```
POST   /api/distributions/calculate-waterfall
       Body: { 
         fundId: string, 
         totalAmount: number,
         distributionDate: Date 
       }
       Response: WaterfallBreakdown
       Note: Preview calculation without creating distribution
```

### 4.5 Capital Transactions (Read-only audit trail)

```
GET    /api/capital-transactions
       Query params: fundId, investorId, type, startDate, endDate, page, limit
       Response: { transactions: CapitalTransaction[], total: number }

GET    /api/investors/:id/capital-transactions
       Query params: type, startDate, endDate
       Response: CapitalTransaction[]
```

---

## 5. Waterfall Calculation Logic

The waterfall determines how proceeds are split between LPs and GP. Here's the detailed calculation:

```typescript
// lib/calculations/waterfall.ts

interface WaterfallInput {
  totalAmount: number;              // Amount to distribute
  totalContributed: number;         // Total capital contributed by LPs
  totalDistributed: number;         // Total already distributed to LPs
  hurdleRate: number;               // e.g., 0.08 for 8%
  carriedInterest: number;          // e.g., 0.20 for 20%
  catchUpRate: number;              // e.g., 1.00 for 100% catch-up
  holdingPeriodYears: number;       // Time since first contribution
}

interface WaterfallResult {
  returnOfCapital: number;
  preferredReturn: number;
  gpCatchUp: number;
  lpProfitShare: number;
  gpCarriedInterest: number;
  totalToLPs: number;
  totalToGP: number;
}

export function calculateWaterfall(input: WaterfallInput): WaterfallResult {
  const {
    totalAmount,
    totalContributed,
    totalDistributed,
    hurdleRate,
    carriedInterest,
    catchUpRate,
    holdingPeriodYears,
  } = input;
  
  let remaining = totalAmount;
  const result: WaterfallResult = {
    returnOfCapital: 0,
    preferredReturn: 0,
    gpCatchUp: 0,
    lpProfitShare: 0,
    gpCarriedInterest: 0,
    totalToLPs: 0,
    totalToGP: 0,
  };
  
  // Step 1: Return of Capital
  // LPs get their contributed capital back first
  const unreturned = totalContributed - totalDistributed;
  result.returnOfCapital = Math.min(remaining, Math.max(0, unreturned));
  remaining -= result.returnOfCapital;
  
  if (remaining <= 0) {
    result.totalToLPs = result.returnOfCapital;
    return result;
  }
  
  // Step 2: Preferred Return (compound annual)
  // LPs receive hurdle rate return on contributed capital
  const preferredAmount = totalContributed * (Math.pow(1 + hurdleRate, holdingPeriodYears) - 1);
  // Subtract any preferred already paid in prior distributions
  const preferredOwed = Math.max(0, preferredAmount - getPriorPreferred());
  result.preferredReturn = Math.min(remaining, preferredOwed);
  remaining -= result.preferredReturn;
  
  if (remaining <= 0) {
    result.totalToLPs = result.returnOfCapital + result.preferredReturn;
    return result;
  }
  
  // Step 3: GP Catch-up
  // GP receives catch-up until they have carriedInterest of total profits
  // Total profits so far = preferredReturn + remaining
  // GP target = carriedInterest * total profits
  // If catch-up is 100%, GP gets 100% of this tier until caught up
  
  const profitsBeforeCatchUp = result.preferredReturn;
  const totalProfitsIfFullyDistributed = profitsBeforeCatchUp + remaining;
  const gpTargetShare = totalProfitsIfFullyDistributed * carriedInterest;
  
  // GP needs to catch up to their target share
  const catchUpNeeded = gpTargetShare; // Simplified: full catch-up
  result.gpCatchUp = Math.min(remaining, catchUpNeeded * catchUpRate);
  remaining -= result.gpCatchUp;
  
  if (remaining <= 0) {
    result.totalToLPs = result.returnOfCapital + result.preferredReturn;
    result.totalToGP = result.gpCatchUp;
    return result;
  }
  
  // Step 4: 80/20 Split (or whatever the LPA specifies)
  const lpShare = 1 - carriedInterest; // e.g., 0.80
  result.lpProfitShare = remaining * lpShare;
  result.gpCarriedInterest = remaining * carriedInterest;
  
  result.totalToLPs = result.returnOfCapital + result.preferredReturn + result.lpProfitShare;
  result.totalToGP = result.gpCatchUp + result.gpCarriedInterest;
  
  return result;
}

/**
 * Allocate LP distribution amounts based on ownership percentage
 */
export function allocateToLPs(
  totalToLPs: number,
  investors: { id: string; ownershipPct: number }[],
  waterfallComponents: { returnOfCapital: number; preferredReturn: number; lpProfitShare: number }
): DistributionItemAllocation[] {
  return investors.map(investor => ({
    investorId: investor.id,
    grossAmount: totalToLPs * investor.ownershipPct,
    returnOfCapital: waterfallComponents.returnOfCapital * investor.ownershipPct,
    preferredReturn: waterfallComponents.preferredReturn * investor.ownershipPct,
    profitShare: waterfallComponents.lpProfitShare * investor.ownershipPct,
  }));
}
```

---

## 6. Capital Transaction Flow

When payments are recorded or distributions made, the system creates `CapitalTransaction` records and updates related balances:

```typescript
// lib/services/capital-service.ts

/**
 * Record a capital call payment from an LP
 */
export async function recordCapitalCallPayment(
  itemId: string,
  payment: {
    paidAmount: number;
    paidDate: Date;
    paymentMethod: string;
    paymentRef?: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get the capital call item
    const item = await tx.capitalCallItem.findUnique({
      where: { id: itemId },
      include: { capitalCall: true, investor: true },
    });
    
    // 2. Update the item
    const newPaidAmount = Number(item.paidAmount) + payment.paidAmount;
    const newStatus = newPaidAmount >= Number(item.calledAmount) 
      ? 'PAID' 
      : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING';
    
    await tx.capitalCallItem.update({
      where: { id: itemId },
      data: {
        paidAmount: newPaidAmount,
        paidDate: payment.paidDate,
        paymentMethod: payment.paymentMethod,
        paymentRef: payment.paymentRef,
        status: newStatus,
      },
    });
    
    // 3. Create capital transaction record
    await tx.capitalTransaction.create({
      data: {
        fundId: item.capitalCall.fundId,
        investorId: item.investorId,
        type: 'CONTRIBUTION',
        amount: payment.paidAmount,
        date: payment.paidDate,
        capitalCallId: item.capitalCallId,
        description: `Capital Call #${item.capitalCall.callNumber} payment`,
      },
    });
    
    // 4. Check if capital call is fully funded
    const allItems = await tx.capitalCallItem.findMany({
      where: { capitalCallId: item.capitalCallId },
    });
    
    const totalPaid = allItems.reduce((sum, i) => sum + Number(i.paidAmount), 0);
    const totalCalled = allItems.reduce((sum, i) => sum + Number(i.calledAmount), 0);
    
    let callStatus = 'PARTIALLY_FUNDED';
    if (totalPaid >= totalCalled) {
      callStatus = 'FULLY_FUNDED';
    }
    
    await tx.capitalCall.update({
      where: { id: item.capitalCallId },
      data: { status: callStatus },
    });
    
    // 5. Create audit log
    await tx.auditLog.create({
      data: {
        userId: getCurrentUserId(),
        action: 'UPDATE',
        entityType: 'CapitalCallItem',
        entityId: itemId,
        changes: { payment },
      },
    });
    
    return item;
  });
}
```

---

## 7. Component Structure

```
src/components/capital/
├── capital-calls/
│   ├── capital-call-list.tsx
│   ├── capital-call-summary-cards.tsx
│   ├── capital-call-detail.tsx
│   ├── capital-call-form.tsx
│   ├── capital-call-allocation.tsx
│   ├── lp-payment-table.tsx
│   ├── record-payment-modal.tsx
│   └── capital-call-notice.tsx
├── distributions/
│   ├── distribution-list.tsx
│   ├── distribution-summary-cards.tsx
│   ├── distribution-detail.tsx
│   ├── distribution-form.tsx
│   ├── waterfall-preview.tsx
│   ├── waterfall-breakdown.tsx
│   ├── lp-distribution-table.tsx
│   └── distribution-notice.tsx
├── transactions/
│   ├── transaction-list.tsx
│   └── transaction-export.tsx
└── shared/
    ├── payment-status-badge.tsx
    ├── progress-bar.tsx
    └── currency-display.tsx
```

---

## 8. Validation Schemas

```typescript
// lib/validations/capital.ts

export const createCapitalCallSchema = z.object({
  fundId: z.string().cuid(),
  totalAmount: z.number().positive('Amount must be positive'),
  purpose: z.string().min(1, 'Purpose is required').max(200),
  purposeDetail: z.string().max(2000).optional(),
  callDate: z.date(),
  dueDate: z.date(),
}).refine(data => data.dueDate > data.callDate, {
  message: 'Due date must be after call date',
  path: ['dueDate'],
});

export const recordPaymentSchema = z.object({
  paidAmount: z.number().positive('Amount must be positive'),
  paidDate: z.date(),
  paymentMethod: z.string().min(1).max(50),
  paymentRef: z.string().max(100).optional(),
});

export const createDistributionSchema = z.object({
  fundId: z.string().cuid(),
  totalAmount: z.number().positive('Amount must be positive'),
  date: z.date(),
  type: z.nativeEnum(DistributionType),
  source: z.string().max(500).optional(),
});

export const calculateWaterfallSchema = z.object({
  fundId: z.string().cuid(),
  totalAmount: z.number().positive(),
  distributionDate: z.date(),
});
```

---

## 9. PDF Notice Generation

Capital call and distribution notices are generated as PDFs using `@react-pdf/renderer`:

```typescript
// lib/pdf/capital-call-notice.tsx

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export function CapitalCallNoticePDF({ 
  fund, 
  capitalCall, 
  investor, 
  item 
}: CapitalCallNoticePDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{fund.name}</Text>
          <Text style={styles.subtitle}>Capital Call Notice</Text>
        </View>
        
        <View style={styles.details}>
          <Text>Capital Call #{capitalCall.callNumber}</Text>
          <Text>Call Date: {formatDate(capitalCall.callDate)}</Text>
          <Text>Due Date: {formatDate(capitalCall.dueDate)}</Text>
        </View>
        
        <View style={styles.recipient}>
          <Text>To: {investor.name}</Text>
          <Text>{investor.email}</Text>
        </View>
        
        <View style={styles.body}>
          <Text>
            Dear {investor.name},
          </Text>
          <Text>
            Pursuant to the Limited Partnership Agreement dated {formatDate(fund.createdAt)},
            we hereby call for the following capital contribution:
          </Text>
        </View>
        
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text>Your Commitment:</Text>
            <Text>{formatCurrency(investor.commitmentAmount)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text>Your Ownership %:</Text>
            <Text>{formatPercent(item.calledAmount / capitalCall.totalAmount)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.bold}>Amount Due:</Text>
            <Text style={styles.bold}>{formatCurrency(item.calledAmount)}</Text>
          </View>
        </View>
        
        <View style={styles.purpose}>
          <Text style={styles.bold}>Purpose:</Text>
          <Text>{capitalCall.purpose}</Text>
          {capitalCall.purposeDetail && (
            <Text style={styles.small}>{capitalCall.purposeDetail}</Text>
          )}
        </View>
        
        <View style={styles.wireInfo}>
          <Text style={styles.bold}>Wire Instructions:</Text>
          <Text>Bank: {fund.bankName}</Text>
          <Text>Account: {fund.accountNumber}</Text>
          <Text>Routing: {fund.routingNumber}</Text>
          <Text>Reference: CC{capitalCall.callNumber}-{investor.id.slice(-4)}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text>
            Please remit payment by {formatDate(capitalCall.dueDate)}.
          </Text>
          <Text>
            If you have any questions, please contact us.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
```

---

## 10. Related Documents

- `02_PRD_Schema.md` - CapitalCall, CapitalCallItem, Distribution, DistributionItem, CapitalTransaction models
- `04_Module_Investors.md` - How capital transactions affect investor accounts
- `08_Business_Rules.md` - Payment recording rules, status transitions
