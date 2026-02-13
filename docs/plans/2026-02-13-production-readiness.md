# Production Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the two blocking production gaps (Commitment soft-delete, env vars) and address four nice-to-have cleanups.

**Architecture:** The Commitment model is the only core PE entity without a `deletedAt` field — all 6 others already have it. We add the schema field, run a Prisma migration, update the `softDelete()` utility, convert `deleteCommitment()` from hard to soft delete, and add `...notDeleted` filters to all 15 commitment query sites across 7 files. Environment variables are documented in `.env.example`. Nice-to-haves remove unused code and lint warnings.

**Tech Stack:** Prisma 6, PostgreSQL (Neon), Next.js 15.5, TypeScript, Vitest

---

## BLOCKING ITEMS

### Task 1: Prisma schema migration — add `deletedAt` to Commitment

**Files:**
- Modify: `prisma/schema.prisma:748` (add field before `createdAt`)

**Step 1: Add `deletedAt` field to Commitment model**

In `prisma/schema.prisma`, inside the `Commitment` model, add this line immediately before the `createdAt` field (line 748):

```prisma
  deletedAt       DateTime?
```

The model block should read:

```prisma
  // Notes
  notes           String?          @db.Text

  deletedAt       DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
```

**Step 2: Generate and apply migration**

Run: `npx prisma migrate dev --name add-commitment-soft-delete`
Expected: Migration created and applied successfully. Zero errors.

**Step 3: Verify Prisma client regenerated**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client`

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore(schema): add deletedAt to Commitment for soft-delete"
```

---

### Task 2: Update soft-delete utility + unit test

**Files:**
- Modify: `src/lib/shared/soft-delete.ts:12` (add `'commitment'` to union, add switch case)
- Modify: `src/lib/shared/__tests__/soft-delete.test.ts` (add mock + test case)

**Step 1: Add commitment to mock in test file**

In `src/lib/shared/__tests__/soft-delete.test.ts`, add `commitment` to the prisma mock object (after line 12):

```typescript
vi.mock('@/lib/prisma', () => ({
    prisma: {
        deal: { update: vi.fn().mockResolvedValue({}) },
        investor: { update: vi.fn().mockResolvedValue({}) },
        portfolioCompany: { update: vi.fn().mockResolvedValue({}) },
        document: { update: vi.fn().mockResolvedValue({}) },
        capitalCall: { update: vi.fn().mockResolvedValue({}) },
        distribution: { update: vi.fn().mockResolvedValue({}) },
        commitment: { update: vi.fn().mockResolvedValue({}) },
    },
}))
```

**Step 2: Add test case for commitment soft-delete**

After the `'soft-deletes a distribution'` test (line 73), add:

```typescript
    it('soft-deletes a commitment', async () => {
        await softDelete('commitment', 'com-333')

        expect(prisma.commitment.update).toHaveBeenCalledWith({
            where: { id: 'com-333' },
            data: { deletedAt: expect.any(Date) },
        })
    })
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/shared/__tests__/soft-delete.test.ts`
Expected: FAIL — `'commitment'` is not in the union type

**Step 4: Update soft-delete.ts — add commitment to union type**

In `src/lib/shared/soft-delete.ts`, change line 12:

From:
```typescript
  model: 'deal' | 'investor' | 'portfolioCompany' | 'document' | 'capitalCall' | 'distribution',
```

To:
```typescript
  model: 'deal' | 'investor' | 'portfolioCompany' | 'document' | 'capitalCall' | 'distribution' | 'commitment',
```

**Step 5: Add commitment switch case**

After the `distribution` case (line 52), add:

```typescript
    case 'commitment':
      await prisma.commitment.update({
        where: { id },
        data: { deletedAt: now },
      })
      break
```

**Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/shared/__tests__/soft-delete.test.ts`
Expected: 7/7 tests pass (was 6)

**Step 7: Commit**

```bash
git add src/lib/shared/soft-delete.ts src/lib/shared/__tests__/soft-delete.test.ts
git commit -m "feat(soft-delete): add Commitment to soft-delete utility"
```

---

### Task 3: Convert deleteCommitment() to soft-delete + add notDeleted filters

**Files:**
- Modify: `src/lib/actions/commitments.ts:99,165,237,246-251` (soft-delete + notDeleted filters)
- Modify: `src/lib/actions/portal.ts:214-215` (add notDeleted)
- Modify: `src/lib/actions/capital-calls.ts:275-278,458-463` (add notDeleted)
- Modify: `src/lib/actions/distributions.ts:296-299,461-466` (add notDeleted)
- Modify: `src/lib/actions/reports.ts:58,215-216,419-424,433-434` (add notDeleted)
- Modify: `src/lib/actions/chart-data.ts:49-50,123-124,160-161` (add notDeleted)
- Modify: `src/lib/actions/users.ts:498-499` (add notDeleted)

**Step 1: Update `commitments.ts` — convert deleteCommitment to soft-delete**

Add `softDelete` import at top of file (line 8):

```typescript
import { notDeleted, softDelete } from '@/lib/shared/soft-delete'
```

(Replace existing `import { notDeleted } from '@/lib/shared/soft-delete'`)

In `deleteCommitment()` (lines 246-251), replace:

```typescript
        // Note: Commitment model does not have deletedAt field in schema.
        // Hard delete is used here. A schema migration to add deletedAt
        // should be done before production deployment.
        await prisma.commitment.delete({
            where: { id: commitmentId },
        })
```

With:

```typescript
        await softDelete('commitment', commitmentId)
```

**Step 2: Add notDeleted to findUnique calls in commitments.ts**

Line 99 — duplicate check in `createCommitment()`. Change from `findUnique` to `findFirst` because `findUnique` does not support extra `where` clauses:

From:
```typescript
        const existing = await prisma.commitment.findUnique({
            where: { investorId_fundId: { investorId, fundId } },
        })
```

To:
```typescript
        const existing = await prisma.commitment.findFirst({
            where: { investorId, fundId, ...notDeleted },
        })
```

Line 165 — `updateCommitment()` findUnique. Add `deletedAt: null` check:

From:
```typescript
        const existing = await prisma.commitment.findUnique({
            where: { id: commitmentId },
        })
```

To:
```typescript
        const existing = await prisma.commitment.findFirst({
            where: { id: commitmentId, ...notDeleted },
        })
```

Line 237 — `deleteCommitment()` findUnique. Same pattern:

From:
```typescript
        const existing = await prisma.commitment.findUnique({
            where: { id: commitmentId },
        })
```

To:
```typescript
        const existing = await prisma.commitment.findFirst({
            where: { id: commitmentId, ...notDeleted },
        })
```

**Step 3: Add notDeleted to portal.ts**

Line 214-215 in `src/lib/actions/portal.ts`:

From:
```typescript
    const commitments = await prisma.commitment.findMany({
        where: { investorId: session.user.investorId },
```

To:
```typescript
    const commitments = await prisma.commitment.findMany({
        where: { investorId: session.user.investorId, ...notDeleted },
```

(Verify `notDeleted` is already imported — if not, add: `import { notDeleted } from '@/lib/shared/soft-delete'`)

**Step 4: Add notDeleted to capital-calls.ts**

Line 275-278 in `src/lib/actions/capital-calls.ts`:

From:
```typescript
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: data.fundId,
                status: { in: ['ACTIVE', 'FUNDED', 'SIGNED'] },
            },
```

To:
```typescript
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: data.fundId,
                status: { in: ['ACTIVE', 'FUNDED', 'SIGNED'] },
                ...notDeleted,
            },
```

Line 458-463 — `findUnique` by compound key:

From:
```typescript
        const commitment = await prisma.commitment.findUnique({
            where: {
                investorId_fundId: {
                    investorId: item.investorId,
                    fundId: item.capitalCall.fundId,
                },
            },
```

To:
```typescript
        const commitment = await prisma.commitment.findFirst({
            where: {
                investorId: item.investorId,
                fundId: item.capitalCall.fundId,
                ...notDeleted,
            },
```

(Verify `notDeleted` is already imported — if not, add import.)

**Step 5: Add notDeleted to distributions.ts**

Line 296-299 in `src/lib/actions/distributions.ts`:

From:
```typescript
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: data.fundId,
                status: { in: ['ACTIVE', 'FUNDED'] },
            },
```

To:
```typescript
        const commitments = await prisma.commitment.findMany({
            where: {
                fundId: data.fundId,
                status: { in: ['ACTIVE', 'FUNDED'] },
                ...notDeleted,
            },
```

Line 461-466 — `findUnique` by compound key:

From:
```typescript
        const commitment = await prisma.commitment.findUnique({
            where: {
                investorId_fundId: {
                    investorId: item.investorId,
                    fundId: item.distribution.fundId,
                },
            },
```

To:
```typescript
        const commitment = await prisma.commitment.findFirst({
            where: {
                investorId: item.investorId,
                fundId: item.distribution.fundId,
                ...notDeleted,
            },
```

(Verify `notDeleted` is already imported — if not, add import.)

**Step 6: Add notDeleted to reports.ts**

Line 58:

From:
```typescript
        prisma.commitment.findMany({ where: { fundId: fund.id } }),
```

To:
```typescript
        prisma.commitment.findMany({ where: { fundId: fund.id, ...notDeleted } }),
```

Line 215-216:

From:
```typescript
    const commitments = await prisma.commitment.findMany({
        where: { fundId: fund.id },
    })
```

To:
```typescript
    const commitments = await prisma.commitment.findMany({
        where: { fundId: fund.id, ...notDeleted },
    })
```

Line 419-424 — `findUnique` by compound key:

From:
```typescript
    const commitment = await prisma.commitment.findUnique({
        where: {
            investorId_fundId: {
                investorId: investorId,
                fundId: fund.id,
            },
```

To:
```typescript
    const commitment = await prisma.commitment.findFirst({
        where: {
            investorId: investorId,
            fundId: fund.id,
            ...notDeleted,
```

Line 433-434:

From:
```typescript
    const allCommitments = await prisma.commitment.findMany({
        where: { fundId: fund.id },
    })
```

To:
```typescript
    const allCommitments = await prisma.commitment.findMany({
        where: { fundId: fund.id, ...notDeleted },
    })
```

(Verify `notDeleted` is already imported — if not, add import.)

**Step 7: Add notDeleted to chart-data.ts**

Line 49-50:

From:
```typescript
      prisma.commitment.findMany({
        where: { fundId: fund.id },
```

To:
```typescript
      prisma.commitment.findMany({
        where: { fundId: fund.id, ...notDeleted },
```

Line 123-124:

From:
```typescript
  const commitments = await prisma.commitment.findMany({
    where: { investorId },
```

To:
```typescript
  const commitments = await prisma.commitment.findMany({
    where: { investorId, ...notDeleted },
```

Line 160-161:

From:
```typescript
  const commitments = await prisma.commitment.findMany({
    where: { fundId: fund.id },
```

To:
```typescript
  const commitments = await prisma.commitment.findMany({
    where: { fundId: fund.id, ...notDeleted },
```

(`notDeleted` is already imported in chart-data.ts at line 5.)

**Step 8: Add notDeleted to users.ts**

Line 498-499:

From:
```typescript
    const fundCommitment = await prisma.commitment.findFirst({
        where: { investorId },
```

To:
```typescript
    const fundCommitment = await prisma.commitment.findFirst({
        where: { investorId, ...notDeleted },
```

(Verify `notDeleted` is already imported — if not, add import.)

**Step 9: Build verification**

Run: `npm run build`
Expected: `✓ Compiled successfully` with zero errors.

**Step 10: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (187+, including new soft-delete test).

**Step 11: Commit**

```bash
git add src/lib/actions/commitments.ts src/lib/actions/portal.ts src/lib/actions/capital-calls.ts src/lib/actions/distributions.ts src/lib/actions/reports.ts src/lib/actions/chart-data.ts src/lib/actions/users.ts
git commit -m "feat(commitments): convert to soft-delete, add notDeleted filters across all queries"
```

---

### Task 4: Update .env.example with missing variables

**Files:**
- Modify: `.env.example`

**Step 1: Add missing env vars**

Update `.env.example` to:

```
DATABASE_URL=postgresql://user:password@host:5432/blackgem
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=BlackGem <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: document RESEND_FROM_EMAIL and NEXT_PUBLIC_APP_URL in .env.example"
```

---

## NICE-TO-HAVE ITEMS

### Task 5: Remove unused variables in due-diligence.ts

**Files:**
- Modify: `src/lib/actions/due-diligence.ts:17-50` (remove unused constants)

**Step 1: Remove the three unused label constants**

Delete `DD_CATEGORY_LABELS` (lines 17-33), `DD_STATUS_LABELS` (lines 35-42), and `PRIORITY_LABELS` (lines 44-50). Also remove the import of `DDCategory` and `DDStatus` from `@prisma/client` if those types are ONLY used by these deleted constants — check first.

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero warnings from `due-diligence.ts`.

**Step 3: Commit**

```bash
git add src/lib/actions/due-diligence.ts
git commit -m "chore: remove unused label constants in due-diligence.ts"
```

---

### Task 6: Replace img tags with Next.js Image in landing page

**Files:**
- Modify: `src/app/page.tsx:302-306,333-337`

**Step 1: Add Image import**

At the top of `src/app/page.tsx`, add:

```typescript
import Image from 'next/image'
```

**Step 2: Replace first img tag (line 302-306)**

From:
```tsx
<img
    src="/images/cockpit-preview.png"
    alt="BlackGem Manager Dashboard — Deal Pipeline"
    className="w-full h-full object-cover object-top"
/>
```

To:
```tsx
<Image
    src="/images/cockpit-preview.png"
    alt="BlackGem Manager Dashboard — Deal Pipeline"
    className="w-full h-full object-cover object-top"
    fill
    sizes="500px"
    priority
/>
```

**Step 3: Replace second img tag (line 333-337)**

From:
```tsx
<img
    src="/images/library-preview.png"
    alt="BlackGem LP Portal — Investment Overview"
    className="w-full h-full object-cover object-top"
/>
```

To:
```tsx
<Image
    src="/images/library-preview.png"
    alt="BlackGem LP Portal — Investment Overview"
    className="w-full h-full object-cover object-top"
    fill
    sizes="500px"
/>
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Zero `@next/next/no-img-element` warnings.

**Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "perf: use Next.js Image component on landing page"
```

---

### Task 7: Migrate from deprecated next lint to ESLint CLI

**Files:**
- Modify: `package.json:9` (update lint script)

**Step 1: Update lint script**

In `package.json`, change:

```json
"lint": "next lint",
```

To:

```json
"lint": "eslint src/",
```

**Step 2: Verify lint runs**

Run: `npm run lint`
Expected: Runs without deprecation warning. Same results as before (zero errors, only pre-existing warnings if any).

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: migrate from deprecated next lint to eslint CLI"
```

---

### Task 8: Full verification + SESSION_HANDOFF.md update

**Step 1: Run full verification suite**

```bash
npx vitest run
npm run build
npm run lint
```

Expected: All pass clean.

**Step 2: Update SESSION_HANDOFF.md**

Update test count (186 → 187+), mark production readiness items as completed, note deal analytics dashboard is done.

**Step 3: Commit and push**

```bash
git add SESSION_HANDOFF.md
git commit -m "docs: update session handoff for production readiness completion"
git push origin main
```
