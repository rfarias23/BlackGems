# BlackGem Engineering Constitution

## Identity

> **Invisible Quality. Visible Excellence.**
> The Loro Piana of Product & Engineering.

BlackGem is a PE fund management platform for Search Funds and Micro-PE. We make a $5M fund indistinguishable from a $500M fund. Every line of code is institutional infrastructure.

**Mantra:** We think like investors. We design like architects. We build like craftsmen. We ship like an institution.

---

## The Three Gates

Every initiative, feature, or change must pass all three. If any gate fails, stop.

1. **Why does it exist?** If you cannot articulate the reason in one sentence, do not build it.
2. **What value does it create for users?** Features are capital allocation. Every one must make fund managers or LPs measurably more effective — saving time, reducing friction, or improving decisions.
3. **Does it fortify the institution?** Code that weakens the foundation is rejected, no matter how fast it ships.

---

## Engineering Principles

### Institutional Craftsmanship
- **Clarity over cleverness** — If a junior engineer cannot read it in 30 seconds, rewrite it.
- **Scalability over shortcuts** — Build for the fund that manages $500M, not the one that manages $5M today.
- **Testability is non-negotiable** — Untested business logic does not ship.
- **Security is foundational** — Never added later. Auth checks, fund access guards, and audit logging are mandatory from line one.

### Invisible First
Build in this order. Deviating requires explicit justification:
1. Architecture and data model before UI
2. Data integrity before dashboards
3. Security before convenience
4. API correctness before visual polish

### Discipline with Speed
- **Importance over urgency** — Prioritize what matters, not what screams.
- **Design before building** — Understand the data model, the business rule, and the edge cases before writing the first component.
- **No temporary hacks** — If it ships, it is permanent infrastructure.

---

## UX Standard: Inevitability

The interface should feel inevitable — as if no other design was possible.

- **Frictionless** — Zero unnecessary clicks, confirmations, or redirections.
- **Minimal** — Economy of language. Skeletons not spinners. No illustrations, no emojis.
- **Consistent** — Same patterns everywhere. Same spacing, same badge styles, same table formatting.
- **Precise** — Monospace for all financial numbers. Decimal alignment. 1px borders.
- **Performant** — Animations under 200ms. No layout shift. Instant feedback.

---

## Branch Hygiene (MANDATORY before any PR)

**One branch per PR. No exceptions. No reuse after merge.**

Before creating a Pull Request, you MUST ensure the branch is clean against `main`:

```bash
# ALWAYS start new work from fresh main:
git fetch origin main
git checkout -b fix/description origin/main

# NEVER reuse a branch that already had commits merged via squash.
# Squash merge creates new commit hashes — Git sees the old commits as
# unmerged, causing phantom conflicts on identical content.
```

**The rule:** After a PR is merged, that branch is dead. Next fix = new branch from `origin/main`. If you have multiple commits on a branch and some were already merged via separate PRs, you MUST rebase (`git rebase origin/main`) before creating the next PR to drop already-merged commits.

**Pre-PR verification:**
```bash
git fetch origin main
git log --oneline origin/main..HEAD  # Only YOUR new commits should appear
```

If you see commits that were already merged in other PRs, rebase first. Do not create a PR with ghost commits.

---

## Database & Migrations (MANDATORY)

### Infrastructure
| Environment | Database | Host | Access |
|-------------|----------|------|--------|
| Development | PostgreSQL (Neon) | `ep-dark-voice-...neon.tech` | Direct via `DATABASE_URL` in `.env` |
| Production | PostgreSQL (AWS RDS) | `blackgem-prod...rds.amazonaws.com` | EC2 only (Security Group restricted) |

Production runs on **AWS EC2** (Docker Compose + nginx), NOT Vercel. Deployed via GitHub Actions → ECR → SSH to EC2.

### Prisma is the single source of truth
- **All schema changes** go through `prisma migrate dev --name <description>`
- **Deploy to production** via `prisma migrate deploy` from EC2
- **Never write raw SQL** for schema changes — no `CREATE TABLE`, `ALTER TABLE`, `ADD COLUMN` scripts
- **Never modify production DB directly** without a Prisma migration

### Schema change workflow
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration (creates SQL + applies to dev DB)
npx prisma migrate dev --name <description>
# 3. Verify
npx prisma migrate status
# 4. Commit the migration file with your PR
# 5. After merge, deploy to production:
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
cd /opt/blackgem && npx prisma migrate deploy
```

### Production access (read-only queries only)
```bash
ssh -i ~/.ssh/blackgem-ec2.pem ec2-user@3.223.165.121
DB_URL=$(grep '^DATABASE_URL=' /opt/blackgem/.env | cut -d= -f2-)
docker run --rm -e DATABASE_URL="$DB_URL" postgres:15-alpine sh -c 'psql "$DATABASE_URL" -c "SELECT ..."'
```

**Note:** `psql` is not installed on EC2 — use Docker `postgres:15-alpine` image. The `.env` file cannot be `source`d due to `<>` in `RESEND_FROM_EMAIL` — use `grep + cut` pattern above.

---

## Pre-Ship Checklist

**Every commit and PR must satisfy ALL items.** No exceptions.

### User Value
- [ ] I can state in one sentence why this exists
- [ ] It creates measurable value for fund managers or LPs
- [ ] This is the highest-impact use of engineering time right now

### Structural Integrity
- [ ] Data model is correct and normalized (no stored derived data)
- [ ] Session guard: `!session?.user?.id` (NOT `!session?.user`)
- [ ] Fund access: `requireFundAccess()` called on all mutations touching fund-scoped data
- [ ] Soft deletes: never hard delete Deal, Investor, PortfolioCompany, Document, CapitalCall, Distribution
- [ ] Zod validation on all user inputs before DB operations
- [ ] Schema changes have a Prisma migration (`prisma migrate dev --name <description>`)

### Institutional Craftsmanship
- [ ] TypeScript strict — zero `any` types, zero `@ts-ignore`
- [ ] Code reads clearly without inline comments explaining intent
- [ ] Business logic lives in `lib/actions/` or `lib/shared/`, not in components
- [ ] Error handling: try/catch with graceful UI fallbacks
- [ ] Loading states: skeleton components, never spinners or "Loading..."

### Audit & Observability
- [ ] `logAudit()` called for every CREATE, UPDATE, DELETE mutation
- [ ] Change diffs captured via `computeChanges()` on updates
- [ ] `console.error` for caught exceptions (audit logging must never block primary operations)

### UX Coherence
- [ ] Dark mode (Cockpit) tested — CSS vars via inline style on dashboard layout div; hardcoded hex for portal components outside layout
- [ ] Financial numbers use `font-mono tabular-nums`
- [ ] Page titles use `font-serif`
- [ ] Tables: horizontal borders only, tracking-wider uppercase headers, monospace numeric cells
- [ ] Empty states: muted text, relevant icon, no illustrations
- [ ] Copy follows "Autoridad Serena" voice — see `11_Brand_System.md`

### Testing & Quality
- [ ] Business logic functions have unit tests (Vitest)
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes
- [ ] No new console warnings in browser dev tools

---

## Technical Patterns (Quick Reference)

For full implementation details: `Technical Documents/09_Claude_Instructions.md`

### Server Action Pattern (every mutation)
```typescript
'use server'
const session = await auth()
if (!session?.user?.id) return { error: 'Unauthorized' }
await requireFundAccess(session.user.id, fundId)
const parsed = schema.safeParse(input)
// DB operation with soft-delete filter: ...notDeleted
await logAudit({ userId: session.user.id, action, entityType, entityId, changes })
revalidatePath('/path')
```

### Dark Mode
Dashboard layout uses inline CSS custom properties (NOT Tailwind `.dark` class). Portal components rendering outside the layout div (Dialog, Select, Popover) require hardcoded hex colors.

### External SDK Clients
Lazy-init pattern to avoid build crashes without env vars:
```typescript
let _client: Client | null = null
function getClient() { if (!_client) _client = new Client(key); return _client }
```

### Key Files
| Pattern | Location |
|---------|----------|
| Auth & fund access | `src/lib/shared/fund-access.ts` |
| Audit logging | `src/lib/shared/audit.ts` |
| Soft deletes | `src/lib/shared/soft-delete.ts` |
| Formatters | `src/lib/shared/formatters.ts` |
| Server actions | `src/lib/actions/*.ts` |
| PDF generation | `src/lib/pdf/*.ts` (client-side jsPDF) |

### Brand Colors (do not modify)
- Primary: `#11141D` (midnight ink)
- Accent: `#3E5CFF` (heritage sapphire — CTAs only)
- Text: `#F8FAFC`
- Muted: `#94A3B8`
- Border: `#334155`
- Success: `#059669` (emerald — positive metrics only)

---

## Prohibited

- Pie charts, donut charts, 3D charts
- `any` type, `@ts-ignore`, `eslint-disable`
- Hard deletes on core entities
- Mutations without audit logging
- Server actions without auth + fund access checks
- Spinners, loading text, emojis, illustrations in UI
- Bright/saturated colors except Heritage Sapphire for CTAs
- `!session?.user` guard (must be `!session?.user?.id`)
- Manual SQL migrations outside Prisma (no `production-migration-*.sql` files)

---

## Document Map

| Document | Purpose |
|----------|---------|
| `Technical Documents/09_Claude_Instructions.md` | Full implementation guide: stack, patterns, components, styling |
| `Desing & UI/11_Brand_System.md` | Visual identity, typography, color palette, data visualization rules |
| `Technical Documents/08_Business_Rules.md` | PE domain logic, validations, state machines |
| `Technical Documents/02_PRD_Schema.md` | Database schema (27 Prisma models) |
| `README.md` | Project setup and architecture overview |

---

## Prisma Model Gotchas
- `Commitment` (not `CapitalCommitment`)
- `VerificationToken` (not `InvitationToken`)
- `audit.test.ts` requires `DATABASE_URL` — pre-existing, not a bug
