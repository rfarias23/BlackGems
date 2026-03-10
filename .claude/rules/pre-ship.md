# Pre-Ship Checklist

**Every commit and PR must satisfy ALL items.** No exceptions.

---

## User Value

- [ ] I can state in one sentence why this exists
- [ ] It creates measurable value for fund managers or LPs
- [ ] This is the highest-impact use of engineering time right now

---

## Structural Integrity

- [ ] Data model is correct and normalized — no stored derived data
- [ ] Session guard: `!session?.user?.id` (NOT `!session?.user`)
- [ ] `requireFundAccess()` called on all mutations touching fund-scoped data
- [ ] Soft deletes only — never hard delete Deal, Investor, PortfolioCompany, Document, CapitalCall, Distribution, Commitment
- [ ] Zod validation on all user inputs before DB operations
- [ ] Schema changes have a Prisma migration (`prisma migrate dev --name <description>`)

---

## Institutional Craftsmanship

- [ ] TypeScript strict — zero `any` types, zero `@ts-ignore`
- [ ] Code reads clearly without inline comments explaining intent
- [ ] Business logic lives in `lib/actions/` or `lib/shared/`, not in components
- [ ] Error handling: try/catch with graceful UI fallbacks
- [ ] Loading states: skeleton components — never spinners or "Loading..."

---

## Audit & Observability

- [ ] `logAudit()` called for every CREATE, UPDATE, DELETE mutation
- [ ] Change diffs captured via `computeChanges()` on updates
- [ ] `console.error` for caught exceptions — audit logging must never block primary operations

---

## UX Coherence

- [ ] Dark mode (Cockpit) tested — CSS vars via inline `style=` on dashboard layout div; hardcoded hex for portal components outside layout
- [ ] Financial numbers use `font-mono tabular-nums`
- [ ] Page titles use `font-serif`
- [ ] Tables: horizontal borders only, `tracking-wider` uppercase headers, monospace numeric cells
- [ ] Empty states: muted text, relevant icon, no illustrations
- [ ] Copy follows "Autoridad Serena" voice — see `Desing & UI/11_Brand_System.md`

---

## Testing & Quality

- [ ] Business logic functions have unit tests (Vitest)
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes clean
- [ ] No new console warnings in browser dev tools
