# BlackGem — Session Handoff Document

> Documento base para continuar desarrollo en nueva sesión.
> Actualizado: 2026-02-13
> Último PR mergeado: #36 (Sprint 12 — Security hardening & type safety)

---

## 1. Estado General del Proyecto

- **MVP Completion:** ~99.5%
- **Tech Stack:** Next.js 15.5.10, React 19, TypeScript, Prisma 6, PostgreSQL (Neon), Tailwind CSS 4, NextAuth v5 (beta.30), jsPDF, Resend
- **Repo:** https://github.com/rfarias23/BlackGems
- **Branch principal:** `main` (commit `9e98ea4`)
- **Dev server:** `localhost:3002` (corre desde `~/Desktop/BlackGem`)
- **Tests:** 180/180 pass (10 test files, Vitest)
- **TypeScript:** Zero `any` types, zero `eslint-disable`, zero `@ts-ignore`
- **Build:** Clean — `npm run build` passes with zero errors

---

## 2. Estado Limpio — No Hay Pendientes de Código

- Working tree limpio — nada sin commitear
- Branches: solo `main` + `origin/main` (15 remote branches + 1 local limpiados)
- Worktrees: ninguno activo
- Resend: instalado manualmente en node_modules (npm install cuelga en esta máquina)

---

## 3. PRs — Historial Completo

| PR | Sprint | Título | Estado |
|----|--------|--------|--------|
| #36 | 12 | Security hardening & type safety | MERGED |
| #35 | 11 | Testing & shared module extraction | MERGED |
| #34 | 10 | Reports & communications (PDF reports, investor comms, CSV export) | MERGED |
| #33 | 9 | LP Portal enhancement (waterfall, profile edit, docs, acknowledgment) | MERGED |
| #32 | 8 | Capital & distributions polish (summary cards, workflow, PDF notices) | MERGED |
| #31 | 7 | Portfolio module (financials, KPIs, valuation) | MERGED |
| #30 | 6 | Deals module completion (filters, analytics, tasks) | MERGED |
| #29 | 5 | Pagination, security, build fix | MERGED |
| #28 | — | Codify Product & Engineering Ethos (CLAUDE.md) | MERGED |
| #27 | — | Harden session validation & add LP portal PDF exports | MERGED |
| #26 | 4 | Deal conversion, PDFs, LP invites, notifications | MERGED |
| #25 | 3 | Audit logging, fund access, error boundaries & tests | MERGED |
| #24 | — | Brand identity dark theme corrections | MERGED |
| #23 | 2 | IRR, waterfall, charts & CSV export | MERGED |
| #22 | 1 | Audit, Soft Deletes, Fund Access | MERGED |
| #21 | — | Section transitions, smooth scroll & preview images | MERGED |
| #20 | — | Logo font size fix | MERGED |
| #19 | — | Chain pattern animation fix | MERGED |
| #18 | — | Landing page UX enhancements | MERGED |
| #17 | — | BlackGem landing page — 9 sections | MERGED |

**No hay PRs abiertos.**

---

## 4. Lo Que Se Completó en Sprint 12 (PR #36)

### Security Hardening
- **commitments.ts rewritten:** Added `requireFundAccess()` to all 3 mutations, Zod validation schemas, `try/catch` error handling, `computeChanges()` for audit diffs
- **Fund access verified:** All server action files confirmed to have `requireFundAccess()` on mutations

### Type Safety
- **Zero `any` types:** All 13 `Record<string, any>` replaced with `Record<string, unknown>` across action files
- **Shared formatters consolidated:** 7 duplicate formatter functions removed from 4 action files, replaced with imports from `src/lib/shared/formatters.ts`
- **NumericValue type:** `type NumericValue = Decimal | number | string | null | undefined` — single source of truth
- **Zod bug fix:** `.errors[0]` → `.issues[0]` (Zod v3 uses `.issues`)

### Dark Mode
- **edit-deal-dialog.tsx:** Applied hardcoded hex `const dark = {...} as const` pattern for portal rendering

---

## 5. Gaps Restantes para Producción

Solo quedan 2 items:

### 5.1 Environment Variables
- `RESEND_API_KEY` — Requerido para emails de invitación LP
- `NEXT_PUBLIC_APP_URL` — Usado en links de invitación

### 5.2 Commitment Model — Soft Delete Migration
- El modelo `Commitment` en Prisma NO tiene campo `deletedAt DateTime?`
- Actualmente usa hard delete con comentario documentando el gap
- **Acción:** Agregar `deletedAt DateTime?` al schema y correr `npx prisma migrate dev`
- Luego actualizar `deleteCommitment()` en `commitments.ts` para usar soft delete

---

## 6. Patrones Arquitectónicos Clave

### Dark Mode
- **Dashboard:** Inline CSS vars en layout div (NO `.dark` class de Tailwind)
- **Portal components** (Dialog, Select, Popover): Hardcoded hex colors
- **Patrón:**
  ```typescript
  const dark = { dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]', ... } as const
  ```

### Server Actions
```
'use server' → auth() → !session?.user?.id check → requireFundAccess() → Zod validation → business logic → logAudit() → revalidatePath()
```

### Shared Formatters
```typescript
// src/lib/shared/formatters.ts — SINGLE SOURCE, never duplicate
import type { Decimal } from '@prisma/client/runtime/library'
type NumericValue = Decimal | number | string | null | undefined
formatCurrency(v) → "$1,234" | null
formatMoney(v) → "$1,234" | "$0"
formatPercentage(v) → "35.1%" | null
formatPercent(v) → "35.1%" | "0%"
formatMultiple(v) → "2.50x" | "-"
parseMoney("$1,234") → 1234
parsePercent("85%") → 0.85
```

### Brand Colors (NUNCA cambiar)
- Primary: `#11141D` | Accent: `#3E5CFF` | Text: `#F8FAFC` | Muted: `#94A3B8` | Border: `#334155`

### Prisma Gotchas
- `Commitment` (no `CapitalCommitment`) | `VerificationToken` (no `InvitationToken`)

### npm install Workaround
npm install cuelga en esta máquina. Para instalar packages:
```bash
curl -sL https://registry.npmjs.org/<package>/-/<package>-<version>.tgz -o /tmp/pkg.tgz
tar -xzf /tmp/pkg.tgz -C node_modules/<package> --strip-components=1
# Repetir recursivamente para transitive deps
```

---

## 7. Siguiente Feature: Deal Analytics Dashboard

### Contexto
El Deal Analytics Dashboard es la primera feature post-MVP. El objetivo es agregar analytics a nivel de pipeline en la página de deals (`/deals`), complementando la vista de analytics por deal individual que ya existe.

### Lo que YA existe
- **Single-deal analytics:** `src/components/deals/deal-analytics.tsx` — Financial Overview (4 metrics), Valuation Metrics (3), Margin Analysis (3), Pipeline Timeline (progress bar + 5 day metrics). Usa componente `MetricCard` con variantes.
- **Chart data functions:** `src/lib/actions/chart-data.ts` — `getPortfolioPerformance()`, `getFundAllocation()`, `getHistoricalIRR()`. Trabajan con portfolio companies, no con deals.
- **Reports aggregations:** `src/lib/actions/reports.ts` — `generateFundReport()` agrega metrics de fund-level (total committed, called, distributed, IRR, MOIC).
- **Deal model fields sin usar:** `attractivenessScore`, `fitScore`, `riskScore`, `source`, `sourceContact`, `employeeCount`, `yearFounded`, `subIndustry`, `businessModel` — disponibles en Prisma schema.

### Lo que FALTA construir
1. **Pipeline-level aggregations:** Server action `getDealPipelineAnalytics()` que calcule:
   - Deal count by stage (funnel visualization)
   - Total pipeline value (sum of askingPrice by stage)
   - Avg days in pipeline, conversion rates between stages
   - Win/loss ratios
2. **Pipeline analytics component:** Nuevo componente para `/deals` page con:
   - Stage funnel (horizontal bar chart or stacked bars, NO pie/donut charts)
   - Pipeline value summary cards
   - Conversion metrics
   - Time-in-stage analysis
3. **Integration:** Agregar el componente a `src/app/(dashboard)/deals/page.tsx` above or below the DealTable

### Design Constraints
- NO pie charts, donut charts, or 3D charts (prohibited in CLAUDE.md)
- Financial numbers: `font-mono tabular-nums`
- Section titles: `font-serif`
- Use existing `MetricCard` pattern from `deal-analytics.tsx`
- Dark mode via CSS vars (dashboard context, not portal)

---

## 8. Testing

- **180/180 tests pass** (10 test files)
- **Fallo pre-existente:** `audit.test.ts` falla sin `DATABASE_URL` — documentado, no es bug
- **TypeScript:** Clean — `npx tsc --noEmit` pasa (0 errores)
- **Build:** `npm run build` exitoso
- **Lint:** `npm run lint` limpio

---

## 9. Archivos Clave por Módulo

### Server Actions
| File | Module |
|------|--------|
| `src/lib/actions/deals.ts` | Deal CRUD + pipeline + conversion |
| `src/lib/actions/investors.ts` | Investor CRUD + LP management |
| `src/lib/actions/portfolio.ts` | Portfolio companies + valuations |
| `src/lib/actions/capital-calls.ts` | Capital call lifecycle |
| `src/lib/actions/distributions.ts` | Distribution lifecycle |
| `src/lib/actions/commitments.ts` | LP commitments (hardened in PR #36) |
| `src/lib/actions/reports.ts` | Fund reports + CSV export |
| `src/lib/actions/chart-data.ts` | Chart aggregations |
| `src/lib/actions/tasks.ts` | Deal task management |
| `src/lib/actions/settings.ts` | Fund settings + profile |
| `src/lib/actions/notifications.ts` | Notification CRUD + broadcast |
| `src/lib/actions/users.ts` | LP invitations + user management |

### Shared Libraries
| File | Purpose |
|------|---------|
| `src/lib/shared/formatters.ts` | Currency, percentage, multiple formatters |
| `src/lib/shared/fund-access.ts` | `requireFundAccess()` guard |
| `src/lib/shared/audit.ts` | `logAudit()` + `computeChanges()` |
| `src/lib/shared/soft-delete.ts` | `notDeleted` Prisma filter |
| `src/lib/shared/pagination.ts` | Pagination utilities |
| `src/lib/shared/rate-limit.ts` | Rate limiting |
| `src/lib/shared/workflow-transitions.ts` | State machine transitions |

### Key Components
| File | Purpose |
|------|---------|
| `src/components/deals/deal-analytics.tsx` | Single-deal analytics (MetricCard pattern) |
| `src/components/deals/deal-filters.tsx` | Deal pipeline filters |
| `src/components/deals/deal-table.tsx` | Deal list table |
| `src/components/deals/edit-deal-dialog.tsx` | Inline deal editing |
| `src/components/portfolio/portfolio-*.tsx` | Portfolio module components |
| `src/components/portal/portal-*.tsx` | LP portal components |
| `src/components/ui/data-pagination.tsx` | Reusable pagination |

---

## 10. Post-MVP Feature Prioritization

Based on exploration session (2026-02-13):

### Tier 1 — High Impact, Ready to Build
1. **Deal Analytics Dashboard** ← NEXT (exploration complete, see section 7)
2. **Document Management System** — upload, versioning, deal room
3. **Advanced Reporting** — custom date ranges, comparison periods

### Tier 2 — Medium Impact
4. **Deal Scoring System** — use existing unused Prisma fields
5. **Investor Communications Hub** — bulk comms, templates
6. **Portfolio Monitoring Dashboard** — KPI trends over time

### Tier 3 — Nice to Have
7. **Activity Feed / Timeline** — deal history visualization
8. **Role-Based Permissions** — granular access beyond fund-level
9. **API Integration Layer** — webhooks, external data sources

### Infrastructure (when ready)
- GCP migration (Cloud Run + Cloud SQL)
- CI/CD pipeline
- Monitoring & alerting
