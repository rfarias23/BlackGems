# BlackGem — Session Handoff Document

> Documento base para continuar desarrollo en nueva sesion.
> Actualizado: 2026-02-17
> Ultimo commit: `1dd7337` (currency migration v2)

---

## 1. Estado General del Proyecto

- **MVP Completion:** 100% — **EN PRODUCCION** en https://www.blackgem.ai
- **Stack:** Next.js 15.5, React 19, TypeScript, Prisma 6, PostgreSQL (AWS RDS), Tailwind CSS 4, NextAuth v5 beta.30, jsPDF, Resend, Sentry
- **Repo:** github.com/rfarias23/BlackGems | Branch: `main` (commit `1dd7337`)
- **Dev server:** localhost:3002
- **Tests:** 310/310 pass (17 test files, Vitest)
- **Total commits:** 201
- **TypeScript:** Zero `any` types, zero `eslint-disable`, zero `@ts-ignore`
- **Build/Lint:** Both pass clean
- **npm install:** Works fine (22s) — previous "hanging" was corrupted node_modules, resolved

---

## 2. Infraestructura de Produccion

### AWS Resources

| Recurso | ID / Valor |
|---------|------------|
| EC2 Instance | `i-02d2ed4c5d598f672` (t3.micro, Amazon Linux 2023) |
| Elastic IP | `3.223.165.121` (`eipalloc-0455088545467ba9b`) |
| Security Group EC2 | `sg-0400b24b78152cde5` (ports 22, 80, 443) |
| Key Pair | `blackgem-ec2` (`~/.ssh/blackgem-ec2.pem`) |
| IAM Role | `blackgem-ec2-role` (ECR read-only) |
| Instance Profile | `blackgem-ec2-profile` |
| ECR Registry | `829163697507.dkr.ecr.us-east-1.amazonaws.com/blackgem` |
| RDS Host | `blackgem-prod.ca9mk6ayu74v.us-east-1.rds.amazonaws.com` |
| RDS Security Group | `sg-0cf5124eab58f6333` |
| VPC | `vpc-02aa023e74e9bbbf1` |
| Subnet | `subnet-0ab0f906e21192128` |
| Region | `us-east-1` |

### Dominio & TLS

| Item | Valor |
|------|-------|
| Dominio | `blackgem.ai` (GoDaddy) |
| DNS A records | `@` y `www` -> `3.223.165.121` |
| TLS | Let's Encrypt via certbot (auto-renew, expira 2026-05-16) |
| nginx config | `/etc/nginx/conf.d/blackgem.conf` |

### Stack de Produccion

```
GitHub push -> GitHub Actions -> Docker build -> ECR push -> SSH to EC2 -> docker compose pull + up
```

- **Dockerfile:** Multi-stage build, `--chown=nextjs:nodejs`, standalone output
- **Docker Compose:** `/opt/blackgem/docker-compose.yml` (puerto `127.0.0.1:3000:3000`)
- **nginx:** Reverse proxy HTTPS -> localhost:3000, con proxy headers (X-Forwarded-Proto, X-Real-IP)
- **ECR credential helper:** `~/.docker/config.json` con `ecr-login` (via IAM instance profile)
- **Deploy time:** ~2 min 20s (build + push + pull + restart)

### GitHub Secrets Configurados

| Secret | Proposito |
|--------|-----------|
| `AWS_ACCESS_KEY_ID` | ECR push desde GitHub Actions |
| `AWS_SECRET_ACCESS_KEY` | ECR push desde GitHub Actions |
| `EC2_HOST` | `3.223.165.121` |
| `EC2_SSH_KEY` | Contenido de `blackgem-ec2.pem` |

### Variables de Entorno en EC2 (`/opt/blackgem/.env`)

```
DATABASE_URL=postgresql://blackgem_admin:***@blackgem-prod.ca9mk6ayu74v.us-east-1.rds.amazonaws.com:5432/blackgem
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://www.blackgem.ai
NEXT_PUBLIC_APP_URL=https://www.blackgem.ai
AUTH_TRUST_HOST=true
RESEND_API_KEY=re_placeholder          # <-- PENDIENTE: configurar key real
RESEND_FROM_EMAIL=BlackGem <noreply@blackgem.ai>
```

### Notas Importantes de Infra

- **RDS NO es accesible desde local** — Security Group solo permite conexiones desde EC2 SG
- **Para ejecutar SQL en produccion:** SCP archivo al EC2, luego usar Docker psql:
  ```bash
  ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
  DB_URL=$(grep '^DATABASE_URL=' /opt/blackgem/.env | cut -d= -f2-)
  docker run --rm -e DATABASE_URL="$DB_URL" \
    -v /tmp/script.sql:/tmp/script.sql \
    postgres:15-alpine sh -c 'psql "$DATABASE_URL" -f /tmp/script.sql'
  ```
- **`source /opt/blackgem/.env` falla** por `RESEND_FROM_EMAIL=BlackGem <noreply@...>` (el `<` rompe bash). Usar `grep + cut` como workaround.
- **`psql` no esta instalado en EC2** — usar imagen Docker `postgres:15-alpine`

### Acceso SSH

```bash
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
cd /opt/blackgem
docker compose logs --tail 50    # Ver logs
docker compose pull && docker compose up -d  # Redeploy manual
```

---

## 3. Changelog Versionado

### v0.3.0 — Multi-Fund, Multicurrency & Production Hotfix (2026-02-17)

**Commits:** `0adeea7` → `1dd7337` (18 commits)

#### Multi-Fund Architecture
- **Currency enum** added to Prisma schema (`USD`, `EUR`, `GBP`)
- **Currency-aware formatters** — single source `formatCurrency()`, `formatCompactCurrency()` in `src/lib/shared/formatters.ts` with `CurrencyCode` type
- **6 duplicate formatters eliminated** across codebase, replaced with shared implementation
- **All 14 server action files** propagate fund currency from `getActiveFundWithCurrency()`
- **Cookie-based fund persistence** — `src/lib/shared/fund-cookie.ts` with `getActiveFundId()` / `setActiveFundId()`
- **Fund resolution chain** — `getAuthorizedFundId()`: cookie → FundMember → first fund (admin fallback) → null
- **Fund switcher** — sidebar component with currency badges, `+ New Fund` option
- **Create Fund dialog** — name, currency (locked after creation), type (6 options), target size, vintage
- **Fund settings** — currency displayed as read-only badge

#### Production Hotfix: Currency Column Type
- **Root cause:** Initial migration created `Fund.currency` as `TEXT`, Prisma expected `Currency` enum
- **Fix:** `prisma/production-migration-fix-currency.sql` — idempotent script using `pg_type` catalog queries
- **Lesson learned:** Local `$DATABASE_URL` points to Neon (dev), production is RDS. Migration must be executed from EC2.
- **`InvestorType` enum reconciled** — added `JOINT_VENTURE`, `INVESTMENT_FUND` to production
- **Error visibility improved** — `createFund()` now returns actual error message instead of generic text

#### Graceful Degradation
- `getActiveFundWithCurrency()` returns `null` instead of throwing (28+ call sites updated across 17 files)
- All dashboard pages handle missing fund gracefully during migration periods

### v0.2.0 — Features de Alto Impacto & Estabilidad (2026-02-16)

**Commits:** `f467446` → `123e782` (50+ commits)

#### New Features
- **Quarterly Update Builder** — `Report` model, server actions (`createReport`, `approveAndPublish`), section editor UI, jsPDF PDF generation, LP email distribution
- **Deal Scoring System** — 3-axis evaluation (attractiveness, fit, risk), composite score, visual display
- **Deal Source Tracking** — `DealSource` model, source management, auto-linking to deals
- **Portfolio Monitoring Dashboard** — `Valuation` model, KPI trends, sparkline charts, period comparison
- **Investor Communications Hub** — email templates, bulk send, activity logging, Resend integration
- **Sentry Error Monitoring** — `@sentry/nextjs` integrated, lazy-init pattern, `SENTRY_DSN` env var
- **LP Document Visibility** — fund-level document access control for portal users

#### Landing Page Overhaul
- **Copy audit & rewrite** — removed fabricated stats, testimonials, SaaS jargon
- **Pricing moved** to standalone `/pricing` page
- **"Manager Login" → "Login"** across all touchpoints
- **Final screenshots** replaced placeholder images
- **NIRO Group LLC** branding added as parent company
- **"Request Access"** CTA instead of "Get Started"

#### Stability & Security
- **LP route blocking** — defense-in-depth middleware prevents LP users from accessing dashboard routes
- **Resilient data loading** — `Promise.allSettled` in reports page, graceful degradation on deal detail
- **Dialog trigger buttons** — outline variant fix for dark Cockpit theme
- **Investor type rename** — `JOINT` → `JOINT_VENTURE`, `FUND_OF_FUNDS` → `INVESTMENT_FUND`

#### Testing
- Tests grew from 187 → 310 (17 test files, up from 11)
- New test suites: quarterly updates, settings audit, deal scoring, communications, portfolio monitoring

### v0.1.0 — MVP & Initial Deployment (2026-02-14/15)

**Commits:** Sprints 1-12 (PRs #17-#36, all merged) + deployment

- Full MVP of all 8 modules (Dashboard, Deals, Investors, Portfolio, Capital, Reports, Settings, LP Portal)
- EC2 + Docker Compose + nginx deployment (pivoted from App Runner after 6+ failures)
- Login redesign inspired by D.E. Shaw
- 187 tests across 11 test files

---

## 4. Produccion — Migraciones SQL Aplicadas

| # | Archivo | Fecha | Aplicado en | Proposito |
|---|---------|-------|-------------|-----------|
| 1 | `prisma/migrations/20260129151151_init/migration.sql` | 2026-01-29 | RDS | Schema inicial (27 modelos) |
| 2 | `prisma/migrations/20260129165735_update_roles_and_auth/migration.sql` | 2026-01-29 | RDS | UserRole enum update |
| 3 | `prisma/production-migration-multi-fund.sql` | 2026-02-17 | RDS | FundMember table + seed data |
| 4 | `prisma/production-migration-fix-currency.sql` (v2) | 2026-02-17 | RDS | Currency enum + column type fix |

**Nota:** Migraciones 3 y 4 se ejecutaron manualmente via Docker psql en EC2 (no via `prisma migrate`). La DB de produccion NO tiene historial de migraciones de Prisma.

---

## 5. Roadmap de Prioridades

### PRIORIDAD 0 — Onboarding de Fund Managers (APROBADO, pendiente implementacion)

| Componente | Ruta | Descripcion |
|------------|------|-------------|
| Signup | `/signup` | Pagina publica con invite code |
| Onboarding Wizard | `/onboarding` | 4 pasos: Profile → Fund → Team → Review |
| Admin Invite Codes | `/admin/invite-codes` | Generar/gestionar codigos de invitacion |
| Middleware | `middleware.ts` | Enforce wizard completion antes de acceder al dashboard |

Plan detallado en: `.claude/plans/iridescent-strolling-blossom.md`

### PRIORIDAD 1 — Operacional Inmediato (no requiere codigo)

| # | Tarea | Esfuerzo | Estado |
|---|-------|----------|--------|
| 1.1 | **Configurar Resend API key real** | 15 min | PENDIENTE |
| 1.2 | **Tighten RDS Security Group** | 5 min | PENDIENTE |
| 1.3 | **Restringir SSH (port 22)** a IP especifica | 2 min | PENDIENTE |
| 1.4 | **Cleanup App Runner resources** | 10 min | PENDIENTE |

### PRIORIDAD 2 — Features de Alto Impacto

| # | Feature | Esfuerzo | Descripcion |
|---|---------|----------|-------------|
| 2.1 | **Document Management System** | 2-3 dias | Upload a S3/R2, versioning, deal room |
| 2.2 | **Advanced Reporting** | 2 dias | Custom date ranges, comparison periods |

### PRIORIDAD 3 — Features de Impacto Medio

| # | Feature | Esfuerzo | Descripcion |
|---|---------|----------|-------------|
| 3.1 | **Investor Communications Hub improvements** | 1 dia | Template library, read tracking |
| 3.2 | **Portfolio Monitoring enhancements** | 1 dia | Period comparison, export |
| 3.3 | **OAuth (Google Login)** | 1 dia | NextAuth ya soporta, solo configurar provider |

### PRIORIDAD 4 — Nice to Have

| # | Feature | Esfuerzo |
|---|---------|----------|
| 4.1 | Activity Feed / Timeline | 1 dia |
| 4.2 | Granular RBAC | 2 dias |
| 4.3 | API Integration Layer / Webhooks | 3+ dias |

---

## 6. Patrones Arquitectonicos Clave

### Server Actions Flow
```
'use server' -> auth() -> !session?.user?.id -> requireFundAccess() -> Zod -> logic -> logAudit() -> revalidatePath()
```

### Multi-Fund Currency Flow
```
getActiveFundWithCurrency(userId)
  → getAuthorizedFundId(userId)         // cookie → FundMember → first fund → null
    → prisma.fund.findUnique({ currency })
      → { fundId, currency: 'USD' | 'EUR' | 'GBP' }
```

### Dark Mode
- Dashboard: Inline CSS vars en layout div (NO `.dark` de Tailwind)
- Portal components (Dialog, Select, Popover): Hardcoded hex (`bg-[#1E293B]`, `text-[#F8FAFC]`, `border-[#334155]`)
- Login page: Full dark background `#11141D` con inputs `bg-[#1E2432]`

### Brand Colors (NUNCA cambiar)
```
Primary: #11141D (midnight ink)
Accent:  #3E5CFF (heritage sapphire — CTAs only)
Text:    #F8FAFC
Muted:   #94A3B8
Border:  #334155
Success: #059669 (emerald — positive metrics only)
```

### Logo Typography
```tsx
<span className="font-serif">
    <span className="font-normal">Black</span>
    <span className="font-semibold">Gem</span>
</span>
```

### SDK Clients — Lazy Init
```typescript
let _client: Client | null = null
function getClient() { if (!_client) _client = new Client(key); return _client }
```

### Prisma Gotchas
- `Commitment` (NO `CapitalCommitment`)
- `VerificationToken` (NO `InvitationToken`)
- Despues de editar `schema.prisma`, SIEMPRE: `npx prisma generate`
- `findUnique` -> `findFirst` cuando agregas `...notDeleted` a compound keys
- Production DB tiene enum values extra (`JOINT`, `FUND_OF_FUNDS` en `InvestorType`) — no borrar, pueden tener data

---

## 7. Archivos Clave por Modulo

### Server Actions
| File | Module | Estado |
|------|--------|--------|
| `src/lib/actions/deals.ts` | Deal CRUD + pipeline + scoring | Completo |
| `src/lib/actions/investors.ts` | Investor CRUD + LP management | Completo |
| `src/lib/actions/portfolio.ts` | Portfolio companies + valuations + KPIs | Completo |
| `src/lib/actions/capital-calls.ts` | Capital call lifecycle | Completo |
| `src/lib/actions/distributions.ts` | Distribution lifecycle | Completo |
| `src/lib/actions/commitments.ts` | LP commitments | Completo (hardened) |
| `src/lib/actions/due-diligence.ts` | Deal due diligence items | Completo |
| `src/lib/actions/reports.ts` | Fund reports + quarterly updates + CSV export | Completo |
| `src/lib/actions/chart-data.ts` | Chart aggregations | Completo |
| `src/lib/actions/tasks.ts` | Deal task management | Completo |
| `src/lib/actions/settings.ts` | Fund settings + profile | Completo (audit logging added) |
| `src/lib/actions/notifications.ts` | Notification CRUD + broadcast | Completo |
| `src/lib/actions/users.ts` | LP invitations + user management | Completo |
| `src/lib/actions/portal.ts` | Read-only portal data | Completo |
| `src/lib/actions/funds.ts` | Multi-fund CRUD + switching | Completo |
| `src/lib/actions/communications.ts` | Investor email comms + templates | Completo |

### Shared Libraries
| File | Purpose |
|------|---------|
| `src/lib/shared/formatters.ts` | Currency-aware formatters (USD/EUR/GBP) — SINGLE SOURCE |
| `src/lib/shared/fund-access.ts` | `requireFundAccess()`, `getAuthorizedFundId()`, `getActiveFundWithCurrency()` |
| `src/lib/shared/fund-cookie.ts` | `getActiveFundId()`, `setActiveFundId()` (cookie persistence) |
| `src/lib/shared/audit.ts` | `logAudit()` + `computeChanges()` |
| `src/lib/shared/soft-delete.ts` | `notDeleted` filter + `softDelete()` for 7 entity types |
| `src/lib/shared/stage-transitions.ts` | Deal pipeline validation |
| `src/lib/shared/pagination.ts` | Pagination utilities |
| `src/lib/shared/rate-limit.ts` | Rate limiting (exists, not integrated) |
| `src/lib/shared/workflow-transitions.ts` | State machine transitions |

### PDF Generation
| File | Purpose |
|------|---------|
| `src/lib/pdf/dashboard-report.ts` | Dashboard summary PDF |
| `src/lib/pdf/capital-call-notice.ts` | Capital call notice PDF |
| `src/lib/pdf/distribution-notice.ts` | Distribution notice PDF |
| `src/lib/pdf/capital-statement.ts` | LP capital account statement PDF |
| `src/lib/pdf/quarterly-update.ts` | Quarterly update report PDF |

### CI/CD
| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | GitHub Actions: build Docker -> push ECR -> SSH deploy to EC2 |
| `Dockerfile` | Multi-stage Next.js build (standalone output, `--chown` fix) |

### Production Migration Scripts
| File | Purpose | Applied |
|------|---------|---------|
| `prisma/production-migration-multi-fund.sql` | FundMember table + seed | 2026-02-17 |
| `prisma/production-migration-fix-currency.sql` | Currency enum + column fix | 2026-02-17 |

---

## 8. Testing

- **310/310 tests pass** (17 test files)
- **Test files:**
  - `formatters.test.ts` — 23 tests (includes currency-aware formatters)
  - `stage-transitions.test.ts` — 18 tests
  - `fund-access.test.ts` — 9 tests
  - `pagination.test.ts` — 23 tests
  - `waterfall.test.ts` — 12 tests
  - `workflow-transitions.test.ts` — 46 tests
  - `deal-pipeline-analytics.test.ts` — 6 tests
  - `export.test.ts` — 13 tests
  - `audit.test.ts` — 8 tests
  - `quarterly-updates.test.ts` — tests for report builder
  - `settings-audit.test.ts` — 4 tests for settings audit coverage
  - `deal-scoring.test.ts` — scoring system tests
  - `communications.test.ts` — email template tests
  - `portfolio-monitoring.test.ts` — KPI trend tests
  - + 2 more
- **Vitest config:** Excluye `'**/.claude/worktrees/**'`
- **No hay E2E tests (Playwright)** — mencionado en PRD pero no implementado

---

## 9. PRs — Historial Completo

| PR | Sprint | Titulo | Estado |
|----|--------|--------|--------|
| #36 | 12 | Security hardening & type safety | MERGED |
| #35 | 11 | Testing & shared module extraction | MERGED |
| #34 | 10 | Reports & communications | MERGED |
| #33 | 9 | LP Portal enhancement | MERGED |
| #32 | 8 | Capital & distributions polish | MERGED |
| #31 | 7 | Portfolio module | MERGED |
| #30 | 6 | Deals module completion | MERGED |
| #29 | 5 | Pagination, security, build fix | MERGED |
| #28 | -- | CLAUDE.md engineering constitution | MERGED |
| #27 | -- | Session validation + LP portal PDFs | MERGED |
| #26 | 4 | Deal conversion, PDFs, LP invites, notifications | MERGED |
| #25 | 3 | Audit logging, fund access, error boundaries | MERGED |
| #24 | -- | Brand identity dark theme | MERGED |
| #23 | 2 | IRR, waterfall, charts & CSV | MERGED |
| #22 | 1 | Audit, soft deletes, fund access | MERGED |
| #21-17 | -- | Landing page (5 PRs) | MERGED |

**No hay PRs abiertos.** Post-Sprint 12, development happens directly on `main` via atomic commits.

---

## 10. Seed Data

- **Admin user:** `admin@blackgem.com` / `admin123` / role: `FUND_ADMIN`
- **Funds:**
  - `BlackGem Fund I` (USD) — original seed fund
  - `Martha Fund` (EUR) — created post-hotfix verification
- **FundMember:** Admin linked to fund (role: PRINCIPAL)
- **5 seed deals** with enriched data (EBITDA margins, key dates)

---

## 11. Known Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Dialog portal dark mode | Known | All portal-rendered components need hardcoded hex colors |
| Resend API key placeholder | Required | Email invitations won't send until real key configured |
| `.env` on EC2 can't be `source`d | Low | `RESEND_FROM_EMAIL` value has `<>` that breaks bash. Use `grep + cut` |
| Production DB has extra enum values | Info | `InvestorType` has `JOINT` + `FUND_OF_FUNDS` alongside new values — safe, don't remove |
| No Prisma migration history in prod | Info | Production schema was applied via raw SQL, not `prisma migrate`. Future schema changes need manual SQL scripts. |

---

## 12. PRD vs Realidad — Decisiones de Diseno

| PRD Feature | Decision | Razon |
|-------------|----------|-------|
| TanStack Query | No usado | Server components + `revalidatePath` resuelven data fetching |
| Zustand stores | No usado | Server actions eliminan necesidad de client state management |
| React Hook Form | No usado | Native forms + `useActionState` + Zod validation |
| Recharts | No usado | Metrics como cards + CSS bars + sparklines |
| `@react-pdf/renderer` | Sustituido | jsPDF (client-side) — mas ligero |
| pnpm | Sustituido | npm (funciona correctamente) |
| Vercel hosting | Sustituido | EC2 + Docker Compose — mas control |
| Supabase | Sustituido | AWS RDS PostgreSQL — self-managed |

---

## 13. Referencia Rapida de Documentos

| Documento | Ubicacion | Proposito |
|-----------|-----------|-----------|
| Engineering Constitution | `CLAUDE.md` | Standards, pre-ship checklist, prohibited patterns |
| Session Handoff | `SESSION_HANDOFF.md` | Este documento — estado del proyecto |
| PRD Overview | `Technical Documents/01_PRD_Overview.md` | Product vision, phases, RBAC matrix |
| Database Schema | `Technical Documents/02_PRD_Schema.md` | 27 Prisma models |
| Deals Module | `Technical Documents/03_Module_Deals.md` | Deal pipeline spec |
| Investors Module | `Technical Documents/04_Module_Investors.md` | LP management spec |
| Portfolio Module | `Technical Documents/05_Module_Portfolio.md` | Portfolio tracking spec |
| Capital Module | `Technical Documents/06_Module_Capital.md` | Capital calls & distributions spec |
| Reports Module | `Technical Documents/07_Module_Reports.md` | Reporting spec with wireframes |
| Business Rules | `Technical Documents/08_Business_Rules.md` | PE domain logic, validations |
| Brand System | `Desing & UI/11_Brand_System.md` | Visual identity, typography, colors |
| Landing Page Guide | `Desing & UI/12_Landing_Page_Guide.md` | Landing page copy guidelines |
| Product Strategy | `Business & Product/00_Product_Strategy.md` | Vision, personas, market analysis |
| Lean Canvas | `Business & Product/10_Lean_Canvas.md` | Business model canvas |
| Onboarding Plan | `.claude/plans/iridescent-strolling-blossom.md` | Fund manager onboarding design (deferred) |
