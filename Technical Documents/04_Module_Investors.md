# BlackGem - Investor Management Module

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.1 |
| Related To | 02_PRD_Schema.md, 11_Brand_System.md |

---

## 1. Module Overview

The Investor Management module handles all aspects of Limited Partner (LP) relationships, from initial prospecting through funded commitments. It includes capital account tracking, communication logging, and an investor portal for LP self-service access.

### Interface Context

This module spans **both interfaces** defined in the Brand System:

| Component | Interface | Mode | Users |
|-----------|-----------|------|-------|
| Investor List | **The Cockpit** | Dark | Fund Managers, Analysts |
| Investor Detail | **The Cockpit** | Dark | Fund Managers, Analysts |
| Capital Accounts (Manager view) | **The Cockpit** | Dark | Fund Managers |
| **LP Portal** | **The Library** | Light | Limited Partners, Advisors |

> **Design Reference:** See `11_Brand_System.md` Section 3 for complete interface specifications and `09_Claude_Instructions.md` Section 2.5 for implementation details.

---

## 2. User Stories

### 2.1 Fund Manager Perspective

**As a Fund Principal, I want to:**
- Track potential investors through the fundraising pipeline
- Record commitments and track funding status
- See aggregate capital raised vs. target at a glance
- Communicate with investors and log interactions
- Share documents securely with specific investors
- Generate capital account statements for each LP

### 2.2 Investor (LP) Perspective

**As an LP, I want to:**
- Access a portal to view my investment details
- See my capital account balance and history
- Download reports and tax documents (K-1s)
- View fund updates and portfolio information
- Update my contact information

---

## 3. Features & Screens

### 3.1 Investor List View

**Components:**
- Summary cards: Total Committed, Total Funded, Number of LPs, Unfunded Commitments
- Filterable table: Name, Type, Status, Commitment, Funded, % of Fund
- Status pipeline view (optional): Visualize investors by status
- Search functionality
- Export to CSV

**Wireframe - Investor List:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INVESTORS                                                   [+ Add Investor]│
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ COMMITTED     │ │ FUNDED        │ │ UNFUNDED      │ │ LPs           │    │
│ │ $1,250,000    │ │ $425,000      │ │ $825,000      │ │ 14            │    │
│ │ 83% of target │ │ 34% of commit │ │               │ │               │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter: [Type ▼] [Status ▼]                              🔍 Search...       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Name              │ Type          │ Status    │ Commitment │ Funded   │ %   │
├───────────────────┼───────────────┼───────────┼────────────┼──────────┼─────┤
│ John Anderson     │ Individual    │ Funded    │ $100,000   │ $35,000  │ 8%  │
│ Smith Family Off  │ Family Office │ Funded    │ $200,000   │ $70,000  │ 16% │
│ Jane Williams     │ Individual    │ Committed │ $75,000    │ $0       │ 6%  │
│ Acme Ventures     │ Institutional │ Reviewing │ $300,000   │ $0       │ --  │
│ Bob Johnson       │ Angel         │ Prospect  │ --         │ --       │ --  │
├───────────────────┴───────────────┴───────────┴────────────┴──────────┴─────┤
│ Showing 5 of 14 investors                                          [Export] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Investor Detail View

**Layout Sections:**

1. **Header**
   - Investor name and type badge
   - Status indicator
   - Quick actions: Edit, Send Email, Invite to Portal
   - Navigation tabs: Overview, Capital Account, Communications, Documents

2. **Overview Tab**
   - Contact information card
   - Commitment details card
   - Investment preferences/notes
   - Roles (Board seat, Mentor, Lead investor)
   - Portal access status

3. **Capital Account Tab**
   - Summary: Commitment, Paid-in, Distributions, NAV, IRR, MOIC
   - Transaction history table
   - Capital calls received
   - Distributions received
   - Chart: Capital account over time

4. **Communications Tab**
   - Communication log (calls, emails, meetings)
   - Add communication form
   - Scheduled follow-ups

5. **Documents Tab**
   - Documents shared with this investor
   - Subscription documents status
   - K-1 and tax documents

**Wireframe - Investor Overview:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Investors                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Smith Family Office                                    [Funded] ●           │
│ Family Office                                 [Edit] [Email] [Portal ▼]     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Overview] [Capital Account] [Communications] [Documents]                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┐  ┌────────────────────────────────────┐   │
│ │ CONTACT INFORMATION          │  │ COMMITMENT DETAILS                 │   │
│ │                              │  │                                    │   │
│ │ Primary: Sarah Smith         │  │ Commitment     $200,000            │   │
│ │ Email: sarah@smithfo.com     │  │ Commitment Date Jan 15, 2026       │   │
│ │ Phone: (555) 123-4567        │  │ Ownership %    16.0%               │   │
│ │                              │  │                                    │   │
│ │ Secondary: Michael Smith     │  │ Paid-in Capital  $70,000           │   │
│ │ Email: michael@smithfo.com   │  │ Distributions    $0                │   │
│ │                              │  │ Unfunded         $130,000          │   │
│ └──────────────────────────────┘  └────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ROLES & INVOLVEMENT                                                     ││
│ │                                                                         ││
│ │ [✓] Board Seat    [ ] Board Observer    [✓] Mentor    [✓] Lead Investor││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ NOTES                                                          [Edit]  ││
│ │                                                                        ││
│ │ Interested in industrials and B2B services. Previous experience in     ││
│ │ manufacturing through portfolio company ownership. Can provide         ││
│ │ operational support and introductions to potential targets.            ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ PORTAL ACCESS                                                          ││
│ │                                                                        ││
│ │ Status: Active                                                         ││
│ │ Email: sarah@smithfo.com                                               ││
│ │ Last Access: Jan 20, 2026 at 3:45 PM                                   ││
│ │                                                    [Resend Invitation] ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Capital Account View

**Wireframe - Capital Account:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Overview] [Capital Account] [Communications] [Documents]                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ CAPITAL ACCOUNT SUMMARY                                                     │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ COMMITMENT    │ │ PAID-IN       │ │ DISTRIBUTIONS │ │ NET VALUE     │    │
│ │ $200,000      │ │ $70,000       │ │ $0            │ │ $73,500       │    │
│ │               │ │ 35% of commit │ │               │ │ 1.05x MOIC    │    │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRANSACTION HISTORY                                          [Export CSV]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Date        │ Type           │ Description              │ Amount    │ Bal  │
├─────────────┼────────────────┼──────────────────────────┼───────────┼──────┤
│ Jan 15 2026 │ Contribution   │ Capital Call #1          │ +$35,000  │ $35K │
│ Feb 1 2026  │ Mgmt Fee       │ Q1 2026 Management Fee   │ -$1,000   │ $34K │
│ Feb 15 2026 │ Contribution   │ Capital Call #2          │ +$35,000  │ $69K │
│ Mar 31 2026 │ Valuation Adj  │ Q1 NAV Adjustment        │ +$4,500   │ $73K │
├─────────────┴────────────────┴──────────────────────────┴───────────┴──────┤
│                                                                             │
│ [Chart: Capital Account Balance Over Time]                                  │
│ $80K ┤                                              ●───────────●          │
│ $70K ┤                              ●───────────────┘                       │
│ $60K ┤                              │                                       │
│ $50K ┤                              │                                       │
│ $40K ┤      ●───────────────────────┘                                       │
│ $30K ┤      │                                                               │
│ $20K ┤      │                                                               │
│ $10K ┤      │                                                               │
│   $0 ┼──────┴───────────────────────────────────────────────────────────   │
│      Jan       Feb       Mar       Apr       May       Jun                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 LP Portal (Investor-Facing)

The LP Portal is a simplified, read-only interface for investors to access their investment information.

**Portal Features:**
- Dashboard with investment summary
- Capital account statement
- Download reports and K-1s
- View fund updates
- View portfolio summary (if permitted)
- Update profile/contact info

**Wireframe - LP Portal Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SearchFund LP Portal                    Welcome, Sarah │ ⚙ │ Logout │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    YOUR INVESTMENT IN XYZ SEARCH FUND                       │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │                         INVESTMENT SUMMARY                            │  │
│ │                                                                       │  │
│ │   Commitment          Paid-in            Distributions    Net Value   │  │
│ │   $200,000           $70,000             $0               $73,500     │  │
│ │                      35%                                  1.05x       │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌────────────────────────────────┐  ┌────────────────────────────────────┐ │
│ │ RECENT DOCUMENTS               │  │ FUND STATUS                        │ │
│ │                                │  │                                    │ │
│ │ 📄 Q4 2025 Investor Update    │  │ Status: Acquired                   │ │
│ │    Jan 15, 2026    [Download] │  │ Portfolio: ABC Manufacturing       │ │
│ │                                │  │                                    │ │
│ │ 📄 Capital Call #2 Notice     │  │ Acquisition Date: Mar 1, 2026      │ │
│ │    Feb 10, 2026    [Download] │  │ Current Valuation: $9.2M           │ │
│ │                                │  │                                    │ │
│ │ 📄 2025 K-1                   │  │ Your Ownership: 16.0%              │ │
│ │    Mar 15, 2026    [Download] │  │                                    │ │
│ │                                │  │                                    │ │
│ │ [View All Documents]           │  │                                    │ │
│ └────────────────────────────────┘  └────────────────────────────────────┘ │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ LATEST UPDATE FROM THE FUND                          Jan 15, 2026     │  │
│ │                                                                       │  │
│ │ Dear Partners,                                                        │  │
│ │                                                                       │  │
│ │ We are pleased to report that Q4 was another strong quarter for ABC   │  │
│ │ Manufacturing. Revenue grew 12% year-over-year and EBITDA margins     │  │
│ │ expanded to 18.5%...                                                  │  │
│ │                                                          [Read More]  │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Endpoints

### 4.1 Investor CRUD

```
GET    /api/investors
       Query params: fundId, type, status, search, sortBy, sortOrder, page, limit
       Response: { investors: Investor[], total: number, summary: InvestorSummary }

POST   /api/investors
       Body: CreateInvestorInput
       Response: Investor

GET    /api/investors/:id
       Response: Investor (with contacts, recent communications)

PUT    /api/investors/:id
       Body: UpdateInvestorInput
       Response: Investor

DELETE /api/investors/:id
       Response: { success: true }
```

### 4.2 Contacts

```
GET    /api/investors/:id/contacts
       Response: InvestorContact[]

POST   /api/investors/:id/contacts
       Body: CreateInvestorContactInput
       Response: InvestorContact

PUT    /api/investors/:id/contacts/:contactId
       Body: UpdateInvestorContactInput
       Response: InvestorContact

DELETE /api/investors/:id/contacts/:contactId
       Response: { success: true }
```

### 4.3 Capital Account

```
GET    /api/investors/:id/capital-account
       Response: {
         summary: { commitment, paidIn, distributions, nav, irr, moic },
         transactions: CapitalTransaction[]
       }

GET    /api/investors/:id/capital-account/statement
       Query params: startDate, endDate, format (json|pdf)
       Response: CapitalAccountStatement | PDF file
```

### 4.4 Communications

```
GET    /api/investors/:id/communications
       Query params: type, startDate, endDate, page, limit
       Response: { communications: Communication[], total: number }

POST   /api/investors/:id/communications
       Body: CreateCommunicationInput
       Response: Communication
```

### 4.5 Portal Access

```
POST   /api/investors/:id/portal/invite
       Body: { email: string }
       Response: { success: true, invitedAt: Date }
       Note: Creates User with LP_USER role, links to Investor, sends email

POST   /api/investors/:id/portal/resend-invite
       Response: { success: true }

DELETE /api/investors/:id/portal/access
       Response: { success: true }
       Note: Disables portal access (keeps User but removes link)
```

### 4.6 LP Portal API (Authenticated as LP)

```
GET    /api/portal/dashboard
       Response: {
         investment: InvestorSummary,
         fundStatus: FundSummary,
         recentDocuments: Document[],
         latestUpdate: Report
       }

GET    /api/portal/capital-account
       Response: CapitalAccountStatement

GET    /api/portal/documents
       Query params: category, page, limit
       Response: Document[]

GET    /api/portal/documents/:id/download
       Response: Signed URL or file stream

GET    /api/portal/reports
       Response: Report[]

PUT    /api/portal/profile
       Body: { name, email, phone }
       Response: User
```

### 4.7 Fund-Level Investor Analytics

```
GET    /api/funds/:fundId/investors/summary
       Response: {
         totalCommitted: number,
         totalFunded: number,
         totalUnfunded: number,
         totalDistributed: number,
         investorCount: number,
         byType: { type: string, count: number, committed: number }[],
         byStatus: { status: string, count: number }[]
       }
```

---

## 5. Component Structure

```
src/components/investors/
├── investor-list/
│   ├── investor-table.tsx
│   ├── investor-summary-cards.tsx
│   ├── investor-filters.tsx
│   └── investor-list-header.tsx
├── investor-detail/
│   ├── investor-header.tsx
│   ├── investor-overview.tsx
│   ├── investor-contact-card.tsx
│   ├── investor-commitment-card.tsx
│   ├── investor-roles.tsx
│   ├── investor-portal-status.tsx
│   ├── capital-account-tab.tsx
│   ├── capital-account-summary.tsx
│   ├── capital-account-chart.tsx
│   ├── transaction-history.tsx
│   ├── communications-tab.tsx
│   ├── communication-log.tsx
│   ├── communication-form.tsx
│   └── investor-documents-tab.tsx
├── investor-form/
│   ├── investor-form.tsx
│   ├── investor-form-basic.tsx
│   ├── investor-form-commitment.tsx
│   └── investor-form-roles.tsx
└── shared/
    ├── investor-type-badge.tsx
    ├── investor-status-badge.tsx
    └── commitment-progress.tsx

src/app/(portal)/
├── layout.tsx                    # Portal layout (different from main app)
├── page.tsx                      # Portal dashboard
├── capital-account/
│   └── page.tsx
├── documents/
│   └── page.tsx
├── reports/
│   └── page.tsx
└── profile/
    └── page.tsx
```

---

## 6. Validation Schemas

```typescript
// lib/validations/investor.ts

import { z } from 'zod';

export const createInvestorSchema = z.object({
  fundId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(200),
  type: z.nativeEnum(InvestorType),
  
  // Contact info
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  
  // Commitment
  commitmentAmount: z.number().positive('Commitment must be positive'),
  commitmentDate: z.date().optional(),
  
  // Roles
  boardSeat: z.boolean().default(false),
  boardObserver: z.boolean().default(false),
  mentorRole: z.boolean().default(false),
  leadInvestor: z.boolean().default(false),
  
  notes: z.string().max(5000).optional(),
  investmentCriteria: z.string().max(2000).optional(),
});

export const updateInvestorSchema = createInvestorSchema.partial().extend({
  status: z.nativeEnum(InvestorStatus).optional(),
});

export const createInvestorContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  title: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const createCommunicationSchema = z.object({
  type: z.nativeEnum(CommunicationType),
  direction: z.nativeEnum(CommunicationDirection),
  subject: z.string().max(200).optional(),
  content: z.string().max(10000).optional(),
  date: z.date(),
  contactName: z.string().max(200).optional(),
  sentBy: z.string().max(200).optional(),
  followUpDate: z.date().optional(),
});

export const portalInviteSchema = z.object({
  email: z.string().email('Valid email is required'),
});
```

---

## 7. Ownership Percentage Calculation

The ownership percentage should be calculated dynamically rather than stored statically. Here's the calculation logic:

```typescript
// lib/calculations/ownership.ts

/**
 * Calculate ownership percentage for an investor
 * Based on their commitment relative to total fund commitments
 */
export function calculateOwnershipPct(
  investorCommitment: number,
  totalFundCommitments: number
): number {
  if (totalFundCommitments === 0) return 0;
  return investorCommitment / totalFundCommitments;
}

/**
 * Calculate ownership for all investors in a fund
 * Call this whenever commitments change
 */
export async function recalculateAllOwnership(fundId: string) {
  const investors = await prisma.investor.findMany({
    where: { fundId, status: { in: ['COMMITTED', 'DOCS_SIGNED', 'FUNDED'] } },
    select: { id: true, commitmentAmount: true },
  });
  
  const totalCommitments = investors.reduce(
    (sum, inv) => sum + Number(inv.commitmentAmount), 
    0
  );
  
  // Note: We don't store this - it's calculated on read
  // But we can cache it or compute in a view
  return investors.map(inv => ({
    id: inv.id,
    ownershipPct: calculateOwnershipPct(Number(inv.commitmentAmount), totalCommitments),
  }));
}
```

---

## 8. Portal Authentication Flow

The LP Portal uses the same NextAuth.js setup but with a separate login page and restricted permissions:

```typescript
// lib/auth.ts (partial)

export const authOptions: NextAuthOptions = {
  // ... other config
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        
        // For LP users, include their investor ID
        if (user.role === 'LP_USER') {
          const investor = await prisma.investor.findFirst({
            where: { portalUserId: user.id },
            select: { id: true, fundId: true },
          });
          token.investorId = investor?.id;
          token.fundId = investor?.fundId;
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.investorId = token.investorId;
      session.user.fundId = token.fundId;
      return session;
    },
  },
};

// Middleware to protect portal routes
export function withLPAuth(handler) {
  return async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || session.user.role !== 'LP_USER') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // LP can only access their own investor data
    req.investorId = session.user.investorId;
    req.fundId = session.user.fundId;
    
    return handler(req, res);
  };
}
```

---

## 9. Related Documents

- `02_PRD_Schema.md` - Database models for Investor, InvestorContact, CapitalTransaction
- `06_Module_Capital.md` - Capital calls and distributions that affect investor accounts
- `08_Business_Rules.md` - Investor status transitions, portal access rules
