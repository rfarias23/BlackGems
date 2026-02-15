# BlackGem — Session Handoff Document

> Documento base para continuar desarrollo en nueva sesion.
> Actualizado: 2026-02-15
> Ultimo commit: `f467446` (login redesign + favicon + deployment)

---

## 1. Estado General del Proyecto

- **MVP Completion:** 100% — **EN PRODUCCION** en https://www.blackgem.ai
- **Stack:** Next.js 15.5.10, React 19, TypeScript, Prisma 6, PostgreSQL (Neon via RDS), Tailwind CSS 4, NextAuth v5 beta.30, jsPDF, Resend
- **Repo:** github.com/rfarias23/BlackGems | Branch: `main` (commit `f467446`)
- **Dev server:** localhost:3002
- **Tests:** 187/187 pass (11 test files, Vitest)
- **TypeScript:** Zero `any` types, zero `eslint-disable`, zero `@ts-ignore`
- **Build/Lint:** Both pass clean

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

### Acceso SSH

```bash
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
cd /opt/blackgem
docker compose logs --tail 50    # Ver logs
docker compose pull && docker compose up -d  # Redeploy manual
```

---

## 3. Sesion 2026-02-14/15 — Lo Que Se Hizo

### 3.1 Migracion de App Runner a EC2 (dia completo)
- App Runner fallo 6+ veces (health check redirects, ARM64/AMD64 mismatch, OCI attestation, file ownership)
- Pivoteamos a EC2 + Docker Compose + nginx siguiendo first principles
- Toda la infra se creo desde cero: EC2, Elastic IP, SG, IAM, ECR credential helper, nginx, certbot

### 3.2 Archivos Modificados/Creados
- `.github/workflows/deploy.yml` — Reescrito de App Runner a EC2 SSH deploy
- `.env.example` — Agregado `AUTH_TRUST_HOST=true`
- `src/app/page.tsx` — Removido LP Login, links cambiados de localhost a rutas relativas
- `src/components/landing/mobile-nav.tsx` — Removido LP Login
- `src/app/favicon.ico` + `src/app/icon.png` — Favicon de BlackGem
- `src/app/login/page.tsx` — Rediseno inspirado en D.E. Shaw (dark bg, vertical brand mark, serif title)
- `src/components/auth/login-form.tsx` — Rediseno sin Card wrapper, inputs custom, Heritage Sapphire CTA

### 3.3 Commits de esta sesion

```
f467446 fix: use correct BlackGem font-serif logo style on login page
3e44267 feat: redesign Manager Login inspired by D.E. Shaw
a8b7e1c fix: add favicon and remove LP Login from landing page
aa6239c fix: remove LP Login link from landing page hero
8a20ec7 fix: use relative paths for login links on landing page
e346996 feat: switch deployment from App Runner to EC2 + Docker Compose
20a30c4 feat: add AWS App Runner deployment infrastructure
```

---

## 4. Roadmap de Prioridades

### PRIORIDAD 1 — Operacional Inmediato (no requiere codigo)

| # | Tarea | Esfuerzo | Detalles |
|---|-------|----------|----------|
| 1.1 | **Configurar Resend API key real** | 15 min | Crear cuenta en resend.com, verificar dominio `blackgem.ai`, obtener API key, actualizar `/opt/blackgem/.env` en EC2, reiniciar container |
| 1.2 | **Tighten RDS Security Group** | 5 min | `sg-0cf5124eab58f6333` debe permitir solo trafico desde `sg-0400b24b78152cde5` (EC2 SG), no IPs arbitrarias |
| 1.3 | **Restringir SSH (port 22)** | 2 min | Limitar a tu IP actual en el SG del EC2. Comando: `aws ec2 authorize-security-group-ingress --group-id sg-0400b24b78152cde5 --protocol tcp --port 22 --cidr YOUR_IP/32` (y revocar la regla 0.0.0.0/0) |
| 1.4 | **Cleanup App Runner resources** | 10 min | Eliminar servicio App Runner huerfano si existe |

### PRIORIDAD 2 — Deuda Tecnica Menor

| # | Tarea | Esfuerzo | Detalles |
|---|-------|----------|----------|
| 2.1 | **Settings audit logging** | 30 min | Agregar `logAudit()` a `settings.ts`: `updateProfile`, `changePassword`, `updateFundConfig`, `updateFundStatus`. Patron: copiar de `investors.ts` |
| 2.2 | **Error boundary integration** | 1 hr | `src/components/ui/error-boundary.tsx` existe pero no esta integrado en ninguna pagina. Wrappear modulos principales |
| 2.3 | **Login page — verificar deploy** | 5 min | El rediseno del login (D.E. Shaw style) fue commiteado pero puede no haberse deployado. Verificar en https://www.blackgem.ai/login y si no refleja el cambio, hacer push manual |

### PRIORIDAD 3 — Features de Alto Impacto

| # | Feature | Esfuerzo | Descripcion |
|---|---------|----------|-------------|
| 3.1 | **Document Management System** | 2-3 dias | Upload a S3/R2, versioning, deal room. Es el gap funcional mas grande del PRD. Modelos `Document` y `DocumentVersion` ya existen en schema |
| 3.2 | **Advanced Reporting** | 2 dias | Quarterly update builder templated, custom date ranges, comparison periods. PRD tiene wireframes en `07_Module_Reports.md` |

### PRIORIDAD 4 — Features de Impacto Medio

| # | Feature | Esfuerzo | Descripcion |
|---|---------|----------|-------------|
| 4.1 | **Deal Scoring System** | 1 dia | Campos existentes sin usar: `attractivenessScore`, `fitScore`, `riskScore`, `source`, `sourceContact`. Solo UI + server action |
| 4.2 | **Investor Communications Hub** | 2 dias | Bulk comms, templates, tracking de lectura. Resend ya esta integrado |
| 4.3 | **Portfolio Monitoring Dashboard** | 1-2 dias | KPI trends over time, sparklines, period comparison |

### PRIORIDAD 5 — Nice to Have

| # | Feature | Esfuerzo | Descripcion |
|---|---------|----------|-------------|
| 5.1 | Activity Feed / Timeline | 1 dia | Deal history visualization usando AuditLog data |
| 5.2 | Role-Based Permissions granular | 2 dias | Mas alla de fund-level access. RBAC matrix en PRD `01_PRD_Overview.md` |
| 5.3 | API Integration Layer | 3+ dias | Webhooks, external data sources |
| 5.4 | OAuth (Google Login) | 1 dia | NextAuth ya soporta, solo configurar provider |
| 5.5 | Sentry Monitoring | 30 min | Error tracking en produccion |

---

## 5. PRD vs Realidad — Decisiones de Diseno

El PRD original (`01_PRD_Overview.md`) mencionaba varias tecnologias que **NO se implementaron por decision consciente (YAGNI)**:

| PRD Feature | Decision | Razon |
|-------------|----------|-------|
| TanStack Query | No usado | Server components + `revalidatePath` resuelven data fetching sin client-side cache |
| Zustand stores | No usado | Server actions eliminan necesidad de client state management |
| React Hook Form | No usado | Native forms + `useActionState` + Zod validation es mas simple |
| Recharts | No usado | Metrics como cards + CSS bars son mas performantes y no requieren dependencia pesada |
| `@react-pdf/renderer` | Sustituido | Se usa jsPDF (client-side) — mas ligero y no requiere server-side rendering |
| pnpm | Sustituido | Se usa npm (npm install cuelga en la maquina del dev — workaround: curl tarballs) |
| Vercel hosting | Sustituido | EC2 + Docker Compose — mas control, mas barato, debuggable via SSH |
| Supabase | Sustituido | Neon PostgreSQL via AWS RDS — self-managed, mismo costo |

**Estas no son gaps — son simplificaciones correctas.**

---

## 6. Patrones Arquitectonicos Clave

### Server Actions Flow
```
'use server' -> auth() -> !session?.user?.id -> requireFundAccess() -> Zod -> logic -> logAudit() -> revalidatePath()
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

### npm install Workaround
npm install cuelga en esta maquina. Para instalar packages:
```bash
curl -sL https://registry.npmjs.org/<package>/-/<package>-<version>.tgz -o /tmp/pkg.tgz
tar -xzf /tmp/pkg.tgz -C node_modules/<package> --strip-components=1
```

---

## 7. Archivos Clave por Modulo

### Server Actions
| File | Module | Estado |
|------|--------|--------|
| `src/lib/actions/deals.ts` | Deal CRUD + pipeline + conversion | Completo |
| `src/lib/actions/investors.ts` | Investor CRUD + LP management | Completo |
| `src/lib/actions/portfolio.ts` | Portfolio companies + valuations | Completo |
| `src/lib/actions/capital-calls.ts` | Capital call lifecycle | Completo |
| `src/lib/actions/distributions.ts` | Distribution lifecycle | Completo |
| `src/lib/actions/commitments.ts` | LP commitments | Completo (hardened) |
| `src/lib/actions/due-diligence.ts` | Deal due diligence items | Completo |
| `src/lib/actions/reports.ts` | Fund reports + CSV export | Completo |
| `src/lib/actions/chart-data.ts` | Chart aggregations | Completo |
| `src/lib/actions/tasks.ts` | Deal task management | Completo |
| `src/lib/actions/settings.ts` | Fund settings + profile | Falta audit logging |
| `src/lib/actions/notifications.ts` | Notification CRUD + broadcast | Completo |
| `src/lib/actions/users.ts` | LP invitations + user management | Completo |
| `src/lib/actions/portal.ts` | Read-only portal data | Completo |

### Shared Libraries
| File | Purpose |
|------|---------|
| `src/lib/shared/formatters.ts` | Currency, percentage, multiple formatters (SINGLE SOURCE) |
| `src/lib/shared/fund-access.ts` | `requireFundAccess()` guard |
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

### CI/CD
| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | GitHub Actions: build Docker -> push ECR -> SSH deploy to EC2 |
| `Dockerfile` | Multi-stage Next.js build (standalone output, `--chown` fix) |

---

## 8. Testing

- **187/187 tests pass** (11 test files)
- **Test files:**
  - `formatters.test.ts` — 23 tests
  - `stage-transitions.test.ts` — 18 tests
  - `fund-access.test.ts` — 9 tests
  - `pagination.test.ts` — 23 tests
  - `waterfall.test.ts` — 12 tests
  - `workflow-transitions.test.ts` — 46 tests
  - `deal-pipeline-analytics.test.ts` — 6 tests
  - `export.test.ts` — 13 tests
  - `audit.test.ts` — 8 tests
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

**No hay PRs abiertos.**

---

## 10. Seed Data

- **Admin user:** `admin@blackgem.com` / `admin123` / role: `FUND_ADMIN`
- **Fund:** Single fund mode (`prisma.fund.findFirst()`)
- **FundMember:** Admin linked to fund (role: PRINCIPAL)
- **5 seed deals** with enriched data (EBITDA margins, key dates)

---

## 11. Known Issues

| Issue | Severity | Details |
|-------|----------|---------|
| npm install hangs | Known | Workaround: curl tarballs manually |
| Dialog portal dark mode | Known | All portal-rendered components need hardcoded hex colors |
| Resend API key placeholder | Required | Email invitations won't send until real key configured |
| Login redesign may need deploy verification | Low | Commits `3e44267` + `f467446` were pushed but verify at https://www.blackgem.ai/login |

---

## 12. Referencia Rapida de Documentos

| Documento | Ubicacion | Proposito |
|-----------|-----------|-----------|
| Engineering Constitution | `CLAUDE.md` | Standards, pre-ship checklist, prohibited patterns |
| PRD Overview | `Technical Documents/01_PRD_Overview.md` | Product vision, phases, RBAC matrix |
| Database Schema | `Technical Documents/02_PRD_Schema.md` | 27 Prisma models |
| Deals Module | `Technical Documents/03_Module_Deals.md` | Deal pipeline spec |
| Investors Module | `Technical Documents/04_Module_Investors.md` | LP management spec |
| Portfolio Module | `Technical Documents/05_Module_Portfolio.md` | Portfolio tracking spec |
| Capital Module | `Technical Documents/06_Module_Capital.md` | Capital calls & distributions spec |
| Reports Module | `Technical Documents/07_Module_Reports.md` | Reporting spec with wireframes |
| Business Rules | `Technical Documents/08_Business_Rules.md` | PE domain logic, validations |
| Claude Instructions | `Technical Documents/09_Claude_Instructions.md` | Full implementation guide |
| Brand System | `Desing & UI/11_Brand_System.md` | Visual identity, typography, colors |
| Product Strategy | `Business & Product/00_Product_Strategy.md` | Vision, personas, market analysis |
