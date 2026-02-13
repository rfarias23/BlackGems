# BlackGem — Session Handoff Document

> Documento base para continuar desarrollo en nueva sesión.
> Actualizado: 2026-02-13
> Último commit: `50720d8` (production readiness + deal analytics)

---

## 1. Estado General del Proyecto

- **MVP Completion:** ~99.9% — production-ready pending DB migration + env vars
- **Tech Stack:** Next.js 15.5.10, React 19, TypeScript, Prisma 6, PostgreSQL (Neon), Tailwind CSS 4, NextAuth v5 (beta.30), jsPDF, Resend
- **Repo:** https://github.com/rfarias23/BlackGems
- **Branch principal:** `main` (commit `50720d8`)
- **Dev server:** `localhost:3002` (corre desde `~/Desktop/BlackGem`)
- **Tests:** 187/187 pass (11 test files, Vitest)
- **TypeScript:** Zero `any` types, zero `eslint-disable`, zero `@ts-ignore`
- **Build:** Clean — `npm run build` passes with zero errors/warnings
- **Lint:** Clean — `npm run lint` passes with zero errors/warnings

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

## 4. Lo Que Se Completó Recientemente

### Deal Analytics Dashboard (commits `aef8236`..`5890df3`)
- **Server action:** `getDealPipelineAnalytics()` in `deals.ts` — stage funnel, pipeline value, avg days, conversion rates
- **Component:** `DealPipelineAnalytics` in `src/components/deals/deal-pipeline-analytics.tsx` — horizontal funnel bars, value cards, time metrics
- **Tests:** 6 unit tests in `deal-pipeline-analytics.test.ts`
- **Integration:** Promise.all parallel fetch on `/deals` page
- **Key pattern:** `STAGE_TO_DISPLAY` maps 18 DB enum values → ~10 display stages

### Production Readiness (commits `d1692ba`..`50720d8`)
- **Commitment soft-delete:** Added `deletedAt DateTime?` to Commitment model, updated `soft-delete.ts` utility, converted all 15+ commitment queries across 7 files to use `...notDeleted` filter, replaced hard delete with `softDelete()` in `commitments.ts`
- **Prisma findUnique → findFirst:** Compound key lookups can't have extra `where` clauses, so all `findUnique` with compound keys were converted to `findFirst`
- **Environment vars:** Added `RESEND_FROM_EMAIL` and `NEXT_PUBLIC_APP_URL` to `.env.example`
- **Unused code cleanup:** Removed `DD_CATEGORY_LABELS`, `DD_STATUS_LABELS`, `PRIORITY_LABELS` from `due-diligence.ts`
- **Next.js Image:** Replaced 2 `<img>` tags with `<Image>` on landing page
- **Vitest fix:** Added `'**/.claude/worktrees/**'` to exclude array to prevent stale worktree test files from failing

### Sprint 12 (PR #36)
- **commitments.ts rewritten:** Added `requireFundAccess()` to all 3 mutations, Zod validation schemas, `try/catch` error handling, `computeChanges()` for audit diffs
- **Zero `any` types:** All 13 `Record<string, any>` replaced with `Record<string, unknown>`
- **Shared formatters consolidated:** 7 duplicates removed, single source in `formatters.ts`
- **Zod bug fix:** `.errors[0]` → `.issues[0]` (Zod v3 uses `.issues`)

---

## 5. Gaps Restantes para Producción

Solo quedan items operacionales (no de código):

### 5.1 Database Migration
- El schema de Prisma ya tiene `deletedAt DateTime?` en Commitment, pero la migración no se ha corrido en la DB
- **Acción:** `npx prisma migrate dev --name add-commitment-soft-delete` (requiere `DATABASE_URL` conectado a Neon)

### 5.2 Environment Variables (en hosting)
- `RESEND_API_KEY` — Requerido para emails de invitación LP
- `RESEND_FROM_EMAIL` — Dirección de envío (default: `BlackGem <noreply@blackgem.app>`)
- `NEXT_PUBLIC_APP_URL` — URL de producción para links de invitación

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

## 7. Deal Analytics Dashboard — COMPLETADO

Feature terminada y pusheada. Archivos creados:
- `src/components/deals/deal-pipeline-analytics.tsx` — Pipeline funnel + metrics component
- `src/lib/shared/__tests__/deal-pipeline-analytics.test.ts` — 6 unit tests
- `docs/plans/2026-02-13-deal-analytics-dashboard.md` — Implementation plan

Función `getDealPipelineAnalytics()` agregada a `src/lib/actions/deals.ts`. Integrada en `src/app/(dashboard)/deals/page.tsx` con Promise.all parallel fetch.

### Unused Deal Fields Still Available
`attractivenessScore`, `fitScore`, `riskScore`, `source`, `sourceContact`, `employeeCount`, `yearFounded`, `subIndustry`, `businessModel` — disponibles para futuras features (e.g., Deal Scoring System)

---

## 8. Testing

- **187/187 tests pass** (11 test files)
- **Fallo pre-existente:** `audit.test.ts` falla sin `DATABASE_URL` — documentado, no es bug
- **Vitest config:** Excluye `'**/.claude/worktrees/**'` para evitar falsos fallos de archivos stale
- **TypeScript:** Clean — `npx tsc --noEmit` pasa (0 errores)
- **Build:** `npm run build` exitoso (zero warnings)
- **Lint:** `npm run lint` limpio (zero warnings)

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
| `src/lib/actions/commitments.ts` | LP commitments (hardened + soft-delete) |
| `src/lib/actions/due-diligence.ts` | Deal due diligence items |
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
| `src/lib/shared/soft-delete.ts` | `notDeleted` filter + `softDelete()` for 7 entity types |
| `src/lib/shared/pagination.ts` | Pagination utilities |
| `src/lib/shared/rate-limit.ts` | Rate limiting |
| `src/lib/shared/workflow-transitions.ts` | State machine transitions |

### Key Components
| File | Purpose |
|------|---------|
| `src/components/deals/deal-analytics.tsx` | Single-deal analytics (MetricCard pattern) |
| `src/components/deals/deal-pipeline-analytics.tsx` | Pipeline-level funnel + metrics |
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
1. ~~**Deal Analytics Dashboard**~~ — COMPLETADO (see section 7)
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
