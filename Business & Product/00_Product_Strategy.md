# BlackGem - Product Strategy & Vision

## Document Information
| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | January 25, 2026 |
| Author | NIRO Group LLC |
| Document Type | Product Strategy |
| Audience | Stakeholders, Product Team, Development Team |

---

## 1. Executive Summary

### 1.1 The Problem

Search Fund principals and small PE fund managers currently operate with a fragmented toolkit: spreadsheets for deal tracking, separate CRMs for investor relations, manual calculations for capital accounts, and ad-hoc document storage. This creates several painful problems:

**For Fund Managers:**
- Hours spent on administrative tasks instead of deal sourcing and value creation
- Risk of errors in capital calculations and investor communications
- Difficulty maintaining consistent LP reporting
- No single source of truth for fund operations
- Professional image undermined by inconsistent, manual processes

**For Limited Partners:**
- Limited visibility into their investment
- Delayed access to reports and tax documents
- No self-service capability for basic information
- Inconsistent communication experience across different funds

### 1.2 Our Solution

A purpose-built platform that serves as the **operating system for search funds and small PE funds**, consolidating all critical workflows into one integrated system:

- **Deal Pipeline Management** → Find and close the right acquisition
- **Investor Relations** → Build trust through transparency and professionalism  
- **Portfolio Monitoring** → Track and improve company performance
- **Capital Operations** → Manage fund economics accurately and efficiently
- **Reporting & Compliance** → Communicate professionally and stay compliant

### 1.3 Why Now?

The search fund asset class is growing rapidly. Stanford GSB reports over 500 search funds raised in the past decade, with the pace accelerating. Yet there is no purpose-built software for this specific use case. Generic PE software is expensive and over-featured; spreadsheets are error-prone and unprofessional.

There's a clear market gap for an affordable, focused solution designed specifically for the search fund and micro-PE segment.

### 1.4 Success Vision

**In 12 months:** The platform is used daily by NIRO Group LLC to manage fund operations, demonstrating clear time savings and improved LP satisfaction.

**In 24 months:** The platform is offered to other search fund principals, creating a community of users and potential revenue stream.

**In 36 months:** The platform becomes the standard operating system for search funds globally, with integrations to the broader PE ecosystem.

---

## 2. Target Users & Personas

### 2.1 Primary Persona: The Search Fund Principal

**Name:** Carlos, 32  
**Background:** MBA graduate, 3 years in investment banking, now running his own search fund  
**Fund Size:** $400K search capital from 12 LPs  
**Stage:** 8 months into search, evaluating 3 active deals

**Goals:**
- Find and acquire a great company in the next 12 months
- Maintain strong relationships with LPs who may co-invest in the acquisition
- Look professional and organized despite being a one-person operation
- Minimize time on administrative tasks to maximize deal sourcing time

**Pain Points:**
- Spends 8-10 hours/week on administrative tasks (spreadsheet updates, LP emails)
- Embarrassed when LPs ask for information and he needs to "get back to them"
- Worried about making calculation errors that could damage credibility
- Struggles to keep track of all deal details and next steps
- No system for DD tracking—relies on personal notes and memory

**Technology Comfort:** High. Uses Notion, Airtable, various SaaS tools. Wishes there was something purpose-built.

**Quote:** *"I spend more time updating spreadsheets than talking to business owners. There has to be a better way."*

---

### 2.2 Secondary Persona: The Limited Partner

**Name:** Patricia, 58  
**Background:** Retired executive, angel investor, LP in 4 search funds  
**Investment:** $50K commitment in Carlos's fund

**Goals:**
- Monitor investment performance without being intrusive
- Access tax documents (K-1s) easily during tax season
- Feel confident the fund is well-managed
- Stay informed about major developments

**Pain Points:**
- Different funds provide different levels of transparency
- Has to email fund managers for basic information
- Tax documents sometimes arrive late
- Forgets details about each fund investment

**Technology Comfort:** Medium. Uses email and basic apps. Prefers simple, clean interfaces.

**Quote:** *"I want to support Carlos, not bother him with questions. But I shouldn't have to wait weeks to know how my investment is doing."*

---

### 2.3 Tertiary Persona: The Fund Analyst

**Name:** Miguel, 26  
**Background:** Recently hired to support a search fund that's preparing for acquisition  
**Role:** Research deals, prepare materials, manage DD process

**Goals:**
- Keep deal information organized and accessible
- Complete DD items on time without dropping balls
- Prepare accurate reports for the principal
- Learn the search fund business

**Pain Points:**
- Inherited messy spreadsheets with unclear formulas
- Unclear what's been done vs. what's pending on each deal
- Multiple versions of documents floating around
- No clear task management tied to deals

**Technology Comfort:** High. Would prefer modern tools over legacy systems.

**Quote:** *"I want a system where I can see exactly what needs to be done and mark it complete when it's done. Not hunt through email threads."*

---

## 3. User Journeys

### 3.1 Journey: Evaluating a New Deal

**Actor:** Carlos (Principal)  
**Trigger:** Receives CIM from a broker for a potential target

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: NEW DEAL EVALUATION                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] RECEIVE CIM        [2] QUICK ADD         [3] INITIAL REVIEW           │
│  ───────────────        ──────────────        ─────────────────            │
│  Broker sends CIM       Add deal in 30 sec   Review financials             │
│  via email              - Company name        Score attractiveness          │
│                         - Source: broker      Decide: pursue or pass        │
│                         - Upload CIM                                        │
│         │                      │                      │                     │
│         ▼                      ▼                      ▼                     │
│                                                                             │
│  [4] DEEP ANALYSIS      [5] MANAGEMENT MTG    [6] DECISION POINT           │
│  ─────────────────      ─────────────────     ─────────────────            │
│  Enter financials       Log meeting notes     Document thesis               │
│  Research industry      Add contacts          Identify key risks            │
│  Compare to criteria    Update stage          Move to LOI or Pass           │
│                                                                             │
│         │                      │                      │                     │
│         ▼                      ▼                      ▼                     │
│                                                                             │
│  If pursuing:                                                               │
│                                                                             │
│  [7] LOI PROCESS        [8] DUE DILIGENCE     [9] CLOSE & CONVERT          │
│  ───────────────        ────────────────      ─────────────────            │
│  Draft LOI              DD checklist auto-    Record close terms            │
│  Track negotiations     populated             Convert to portfolio          │
│  Log all interactions   Assign items          Notify LPs                    │
│                         Track completion      Update fund status            │
│                         Flag red flags                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- Time to add new deal: < 1 minute
- All deal information in one place: 100%
- DD items tracked without manual effort: Yes
- Conversion from deal to portfolio: Automated

---

### 3.2 Journey: Quarterly LP Update

**Actor:** Carlos (Principal)  
**Trigger:** End of quarter, time to update investors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: QUARTERLY LP UPDATE                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] GATHER DATA        [2] BUILD REPORT      [3] REVIEW & EDIT            │
│  ──────────────         ─────────────         ─────────────────            │
│  System auto-pulls:     Select template       Add narrative                 │
│  - Fund metrics         System populates:     Customize charts              │
│  - Portfolio perf       - KPIs                Add personal notes            │
│  - Capital account      - Financials          Preview PDF                   │
│                         - Charts                                            │
│         │                      │                      │                     │
│         ▼                      ▼                      ▼                     │
│                                                                             │
│  [4] APPROVE            [5] DISTRIBUTE        [6] TRACK ENGAGEMENT         │
│  ──────────────         ─────────────         ────────────────             │
│  Final review           One-click send        See who viewed               │
│  Get sign-off           to all LPs            (portal analytics)            │
│  (if needed)            Auto-upload to        Log any follow-up            │
│                         LP portal             questions                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Current State (Pain):**
- 4-6 hours to compile data from multiple spreadsheets
- Risk of copy-paste errors
- Manual PDF creation and email distribution
- No visibility into who read the update

**Future State (Platform):**
- < 1 hour total (data pre-populated)
- Zero calculation errors
- Professional, consistent formatting
- Clear visibility through portal analytics

---

### 3.3 Journey: LP Checking Investment

**Actor:** Patricia (LP)  
**Trigger:** Wants to check investment status before meeting with her accountant

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: LP INVESTMENT CHECK                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] LOGIN TO PORTAL    [2] VIEW DASHBOARD    [3] ACCESS DOCUMENTS         │
│  ──────────────────     ────────────────      ────────────────             │
│  Simple email login     See at a glance:      Download K-1                  │
│  (magic link or         - Commitment          Download statements           │
│  password)              - Paid-in             Download past reports         │
│                         - Current value                                     │
│                         - Recent news                                       │
│         │                      │                      │                     │
│         ▼                      ▼                      ▼                     │
│                                                                             │
│  [4] (OPTIONAL)         [5] LOG OUT                                        │
│  ─────────────          ────────                                           │
│  Read latest update                                                         │
│  View portfolio                                                             │
│  summary                                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Success Metrics:**
- Time from login to finding K-1: < 30 seconds
- Questions to fund manager reduced by: 80%
- LP satisfaction score: > 4.5/5

---

## 4. Value Proposition

### 4.1 Value Proposition Canvas

**For Search Fund Principals:**

| Customer Jobs | Pains | Gains |
|---------------|-------|-------|
| Track potential acquisitions | Scattered information in multiple tools | Single source of truth for all deals |
| Manage LP relationships | Manual, error-prone capital accounting | Automated, accurate calculations |
| Report to investors | Time-consuming report creation | One-click professional reports |
| Monitor portfolio performance | No dashboard, relies on ad-hoc analysis | Real-time KPIs and financials |
| Stay organized | Overwhelmed by tasks and follow-ups | Clear task management tied to deals |

**Our Value Proposition Statement:**

> **For search fund principals** who are overwhelmed by administrative tasks, **BlackGem** is a **fund management system** that **automates deal tracking, investor relations, and reporting** unlike **spreadsheets and generic CRMs** which are **fragmented, error-prone, and unprofessional**.

### 4.2 Key Differentiators

| vs. Spreadsheets | vs. Generic PE Software | vs. CRMs |
|------------------|------------------------|----------|
| Automated calculations | Affordable pricing | Purpose-built workflows |
| Built-in workflows | Right-sized features | Integrated capital accounting |
| Professional outputs | Search fund specific | LP portal included |
| Collaboration ready | Quick to implement | Full fund lifecycle |
| Audit trail | No enterprise sales cycle | Document management |

---

## 5. MVP Definition

### 5.1 MVP Scope (MoSCoW)

**MUST HAVE (MVP Launch):**

| Feature | Rationale |
|---------|-----------|
| User authentication with roles | Security foundation |
| Fund setup and configuration | Core entity |
| Deal pipeline (CRUD, stages, status) | Primary daily workflow |
| Deal detail with contacts, notes | Track all deal information |
| Basic activity logging | Know what happened when |
| Document upload and storage | Centralize documents |
| Investor list and detail | Track LP commitments |
| Basic capital account view | Show paid-in vs. committed |
| Simple dashboard | At-a-glance fund status |

**SHOULD HAVE (v1.1 - 4 weeks post-MVP):**

| Feature | Rationale |
|---------|-----------|
| Due diligence checklist | Critical for active deals |
| LP Portal (read-only) | High LP value, differentiator |
| Kanban view for deals | User preference |
| Capital call creation | Core fund operation |
| Basic quarterly report builder | Recurring LP need |

**COULD HAVE (v1.2 - 8 weeks post-MVP):**

| Feature | Rationale |
|---------|-----------|
| Portfolio company module | Post-acquisition need |
| Distribution management | Less frequent than capital calls |
| Full reporting suite | Can use manual process initially |
| Document versioning | Nice to have |
| Advanced analytics | Optimization feature |

**WON'T HAVE (Future / Out of Scope):**

| Feature | Rationale |
|---------|-----------|
| Multi-currency support | Complexity, limited need initially |
| Automated bank integrations | Security complexity |
| Mobile native apps | Responsive web is sufficient |
| AI deal scoring | Future innovation |
| Marketplace / deal sharing | Different product |

### 5.2 MVP Success Criteria

The MVP is successful if, after 30 days of use:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active usage | > 5 days/week | Analytics |
| Deals tracked in platform | 100% of active deals | Data check |
| Time on admin tasks | Reduced by 30% | User survey |
| User satisfaction (NPS) | > 40 | Survey |
| Critical bugs | 0 open | Bug tracker |

---

## 6. Product Principles

These principles guide all product decisions:

### 6.1 Simplicity Over Features

> *"Do fewer things, but do them exceptionally well."*

We will resist the temptation to add features that serve edge cases. Every feature must serve the core workflow of a search fund principal managing their fund.

**Example:** We won't add complex LP permission hierarchies until we have clear demand. A simple "can view" or "can't view" is sufficient for MVP.

### 6.2 Speed Over Perfection

> *"A busy principal should be able to add a deal in under 60 seconds."*

Every interaction should be fast. Data entry should be minimal. Smart defaults should reduce clicks. If a workflow takes more than 3 clicks, we should question if it's necessary.

**Example:** When adding a deal, only company name and source are required. Everything else can be added later.

### 6.3 Trust Through Accuracy

> *"One calculation error destroys months of credibility."*

Financial calculations must be correct. Period. We will test extensively and show our math. Users should never question if a number is right.

**Example:** Capital account statements will show every transaction that contributed to the balance—full audit trail, always.

### 6.4 Professional Polish

> *"The platform should make a one-person fund look like a sophisticated operation."*

Every output (reports, emails, PDFs) should look professional. The LP portal should feel trustworthy. Design matters because it reflects on our users.

**Example:** Reports should be clean, well-formatted, and suitable for an institutional LP without any modifications.

### 6.5 Transparent Defaults

> *"The user should always understand what the system is doing and why."*

No black boxes. When we calculate IRR, show the inputs. When we change a status, explain why. Users should feel in control, not confused.

**Example:** The waterfall calculation will include a step-by-step breakdown, not just a final number.

---

## 7. Metrics & KPIs

### 7.1 North Star Metric

**"Weekly Active Fund Hours Managed"**

This composite metric captures:
- Number of active users
- Depth of engagement (actually using the platform for real work)
- Value delivered (hours of fund management work)

*Calculation:* (Active Funds) × (Avg. Hours/Week in Platform) × (Engagement Depth Score)

### 7.2 Product Health Metrics

| Category | Metric | Target | Frequency |
|----------|--------|--------|-----------|
| **Engagement** | Daily Active Users / Monthly Active Users | > 40% | Weekly |
| **Engagement** | Sessions per User per Week | > 4 | Weekly |
| **Engagement** | Avg. Session Duration | 8-15 min | Weekly |
| **Activation** | % of new users who add a deal in first session | > 70% | Weekly |
| **Retention** | 30-day retention | > 80% | Monthly |
| **Feature Adoption** | % of deals with DD checklist used | > 60% | Monthly |
| **Feature Adoption** | % of funds using LP portal | > 50% | Monthly |
| **Quality** | Reported bugs per week | < 3 | Weekly |
| **Quality** | Support tickets per user per month | < 1 | Monthly |
| **Satisfaction** | NPS Score | > 50 | Quarterly |
| **Satisfaction** | LP Portal satisfaction | > 4.5/5 | Quarterly |

### 7.3 Business Metrics (Future)

| Metric | Description |
|--------|-------------|
| Funds Onboarded | Total active funds on platform |
| AUM on Platform | Total committed capital managed |
| Revenue | If/when monetized |
| CAC / LTV | Customer acquisition cost vs. lifetime value |

---

## 8. Risks & Mitigations

### 8.1 Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Feature creep delays MVP** | High | High | Strict MoSCoW enforcement; defer nice-to-haves |
| **Calculation errors damage trust** | Medium | Critical | Extensive testing; manual verification for v1 |
| **Too complex for target user** | Medium | High | User testing; progressive disclosure; simplify |
| **Poor mobile experience** | Medium | Medium | Responsive design from day 1; test on devices |
| **Security breach** | Low | Critical | Follow security best practices; audit |

### 8.2 Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Competitor enters market** | Medium | Medium | Move fast; build relationships; focus on UX |
| **Search fund market shrinks** | Low | High | Design for broader micro-PE market |
| **Users prefer spreadsheets** | Medium | Medium | Prove value quickly; offer import tools |

---

## 9. Roadmap Overview

### 9.1 High-Level Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PRODUCT ROADMAP - 2026                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Q1 2026: FOUNDATION                                                         │
│ ─────────────────────                                                       │
│ • MVP Development (Weeks 1-10)                                              │
│ • Internal alpha testing (Weeks 8-12)                                       │
│ • MVP Launch for NIRO Group LLC (Week 12)                                   │
│                                                                             │
│ Q2 2026: CORE COMPLETION                                                    │
│ ─────────────────────────                                                   │
│ • LP Portal launch                                                          │
│ • Capital calls & distributions                                             │
│ • Portfolio company module                                                  │
│ • Reporting suite v1                                                        │
│                                                                             │
│ Q3 2026: POLISH & EXPAND                                                    │
│ ─────────────────────────                                                   │
│ • Advanced analytics                                                        │
│ • Document management improvements                                          │
│ • Performance optimization                                                  │
│ • Consider beta users (other search funds)                                  │
│                                                                             │
│ Q4 2026: SCALE                                                              │
│ ───────────────────                                                         │
│ • Multi-fund support                                                        │
│ • Beta program expansion                                                    │
│ • Integrations (accounting, email)                                          │
│ • Monetization exploration                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Future Vision Features (Backlog Ideas)

These are ideas for the future, not commitments:

| Feature | Value | Complexity | Priority |
|---------|-------|------------|----------|
| Deal sourcing integrations (Axial, brokers) | High | High | Medium |
| AI-powered deal scoring | High | High | Low |
| Automated K-1 generation | High | Medium | Medium |
| Bank account integration | Medium | High | Low |
| LP co-investment workflow | Medium | Medium | Medium |
| Search fund community features | Medium | Medium | Low |
| Mobile native apps | Low | High | Low |
| White-label for accelerators | Medium | Medium | Low |

---

## 10. Open Questions

Questions to resolve through user research or early usage:

1. **LP Portal depth:** How much information do LPs actually want to see? Detailed financials or just summary?

2. **Deal templates:** Should we provide industry-specific DD checklists, or let users build their own?

3. **Collaboration model:** If a search fund has a co-searcher, how should permissions work?

4. **Valuation guidance:** Should we provide valuation methodology suggestions, or is that overstepping?

5. **Report frequency:** Do LPs prefer quarterly updates only, or would monthly summaries add value?

6. **Mobile priority:** Is responsive web sufficient, or do principals need offline mobile access?

---

## 11. Appendix: Competitive Landscape

### 11.1 Alternative Solutions

| Solution | Strengths | Weaknesses | Our Advantage |
|----------|-----------|------------|---------------|
| **Spreadsheets** (Excel, Sheets) | Familiar, flexible, free | Error-prone, no collaboration, unprofessional | Automated, professional, integrated |
| **Notion/Airtable** | Flexible, modern | No financial logic, DIY setup, no LP portal | Purpose-built, calculations included |
| **Generic CRM** (HubSpot, Salesforce) | Robust, integrations | Not designed for PE, expensive, complex | Right-sized, affordable, specific workflows |
| **PE Software** (Juniper Square, Carta) | Full-featured, established | Expensive ($10K+/yr), enterprise-focused, overkill | Affordable, search fund specific, quick to adopt |
| **Fund Admin Services** | Hands-off, expert | Expensive, loss of control, overkill for search | Self-service, real-time, cost-effective |

### 11.2 Positioning

We position in the **"right-sized" quadrant**: more featured than DIY solutions, but simpler and cheaper than enterprise PE software.

```
                        MORE FEATURES
                             │
                             │
         Enterprise PE      │      [GAP - Our Opportunity]
         Software           │      Purpose-built for
         (Juniper, Carta)   │      Search Funds
                             │
    ─────────────────────────┼─────────────────────────────
    EXPENSIVE                │                    AFFORDABLE
                             │
         Generic CRM         │      DIY Solutions
         (Salesforce)        │      (Spreadsheets, Notion)
                             │
                             │
                        FEWER FEATURES
```

---

## 12. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 25, 2026 | NIRO Group LLC | Initial document |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `01_PRD_Overview.md` | Technical architecture and phases |
| `02_PRD_Schema.md` | Database design |
| `03-07_PRD_Modules` | Feature specifications |
| `08_Business_Rules.md` | Validation logic |
| `09_Claude_Instructions.md` | Implementation guide |
