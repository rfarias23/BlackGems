# Fix Tab Reset After Document Mutations

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent detail page tabs from resetting to "Overview" after document upload, delete, or visibility toggle.

**Architecture:** Replace all `window.location.reload()` calls with Next.js `router.refresh()` to preserve client-side tab state while still fetching fresh server data. The upload route already calls `revalidatePath()` server-side, so `router.refresh()` picks up the new data without destroying the React tree.

**Tech Stack:** Next.js App Router (`useRouter`), shadcn/ui Tabs, React `useTransition`

---

## Root Cause Analysis

Two factors combine to cause the bug:

1. **`Tabs defaultValue="overview"`** — Tab state in `/deals/[id]` and `/investors/[id]` is purely client-side (not persisted to URL search params). When the React tree remounts, tabs reset to the default.

2. **`window.location.reload()`** — Three call sites do full page reloads after document mutations, which destroys the React tree and remounts everything from scratch.

| File | Line | Trigger | Impact |
|------|------|---------|--------|
| `src/components/documents/document-upload-button.tsx` | 142 | After upload success | Tab resets to Overview |
| `src/components/documents/document-list.tsx` | 92 | After delete success | Tab resets to Overview |
| `src/components/documents/document-list.tsx` | 166 | After visibility toggle | Tab resets to Overview |

**Why `router.refresh()` solves this:** It re-fetches server components and updates the React tree in-place, preserving all client-side state (active tab, scroll position, form inputs). The upload API route already calls `revalidatePath('/deals/${dealId}')`, so the server cache is invalidated and `router.refresh()` picks up fresh data.

**Pages affected:** `/deals/[id]` (8 tabs), `/investors/[id]` (5 tabs). Both use `defaultValue="overview"` with no URL persistence.

**Pages NOT affected:** `/capital` and `/settings` already persist tab state to URL params — they're safe even with full reloads.

---

### Task 1: Fix `document-upload-button.tsx`

**Files:**
- Modify: `src/components/documents/document-upload-button.tsx`

**Step 1: Add `useRouter` import**

Line 3, change:
```typescript
import { useState, useRef } from 'react';
```
to:
```typescript
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
```

**Step 2: Initialize router**

Inside the component function, after line 71 (`export function DocumentUploadButton(...)`), add:
```typescript
const router = useRouter();
```

**Step 3: Replace `window.location.reload()`**

Line 142, change:
```typescript
// Force page refresh to show new document
window.location.reload();
```
to:
```typescript
router.refresh();
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 5: Commit**

```bash
git add src/components/documents/document-upload-button.tsx
git commit -m "fix(documents): use router.refresh() after upload to preserve tab state"
```

---

### Task 2: Fix `document-list.tsx`

**Files:**
- Modify: `src/components/documents/document-list.tsx`

**Step 1: Add `useRouter` import**

Line 3, change:
```typescript
import { useState, useTransition } from 'react';
```
to:
```typescript
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
```

**Step 2: Initialize router**

Inside the component function, after line 84 (`const [isPending, startTransition] = useTransition();`), add:
```typescript
const router = useRouter();
```

**Step 3: Replace `window.location.reload()` in handleDelete**

Line 92, change:
```typescript
window.location.reload();
```
to:
```typescript
router.refresh();
```

**Step 4: Replace `window.location.reload()` in visibility toggle**

Line 166, change:
```typescript
window.location.reload()
```
to:
```typescript
router.refresh()
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 6: Commit**

```bash
git add src/components/documents/document-list.tsx
git commit -m "fix(documents): use router.refresh() after delete and visibility toggle"
```

---

### Task 3: Build, Lint, Test

Run:
```bash
npm run build         # Zero errors
npm run lint          # Zero warnings
npx vitest run        # All existing tests pass
```

---

### Task 4: Commit and Push

**Modified files:**
1. `src/components/documents/document-upload-button.tsx` — `router.refresh()` after upload
2. `src/components/documents/document-list.tsx` — `router.refresh()` after delete + visibility toggle

**Commit message:**
```
fix(documents): preserve active tab after document mutations

Replace window.location.reload() with router.refresh() in upload,
delete, and visibility toggle flows. Full page reload destroys the
React tree and resets Tabs to defaultValue="overview", losing the
user's position on the Documents tab.

router.refresh() re-fetches server components while preserving
client-side state (active tab, scroll position).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Verification

1. Open a deal → go to Documents tab → upload a file → should stay on Documents tab
2. Open a deal → go to Documents tab → delete a file → should stay on Documents tab
3. Open a deal → go to Documents tab → toggle LP visibility → should stay on Documents tab
4. Same three tests on an investor detail page
5. Verify document list updates immediately (new doc appears, deleted doc disappears)

---

## Out of Scope (Future Improvement)

Persisting tab state to URL search params (`?tab=documents`) for deal and investor detail pages. This would make tabs bookmarkable and survive hard browser refreshes. Not needed for this fix since `router.refresh()` eliminates the forced reload that causes the problem.
