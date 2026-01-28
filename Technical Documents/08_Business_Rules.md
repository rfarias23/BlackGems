# BlackGem - Business Rules

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.0 |
| Purpose | Define validation rules, state transitions, and business logic |

---

## 1. Overview

This document defines the business rules that govern the BlackGem. These rules ensure data integrity, proper workflow progression, and consistent behavior across the application. All rules defined here should be implemented as validation logic in the API layer.

---

## 2. Fund Rules

### 2.1 Fund Status Transitions

The fund status follows a defined lifecycle. Only certain transitions are allowed:

```
ALLOWED TRANSITIONS:

RAISING → SEARCHING         (when fundraising complete)
RAISING → DISSOLVED         (if unable to raise capital)

SEARCHING → UNDER_LOI       (when LOI signed on a deal)
SEARCHING → DISSOLVED       (if search period expires without acquisition)

UNDER_LOI → SEARCHING       (if deal falls through)
UNDER_LOI → ACQUIRED        (when acquisition closes)

ACQUIRED → OPERATING        (automatic, same as ACQUIRED for most purposes)

OPERATING → PREPARING_EXIT  (when actively pursuing exit)

PREPARING_EXIT → OPERATING  (if exit process abandoned)
PREPARING_EXIT → EXITED     (when exit closes)

EXITED → CLOSED            (when all distributions complete)

Any Status → DISSOLVED     (fund termination without acquisition)
```

**Implementation:**

```typescript
const FUND_STATUS_TRANSITIONS: Record<FundStatus, FundStatus[]> = {
  RAISING: ['SEARCHING', 'DISSOLVED'],
  SEARCHING: ['UNDER_LOI', 'DISSOLVED'],
  UNDER_LOI: ['SEARCHING', 'ACQUIRED'],
  ACQUIRED: ['OPERATING'],
  OPERATING: ['PREPARING_EXIT'],
  PREPARING_EXIT: ['OPERATING', 'EXITED'],
  EXITED: ['CLOSED'],
  DISSOLVED: [],
  CLOSED: [],
};

export function canTransitionFundStatus(
  current: FundStatus,
  target: FundStatus
): boolean {
  return FUND_STATUS_TRANSITIONS[current]?.includes(target) ?? false;
}
```

### 2.2 Fund Validation Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Target size required | `targetSize > 0` | "Target fund size is required" |
| Hard cap >= target | `hardCap >= targetSize` | "Hard cap must be >= target size" |
| Management fee range | `0 <= managementFee <= 0.05` | "Management fee must be 0-5%" |
| Carried interest range | `0 <= carriedInterest <= 0.50` | "Carried interest must be 0-50%" |
| Hurdle rate range | `0 <= hurdleRate <= 0.20` | "Hurdle rate must be 0-20%" |
| Vintage year valid | `1990 <= vintage <= currentYear + 1` | "Invalid vintage year" |

---

## 3. Deal Rules

### 3.1 Deal Stage Transitions

Deals follow a pipeline with defined stage progression:

```
ALLOWED TRANSITIONS:

INITIAL_REVIEW → PRELIMINARY_ANALYSIS, PASSED
PRELIMINARY_ANALYSIS → MANAGEMENT_MEETING, PASSED
MANAGEMENT_MEETING → NDA_CIM, PASSED
NDA_CIM → SITE_VISIT, LOI_PREPARATION, PASSED
SITE_VISIT → LOI_PREPARATION, PASSED
LOI_PREPARATION → LOI_NEGOTIATION, PASSED
LOI_NEGOTIATION → DUE_DILIGENCE, PASSED
DUE_DILIGENCE → FINAL_NEGOTIATION, PASSED
FINAL_NEGOTIATION → CLOSING, PASSED
CLOSING → CLOSED, PASSED

Any Stage → PASSED (deals can be passed at any point)
PASSED → (terminal, no transitions out)
CLOSED → (terminal, no transitions out)
```

**Implementation:**

```typescript
const DEAL_STAGE_TRANSITIONS: Record<DealStage, DealStage[]> = {
  INITIAL_REVIEW: ['PRELIMINARY_ANALYSIS', 'PASSED'],
  PRELIMINARY_ANALYSIS: ['MANAGEMENT_MEETING', 'PASSED'],
  MANAGEMENT_MEETING: ['NDA_CIM', 'PASSED'],
  NDA_CIM: ['SITE_VISIT', 'LOI_PREPARATION', 'PASSED'],
  SITE_VISIT: ['LOI_PREPARATION', 'PASSED'],
  LOI_PREPARATION: ['LOI_NEGOTIATION', 'PASSED'],
  LOI_NEGOTIATION: ['DUE_DILIGENCE', 'PASSED'],
  DUE_DILIGENCE: ['FINAL_NEGOTIATION', 'PASSED'],
  FINAL_NEGOTIATION: ['CLOSING', 'PASSED'],
  CLOSING: ['CLOSED', 'PASSED'],
  CLOSED: [],
  PASSED: [],
};

export function canTransitionDealStage(
  current: DealStage,
  target: DealStage
): boolean {
  return DEAL_STAGE_TRANSITIONS[current]?.includes(target) ?? false;
}
```

### 3.2 Required Fields by Deal Stage

As deals progress, more information is required:

```typescript
const DEAL_REQUIRED_FIELDS_BY_STAGE: Record<DealStage, string[]> = {
  INITIAL_REVIEW: ['companyName', 'fundId'],
  PRELIMINARY_ANALYSIS: ['companyName', 'fundId', 'industry', 'revenue'],
  MANAGEMENT_MEETING: ['companyName', 'fundId', 'industry', 'revenue', 'firstContactDate'],
  NDA_CIM: ['companyName', 'fundId', 'industry', 'revenue', 'ndaSignedDate'],
  SITE_VISIT: ['companyName', 'fundId', 'industry', 'revenue', 'ebitda', 'ndaSignedDate', 'cimReceivedDate'],
  LOI_PREPARATION: ['companyName', 'fundId', 'industry', 'revenue', 'ebitda', 'askingPrice', 'investmentThesis'],
  LOI_NEGOTIATION: ['companyName', 'fundId', 'industry', 'revenue', 'ebitda', 'askingPrice', 'investmentThesis', 'loiSubmittedDate'],
  DUE_DILIGENCE: ['companyName', 'fundId', 'industry', 'revenue', 'ebitda', 'askingPrice', 'investmentThesis', 'loiAcceptedDate', 'exclusivityStartDate'],
  FINAL_NEGOTIATION: ['companyName', 'fundId', 'industry', 'revenue', 'ebitda', 'askingPrice', 'investmentThesis', 'keyRisks'],
  CLOSING: ['companyName', 'fundId', 'industry', 'revenue', 'ebitda', 'askingPrice', 'expectedCloseDate'],
  CLOSED: ['companyName', 'fundId', 'industry', 'revenue', 'ebitda', 'askingPrice', 'actualCloseDate'],
  PASSED: ['companyName', 'fundId', 'passedReason'],
};

export function validateDealForStage(deal: Deal, targetStage: DealStage): ValidationResult {
  const requiredFields = DEAL_REQUIRED_FIELDS_BY_STAGE[targetStage];
  const missingFields = requiredFields.filter(field => !deal[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      errors: missingFields.map(f => `${f} is required for ${targetStage} stage`),
    };
  }
  return { valid: true, errors: [] };
}
```

### 3.3 Deal to Portfolio Conversion Rules

When converting a closed deal to a portfolio company:

| Rule | Validation | Error Message |
|------|------------|---------------|
| Deal must be closed | `deal.stage === 'CLOSED'` | "Only closed deals can be converted" |
| Deal must be won | `deal.status === 'WON'` | "Only won deals can be converted" |
| Not already converted | `!deal.portfolioCompanyId` | "Deal already converted to portfolio company" |
| Acquisition date required | `acquisitionDate is set` | "Acquisition date is required" |
| Acquisition price required | `acquisitionPrice > 0` | "Acquisition price is required" |
| Equity invested required | `equityInvested > 0` | "Equity invested is required" |
| Ownership valid | `0 < ownershipPct <= 1` | "Ownership must be between 0% and 100%" |

**Side Effects of Conversion:**
1. Create PortfolioCompany record linked to deal
2. Update Fund status to ACQUIRED (if first portfolio company)
3. Create initial Valuation at cost basis
4. Log audit entry

---

## 4. Investor Rules

### 4.1 Investor Status Transitions

```
ALLOWED TRANSITIONS:

PROSPECT → CONTACTED
CONTACTED → MEETING_SCHEDULED, DECLINED
MEETING_SCHEDULED → INTERESTED, DECLINED
INTERESTED → REVIEWING_DOCS, DECLINED
REVIEWING_DOCS → COMMITTED, DECLINED
COMMITTED → DOCS_SIGNED
DOCS_SIGNED → FUNDED
FUNDED → INACTIVE (rare, LP exits)

Any Status → DECLINED
DECLINED → PROSPECT (can restart)
```

**Implementation:**

```typescript
const INVESTOR_STATUS_TRANSITIONS: Record<InvestorStatus, InvestorStatus[]> = {
  PROSPECT: ['CONTACTED'],
  CONTACTED: ['MEETING_SCHEDULED', 'DECLINED'],
  MEETING_SCHEDULED: ['INTERESTED', 'DECLINED'],
  INTERESTED: ['REVIEWING_DOCS', 'DECLINED'],
  REVIEWING_DOCS: ['COMMITTED', 'DECLINED'],
  COMMITTED: ['DOCS_SIGNED'],
  DOCS_SIGNED: ['FUNDED'],
  FUNDED: ['INACTIVE'],
  INACTIVE: [],
  DECLINED: ['PROSPECT'], // Allow restarting
};
```

### 4.2 Investor Validation Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Name required | `name.length > 0` | "Investor name is required" |
| Commitment positive | `commitmentAmount > 0` | "Commitment must be positive" |
| Commitment >= minimum | `commitmentAmount >= fund.minimumCommitment` | "Commitment below fund minimum" |
| Commitment <= remaining | `commitmentAmount <= fund.hardCap - totalCommitted` | "Commitment exceeds fund capacity" |
| Email format valid | `email matches pattern` | "Invalid email format" |

### 4.3 Portal Access Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Only funded investors | `investor.status === 'FUNDED'` | "Portal only available to funded investors" |
| Email required for portal | `investor.email exists` | "Email required for portal access" |
| User not already exists | `no User with same email` | "User already exists with this email" |
| One portal per investor | `!investor.portalUserId` | "Investor already has portal access" |

---

## 5. Capital Management Rules

### 5.1 Capital Call Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Amount positive | `totalAmount > 0` | "Capital call amount must be positive" |
| Due date in future | `dueDate > now` (for new calls) | "Due date must be in the future" |
| Not exceed unfunded | `totalAmount <= totalUnfundedCommitments` | "Capital call exceeds unfunded commitments" |
| Fund in valid status | `fund.status in ['SEARCHING', 'UNDER_LOI', 'ACQUIRED', 'OPERATING']` | "Cannot call capital in current fund status" |

### 5.2 Capital Call Status Transitions

```
DRAFT → PENDING_APPROVAL, CANCELLED
PENDING_APPROVAL → SENT, DRAFT, CANCELLED
SENT → PARTIALLY_FUNDED, FULLY_FUNDED, CANCELLED
PARTIALLY_FUNDED → FULLY_FUNDED
FULLY_FUNDED → (terminal)
CANCELLED → (terminal)
```

### 5.3 Capital Call Item Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Called amount positive | `calledAmount > 0` | "Called amount must be positive" |
| Not exceed unfunded | `calledAmount <= investor.unfundedCommitment` | "Exceeds investor's unfunded commitment" |
| Pro-rata calculation | `calledAmount = totalCall * (investorCommitment / totalCommitments)` | "Amount doesn't match pro-rata" |
| Paid amount <= called | `paidAmount <= calledAmount` | "Paid amount cannot exceed called amount" |

### 5.4 Distribution Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Amount positive | `totalAmount > 0` | "Distribution amount must be positive" |
| Sufficient funds | `fund.availableCash >= totalAmount` | "Insufficient funds for distribution" |
| Fund has portfolio | `fund has at least one portfolioCompany or exit proceeds` | "No portfolio to distribute from" |

### 5.5 Distribution Waterfall Calculation

```typescript
interface WaterfallResult {
  returnOfCapital: number;
  preferredReturn: number;
  gpCatchUp: number;
  carriedInterest: number;
  lpProfit: number;
}

export function calculateWaterfall(
  distributionAmount: number,
  totalContributions: number,
  totalPriorDistributions: number,
  hurdleRate: number,
  carriedInterestRate: number,
  catchUpRate: number,
  yearsHeld: number
): WaterfallResult {
  let remaining = distributionAmount;
  const result: WaterfallResult = {
    returnOfCapital: 0,
    preferredReturn: 0,
    gpCatchUp: 0,
    carriedInterest: 0,
    lpProfit: 0,
  };
  
  // 1. Return of Capital (until LPs get back their contributions)
  const unreturned = Math.max(0, totalContributions - totalPriorDistributions);
  result.returnOfCapital = Math.min(remaining, unreturned);
  remaining -= result.returnOfCapital;
  
  if (remaining <= 0) return result;
  
  // 2. Preferred Return (hurdle)
  // Compound annual hurdle: contributions * ((1 + hurdle)^years - 1)
  const totalPreferredReturn = totalContributions * (Math.pow(1 + hurdleRate, yearsHeld) - 1);
  const unpaidPreferred = Math.max(0, totalPreferredReturn - Math.max(0, totalPriorDistributions - totalContributions));
  result.preferredReturn = Math.min(remaining, unpaidPreferred);
  remaining -= result.preferredReturn;
  
  if (remaining <= 0) return result;
  
  // 3. GP Catch-Up (until GP has carriedInterestRate of total profits)
  // GP catches up to their share of profits distributed so far
  const totalProfitsDistributed = result.preferredReturn + remaining;
  const gpTargetShare = totalProfitsDistributed * carriedInterestRate;
  const catchUpNeeded = gpTargetShare / catchUpRate; // Amount needed to flow to GP
  result.gpCatchUp = Math.min(remaining, catchUpNeeded);
  remaining -= result.gpCatchUp;
  
  if (remaining <= 0) return result;
  
  // 4. Carried Interest Split (remaining profits split per LPA)
  result.carriedInterest = remaining * carriedInterestRate;
  result.lpProfit = remaining * (1 - carriedInterestRate);
  
  return result;
}
```

### 5.6 Capital Transaction Rules

When recording capital movements:

| Event | Transaction Type | Amount Sign | Updates |
|-------|------------------|-------------|---------|
| Capital call payment received | CONTRIBUTION | Positive | Investor.paidInCapital += amount |
| Distribution paid | DISTRIBUTION | Negative | Investor.distributions += abs(amount) |
| Management fee charged | MANAGEMENT_FEE | Negative | - |
| Manual adjustment | ADJUSTMENT | +/- | - |

---

## 6. Document Rules

### 6.1 Document Validation Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| File size limit | `fileSize <= 50MB` | "File size exceeds 50MB limit" |
| Valid file type | `fileType in allowedTypes` | "File type not allowed" |
| Name required | `name.length > 0` | "Document name is required" |
| Single parent | Only one of fundId, dealId, etc. set | "Document can only belong to one entity" |

### 6.2 Allowed File Types

```typescript
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'text/csv',
];
```

### 6.3 Document Version Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Version increment | `newVersion = parentVersion + 1` | - |
| Only one latest | When setting isLatest, unset on siblings | - |
| Parent must exist | If parentId set, parent document exists | "Parent document not found" |
| Same category | `version.category === parent.category` | "Version must have same category" |

---

## 7. Valuation Rules

### 7.1 Valuation Validation Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| Value positive | `value > 0` | "Valuation must be positive" |
| Date not future | `date <= today` | "Valuation date cannot be in the future" |
| Methodology required | `methodology is set` | "Valuation methodology is required" |
| One official per quarter | Only one isOfficial per company per quarter | "Official valuation already exists for this period" |

### 7.2 Valuation Approval Workflow

For official valuations (used in LP reporting):

```
Prepared → Reviewed → Approved → Official

Statuses:
- DRAFT: Initial entry
- UNDER_REVIEW: Sent for review
- APPROVED: Approved by authorized person
- OFFICIAL: Used for LP reporting
```

---

## 8. Notification Triggers

These events should generate notifications:

| Event | Notification Type | Recipients |
|-------|-------------------|------------|
| Task assigned | TASK_ASSIGNED | Assignee |
| Task due tomorrow | TASK_DUE | Assignee |
| Task overdue | TASK_OVERDUE | Assignee, Creator |
| Deal stage changed | DEAL_STAGE_CHANGE | Fund members |
| Capital call created | CAPITAL_CALL_DUE | All investors (if sent) |
| Distribution created | DISTRIBUTION_MADE | All investors |
| Document shared | DOCUMENT_SHARED | Shared users/investors |
| Comment added | COMMENT_ADDED | Deal watchers |
| Report published | REPORT_PUBLISHED | LPs with portal access |

---

## 9. Audit Log Requirements

All of these actions must be logged:

| Entity | Actions to Log |
|--------|----------------|
| User | CREATE, UPDATE, DELETE, LOGIN, FAILED_LOGIN |
| Fund | CREATE, UPDATE, DELETE |
| Deal | CREATE, UPDATE, DELETE, stage changes |
| Investor | CREATE, UPDATE, DELETE, status changes, portal access |
| PortfolioCompany | CREATE, UPDATE, DELETE |
| CapitalCall | CREATE, UPDATE, status changes |
| Distribution | CREATE, UPDATE |
| Document | CREATE, DELETE, access (for sensitive) |
| Valuation | CREATE, UPDATE, approval |

**Audit Log Entry Structure:**

```typescript
interface AuditLogEntry {
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN';
  entityType: string;
  entityId: string;
  entityName: string;
  changes: {
    [field: string]: {
      old: any;
      new: any;
    };
  };
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

---

## 10. Permission Rules Summary

Quick reference for permission checks:

```typescript
const PERMISSION_RULES = {
  // Fund
  'fund.create': ['ADMIN'],
  'fund.update': ['ADMIN', 'FUND_MANAGER'],
  'fund.delete': ['ADMIN'],
  'fund.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST', 'VIEWER'],
  
  // Deals
  'deal.create': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'deal.update': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'deal.delete': ['ADMIN', 'FUND_MANAGER'],
  'deal.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST', 'VIEWER'],
  
  // Investors
  'investor.create': ['ADMIN', 'FUND_MANAGER'],
  'investor.update': ['ADMIN', 'FUND_MANAGER'],
  'investor.delete': ['ADMIN', 'FUND_MANAGER'],
  'investor.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'investor.view_own': ['LP_USER'], // LPs can only see their own
  
  // Portfolio
  'portfolio.create': ['ADMIN', 'FUND_MANAGER'],
  'portfolio.update': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'portfolio.delete': ['ADMIN', 'FUND_MANAGER'],
  'portfolio.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST', 'VIEWER'],
  'portfolio.view_summary': ['LP_USER'], // LPs see summary only
  
  // Capital Operations
  'capital_call.create': ['ADMIN', 'FUND_MANAGER'],
  'capital_call.update': ['ADMIN', 'FUND_MANAGER'],
  'capital_call.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'capital_call.view_own': ['LP_USER'],
  
  'distribution.create': ['ADMIN', 'FUND_MANAGER'],
  'distribution.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'distribution.view_own': ['LP_USER'],
  
  // Reports
  'report.create': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'report.publish': ['ADMIN', 'FUND_MANAGER'],
  'report.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST', 'VIEWER'],
  'report.view_published': ['LP_USER'],
  
  // Documents
  'document.upload': ['ADMIN', 'FUND_MANAGER', 'ANALYST'],
  'document.delete': ['ADMIN', 'FUND_MANAGER'],
  'document.view': ['ADMIN', 'FUND_MANAGER', 'ANALYST', 'VIEWER'],
  'document.view_shared': ['LP_USER'],
  
  // Settings
  'settings.manage': ['ADMIN', 'FUND_MANAGER'],
  'users.manage': ['ADMIN', 'FUND_MANAGER'],
  'audit_log.view': ['ADMIN', 'FUND_MANAGER'],
};
```

---

## 11. Related Documents

- `02_PRD_Schema.md` - Database models and enums
- `09_Claude_Instructions.md` - How to implement these rules
