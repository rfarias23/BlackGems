# BlackGem - Deal Pipeline Module

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.1 |
| Related To | 02_PRD_Schema.md, 11_Brand_System.md |

---

## 1. Module Overview

The Deal Pipeline module is the core CRM functionality for tracking potential acquisition targets from initial discovery through closing or pass. It supports the entire deal lifecycle with proper stage management, contact tracking, activity logging, and due diligence coordination.

### Interface Context

This module is exclusively part of **The Cockpit** (Dark Mode), used by Fund Managers and Analysts. LPs and Advisors do not have access to deal information unless specifically shared.

> **Design Reference:** See `11_Brand_System.md` Section 3 for Cockpit specifications and `09_Claude_Instructions.md` Section 7 for component patterns including stage badges and data tables.

---

## 2. User Stories

### 2.1 Core Functionality

**As a Fund Principal, I want to:**
- Add new deals quickly with minimal required fields
- View all deals in both table and kanban views
- Move deals through stages with validation
- Track all interactions with sellers and intermediaries
- Maintain a due diligence checklist for each deal
- See pipeline analytics and conversion metrics

**As an Analyst, I want to:**
- Research and update deal information
- Log calls, emails, and meeting notes
- Upload and organize deal documents
- Track tasks and next steps for each deal

---

## 3. Features & Screens

### 3.1 Deal List View

**Table View Components:**
- Sortable columns: Company Name, Stage, Revenue, EBITDA, Asking Price, Last Activity, Score
- Filters: Stage, Status, Industry, Source, Score Range, Date Range
- Search: Full-text search on company name, description, notes
- Bulk actions: Change stage, Export to CSV
- Quick-add button for new deals

**Kanban View Components:**
- Columns for each stage (configurable visibility)
- Drag-and-drop between stages (with validation)
- Card shows: Company name, Industry, Key metrics, Days in stage
- Color coding by status or score

**Wireframe - Deal List Table:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DEAL PIPELINE                          [+ Add Deal]  [Table] [Kanban] ≡    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filters: [Stage ▼] [Status ▼] [Industry ▼] [Source ▼]     🔍 Search...     │
├─────────────────────────────────────────────────────────────────────────────┤
│ □ │ Company        │ Stage      │ Revenue │ EBITDA │ Multiple │ Score │ ↕  │
├───┼────────────────┼────────────┼─────────┼────────┼──────────┼───────┼────┤
│ □ │ ABC Mfg Co     │ DD         │ $8.2M   │ $1.4M  │ 5.2x     │ 8/10  │ 2d │
│ □ │ XYZ Services   │ LOI Nego   │ $5.1M   │ $890K  │ 4.8x     │ 7/10  │ 5d │
│ □ │ 123 Industries │ Analysis   │ $12.0M  │ $2.1M  │ 6.0x     │ 6/10  │ 1w │
│ □ │ Smith & Sons   │ Initial    │ $3.5M   │ $520K  │ --       │ --    │ 3d │
├───┴────────────────┴────────────┴─────────┴────────┴──────────┴───────┴────┤
│ Showing 4 of 47 deals                              [◄ Prev] Page 1 [Next ►]│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Deal Detail View

**Layout Sections:**

1. **Header**
   - Company name and stage badge
   - Quick actions: Edit, Change Stage, Pass, Archive
   - Navigation tabs: Overview, Contacts, Activity, DD, Documents, Tasks

2. **Overview Tab**
   - Company info card (name, website, industry, location)
   - Financial summary card (revenue, EBITDA, margins, ask price)
   - Key dates timeline
   - Investment thesis section
   - Scores and assessment
   - Next steps

3. **Contacts Tab**
   - List of deal contacts with role badges
   - Add/edit contact modal
   - Primary contact indicator

4. **Activity Tab**
   - Chronological activity feed
   - Activity type filter (calls, emails, meetings, notes)
   - Add activity form

5. **Due Diligence Tab**
   - DD items grouped by category
   - Progress bar per category
   - Red flag indicators
   - Status filters
   - Bulk update capability

6. **Documents Tab**
   - Document list with category grouping
   - Upload with drag-and-drop
   - Preview capability
   - Version history

7. **Tasks Tab**
   - Task list with assignee and due date
   - Quick add task
   - Filter by status

**Wireframe - Deal Overview:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Pipeline                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ABC Manufacturing Co                          [Due Diligence] ●             │
│ Industrial Equipment │ Chicago, IL            [Edit] [Pass] [Move Stage ▼]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Overview] [Contacts] [Activity] [DD] [Documents] [Tasks]                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐  ┌─────────────────────────────────────┐   │
│ │ FINANCIALS                  │  │ KEY DATES                           │   │
│ │                             │  │                                     │   │
│ │ Revenue (LTM)    $8,200,000 │  │ First Contact    Jan 5, 2026       │   │
│ │ EBITDA (LTM)     $1,400,000 │  │ NDA Signed       Jan 12, 2026      │   │
│ │ Gross Margin     42.5%      │  │ CIM Received     Jan 15, 2026      │   │
│ │ EBITDA Margin    17.1%      │  │ Mgmt Meeting     Jan 22, 2026      │   │
│ │                             │  │ LOI Submitted    Feb 3, 2026       │   │
│ │ Asking Price     $7,300,000 │  │ LOI Accepted     Feb 10, 2026      │   │
│ │ EV/EBITDA        5.2x       │  │ Exclusivity      Feb 10 - Mar 10   │   │
│ │ EV/Revenue       0.89x      │  │ Expected Close   Mar 31, 2026      │   │
│ └─────────────────────────────┘  └─────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ INVESTMENT THESIS                                              [Edit]  ││
│ │                                                                        ││
│ │ ABC Manufacturing is a 35-year-old manufacturer of industrial          ││
│ │ equipment with strong customer relationships and consistent margins... ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌────────────────────────┐  ┌────────────────────────────────────────────┐ │
│ │ ASSESSMENT             │  │ NEXT STEPS                       [Edit]   │ │
│ │                        │  │                                           │ │
│ │ Attractiveness  8/10   │  │ □ Complete financial DD by Feb 20        │ │
│ │ Fit Score       7/10   │  │ □ Customer reference calls               │ │
│ │ Risk Score      6/10   │  │ □ Site visit scheduled Feb 25            │ │
│ └────────────────────────┘  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Deal Creation/Edit Form

**Required Fields (Initial Entry):**
- Company Name
- Fund (if multi-fund)
- Source

**Optional Fields (Expandable Sections):**

*Company Information:*
- Website, Industry, Sub-industry, Business Model
- Year Founded, Employee Count
- City, State, Country
- Description

*Financial Information:*
- Revenue, EBITDA, Gross Profit, Net Income
- Asking Price
- (Multiples auto-calculated)

*Sourcing Information:*
- Source (dropdown + option to add new)
- Source Contact
- Source Notes

*Assessment:*
- Attractiveness Score (1-10)
- Fit Score (1-10)
- Risk Score (1-10)

*Analysis:*
- Investment Thesis (rich text)
- Key Risks (rich text)
- Value Creation Plan (rich text)

### 3.4 Due Diligence Tracker

**Features:**
- Pre-populated DD checklist template (configurable per fund)
- Categories with expandable items
- Status tracking per item
- Assignment to team members or external parties
- Red flag marking with notes
- Document request tracking
- Findings documentation

**Wireframe - DD Tracker:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DUE DILIGENCE                            Progress: ████████░░ 72%          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter: [All Categories ▼] [All Statuses ▼]               [+ Add Item]     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ▼ FINANCIAL (8/10 complete)                               ████████░░ 80%   │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ ✓ │ Review 3 years historical financials │ Completed │ J. Smith    │  │
│   │ ✓ │ Quality of earnings analysis         │ Completed │ External    │  │
│   │ ● │ Working capital analysis             │ In Prog   │ J. Smith    │  │
│   │ ⚑ │ Revenue concentration review         │ Completed │ M. Jones    │  │
│   │   │ └─ RED FLAG: Top customer is 35% of revenue                    │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ▼ LEGAL (5/8 complete)                                    ██████░░░░ 62%   │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ ✓ │ Corporate document review            │ Completed │ Attorney    │  │
│   │ ○ │ Contract review - customers          │ Pending   │ Attorney    │  │
│   │ ○ │ Contract review - suppliers          │ Not Start │ Attorney    │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ► COMMERCIAL (3/6 complete)                               █████░░░░░ 50%   │
│ ► OPERATIONAL (2/5 complete)                              ████░░░░░░ 40%   │
│ ► HR (0/4 complete)                                       ░░░░░░░░░░ 0%    │
│ ► IT (1/3 complete)                                       ███░░░░░░░ 33%   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Pipeline Analytics

**Metrics Dashboard:**
- Deal funnel visualization (deals by stage)
- Conversion rates between stages
- Average time in each stage
- Win rate (deals closed / deals past LOI stage)
- Pass reasons breakdown
- Source effectiveness (deals by source, conversion by source)
- Industry distribution
- Geographic distribution

---

## 4. API Endpoints

### 4.1 Deal CRUD

```
GET    /api/deals
       Query params: fundId, stage, status, industry, sourceId, 
                     search, minRevenue, maxRevenue, sortBy, sortOrder,
                     page, limit
       Response: { deals: Deal[], total: number, page: number }

POST   /api/deals
       Body: CreateDealInput (validated by Zod)
       Response: Deal

GET    /api/deals/:id
       Response: Deal (with contacts, recent activities)

PUT    /api/deals/:id
       Body: UpdateDealInput
       Response: Deal

DELETE /api/deals/:id
       Response: { success: true }
       Note: Soft delete (marks as archived)
```

### 4.2 Stage Management

```
PATCH  /api/deals/:id/stage
       Body: { stage: DealStage, reason?: string }
       Response: Deal
       Note: Validates stage transition rules (see Business Rules)
       Side effects: Creates activity log entry, sends notifications

POST   /api/deals/:id/pass
       Body: { reason: string, passedBy?: string }
       Response: Deal
       Note: Sets status to PASSED, stage to PASSED, records reason
```

### 4.3 Contacts

```
GET    /api/deals/:id/contacts
       Response: DealContact[]

POST   /api/deals/:id/contacts
       Body: CreateDealContactInput
       Response: DealContact

PUT    /api/deals/:id/contacts/:contactId
       Body: UpdateDealContactInput
       Response: DealContact

DELETE /api/deals/:id/contacts/:contactId
       Response: { success: true }
```

### 4.4 Activities

```
GET    /api/deals/:id/activities
       Query params: type, startDate, endDate, page, limit
       Response: { activities: Activity[], total: number }

POST   /api/deals/:id/activities
       Body: CreateActivityInput
       Response: Activity
```

### 4.5 Due Diligence

```
GET    /api/deals/:id/due-diligence
       Query params: category, status
       Response: DueDiligenceItem[]

POST   /api/deals/:id/due-diligence
       Body: CreateDDItemInput
       Response: DueDiligenceItem

PUT    /api/deals/:id/due-diligence/:itemId
       Body: UpdateDDItemInput
       Response: DueDiligenceItem

POST   /api/deals/:id/due-diligence/bulk-update
       Body: { items: { id: string, status: DDStatus }[] }
       Response: DueDiligenceItem[]

POST   /api/deals/:id/due-diligence/from-template
       Body: { templateId?: string }
       Response: DueDiligenceItem[]
       Note: Populates DD items from fund's default template
```

### 4.6 Documents

```
GET    /api/deals/:id/documents
       Query params: category
       Response: Document[]

POST   /api/deals/:id/documents
       Body: FormData (file + metadata)
       Response: Document

DELETE /api/deals/:id/documents/:docId
       Response: { success: true }
```

### 4.7 Tasks

```
GET    /api/deals/:id/tasks
       Query params: status, assigneeId
       Response: Task[]

POST   /api/deals/:id/tasks
       Body: CreateTaskInput
       Response: Task

PUT    /api/deals/:id/tasks/:taskId
       Body: UpdateTaskInput
       Response: Task
```

### 4.8 Analytics

```
GET    /api/deals/analytics/funnel
       Query params: fundId, startDate, endDate
       Response: { stage: string, count: number }[]

GET    /api/deals/analytics/conversion
       Query params: fundId, startDate, endDate
       Response: { fromStage: string, toStage: string, rate: number }[]

GET    /api/deals/analytics/by-source
       Query params: fundId, startDate, endDate
       Response: { source: string, deals: number, won: number, rate: number }[]

GET    /api/deals/analytics/time-in-stage
       Query params: fundId, startDate, endDate
       Response: { stage: string, avgDays: number, medianDays: number }[]
```

---

## 5. Component Structure

```
src/components/deals/
├── deal-list/
│   ├── deal-table.tsx           # Table view component
│   ├── deal-table-columns.tsx   # Column definitions
│   ├── deal-kanban.tsx          # Kanban board view
│   ├── deal-kanban-card.tsx     # Individual kanban card
│   ├── deal-filters.tsx         # Filter controls
│   └── deal-list-header.tsx     # Header with view toggle
├── deal-detail/
│   ├── deal-header.tsx          # Header with actions
│   ├── deal-overview.tsx        # Overview tab content
│   ├── deal-financials-card.tsx # Financial metrics card
│   ├── deal-dates-card.tsx      # Key dates timeline
│   ├── deal-scores-card.tsx     # Assessment scores
│   ├── deal-thesis.tsx          # Investment thesis section
│   ├── deal-contacts-tab.tsx    # Contacts tab
│   ├── deal-activity-tab.tsx    # Activity tab
│   ├── deal-dd-tab.tsx          # Due diligence tab
│   ├── deal-documents-tab.tsx   # Documents tab
│   └── deal-tasks-tab.tsx       # Tasks tab
├── deal-form/
│   ├── deal-form.tsx            # Main form component
│   ├── deal-form-company.tsx    # Company info section
│   ├── deal-form-financials.tsx # Financial info section
│   ├── deal-form-source.tsx     # Source info section
│   └── deal-form-assessment.tsx # Assessment section
├── deal-dd/
│   ├── dd-tracker.tsx           # Main DD tracker
│   ├── dd-category.tsx          # Category accordion
│   ├── dd-item.tsx              # Individual DD item
│   ├── dd-item-form.tsx         # Add/edit DD item
│   └── dd-progress.tsx          # Progress indicators
├── deal-activity/
│   ├── activity-feed.tsx        # Activity list
│   ├── activity-item.tsx        # Individual activity
│   └── activity-form.tsx        # Add activity form
├── shared/
│   ├── stage-badge.tsx          # Stage indicator badge
│   ├── status-badge.tsx         # Status indicator
│   ├── score-display.tsx        # Score visualization
│   └── stage-change-modal.tsx   # Stage change dialog
└── analytics/
    ├── pipeline-funnel.tsx      # Funnel chart
    ├── conversion-chart.tsx     # Conversion rates
    └── source-breakdown.tsx     # Source analytics
```

---

## 6. State Management

### 6.1 Server State (TanStack Query)

```typescript
// hooks/use-deals.ts

// List deals with filters
export function useDeals(filters: DealFilters) {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
  });
}

// Single deal with full details
export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: () => fetchDeal(id),
  });
}

// Mutations
export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, reason }) => updateDealStage(id, stage, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', id] });
    },
  });
}
```

### 6.2 Client State (Zustand)

```typescript
// stores/deal-view-store.ts

interface DealViewState {
  viewMode: 'table' | 'kanban';
  setViewMode: (mode: 'table' | 'kanban') => void;
  
  filters: DealFilters;
  setFilters: (filters: Partial<DealFilters>) => void;
  resetFilters: () => void;
  
  selectedDeals: string[];
  selectDeal: (id: string) => void;
  deselectDeal: (id: string) => void;
  clearSelection: () => void;
}

export const useDealViewStore = create<DealViewState>((set) => ({
  viewMode: 'table',
  setViewMode: (mode) => set({ viewMode: mode }),
  
  filters: defaultFilters,
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  resetFilters: () => set({ filters: defaultFilters }),
  
  selectedDeals: [],
  selectDeal: (id) => set((state) => ({ 
    selectedDeals: [...state.selectedDeals, id] 
  })),
  deselectDeal: (id) => set((state) => ({ 
    selectedDeals: state.selectedDeals.filter(d => d !== id) 
  })),
  clearSelection: () => set({ selectedDeals: [] }),
}));
```

---

## 7. Validation Schemas

```typescript
// lib/validations/deal.ts

import { z } from 'zod';

export const createDealSchema = z.object({
  fundId: z.string().cuid(),
  companyName: z.string().min(1, 'Company name is required').max(200),
  name: z.string().max(200).optional(),
  sourceId: z.string().cuid().optional(),
  sourceContact: z.string().max(200).optional(),
  
  // Optional fields
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().max(100).optional(),
  subIndustry: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  
  // Financials (all optional initially)
  revenue: z.number().positive().optional(),
  ebitda: z.number().optional(), // Can be negative
  grossProfit: z.number().optional(),
  askingPrice: z.number().positive().optional(),
  employeeCount: z.number().int().positive().optional(),
  yearFounded: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  
  // Location
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default('USA'),
});

export const updateDealSchema = createDealSchema.partial().extend({
  // Additional fields allowed on update
  stage: z.nativeEnum(DealStage).optional(),
  status: z.nativeEnum(DealStatus).optional(),
  attractivenessScore: z.number().int().min(1).max(10).optional(),
  fitScore: z.number().int().min(1).max(10).optional(),
  riskScore: z.number().int().min(1).max(10).optional(),
  investmentThesis: z.string().max(10000).optional(),
  keyRisks: z.string().max(10000).optional(),
  nextSteps: z.string().max(5000).optional(),
  
  // Key dates
  firstContactDate: z.date().optional(),
  ndaSignedDate: z.date().optional(),
  cimReceivedDate: z.date().optional(),
  managementMeetingDate: z.date().optional(),
  loiSubmittedDate: z.date().optional(),
  loiAcceptedDate: z.date().optional(),
  exclusivityStartDate: z.date().optional(),
  exclusivityEndDate: z.date().optional(),
  expectedCloseDate: z.date().optional(),
});

export const dealStageChangeSchema = z.object({
  stage: z.nativeEnum(DealStage),
  reason: z.string().max(1000).optional(),
});

export const passDealSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(2000),
  passedBy: z.string().optional(),
});
```

---

## 8. Related Documents

- `02_PRD_Schema.md` - Database models for Deal, DealContact, DueDiligenceItem
- `08_Business_Rules.md` - Stage transition rules, required fields by stage
- `09_Claude_Instructions.md` - Implementation guidance
