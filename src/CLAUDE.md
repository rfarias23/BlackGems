# src/ — Code Patterns

Patterns specific to this directory. Read root `CLAUDE.md` first.

---

## Server Action Pattern (every mutation)

```typescript
'use server'

import { auth } from '@/lib/auth'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { logAudit, computeChanges } from '@/lib/shared/audit'
import { schema } from './schemas'

export async function mutateEntity(input: Input) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  await requireFundAccess(session.user.id, input.fundId)

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const existing = await db.entity.findFirst({ where: { id: input.id, ...notDeleted } })

  const result = await db.entity.update({ where: { id: input.id }, data: parsed.data })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Entity',
    entityId: result.id,
    changes: computeChanges(existing, result),
  })

  revalidatePath('/path')
  return { success: true, data: result }
}
```

---

## Soft Delete Filter

Always include in queries on core entities:

```typescript
import { notDeleted } from '@/lib/shared/soft-delete'

// In every findMany / findFirst on soft-deletable models
await db.deal.findMany({ where: { fundId, ...notDeleted } })
```

---

## Brand Colors

Do not modify. Reference only.

| Token | Hex | Usage |
|-------|-----|-------|
| Midnight Ink | `#11141D` | Primary background |
| Heritage Sapphire | `#3E5CFF` | CTAs only |
| Text Primary | `#F8FAFC` | Body text |
| Muted | `#94A3B8` | Secondary text, empty states |
| Border | `#334155` | Dividers, table borders |
| Success | `#059669` | Positive metrics only |

---

## Typography Rules

| Context | Class |
|---------|-------|
| Page titles | `font-serif` (Source Serif 4) |
| Financial numbers | `font-mono tabular-nums` (JetBrains Mono) |
| UI / body | Default (Inter) |
| Headlines / hero | `font-display` (Fraunces) |

---

## Table Pattern

```tsx
<table>
  <thead>
    <tr className="border-b border-[#334155]">
      <th className="text-xs tracking-wider uppercase text-[#94A3B8] font-normal text-left py-3 px-4">
        Column
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[#334155]">
      <td className="py-3 px-4 font-mono tabular-nums text-sm">
        $1,234,567
      </td>
    </tr>
  </tbody>
</table>
```

Horizontal borders only. No vertical lines. No zebra striping.

---

## Empty State Pattern

```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3">
  <IconName className="w-8 h-8 text-[#94A3B8]" />
  <p className="text-sm text-[#94A3B8]">No deals yet.</p>
</div>
```

Muted text. Relevant icon. No illustrations. No CTAs unless essential.

---

## AI Features Pattern

All AI output is a **suggestion** — never auto-saved. Always:
1. Show result in a "Suggested" state (label: `text-[#94A3B8]`)
2. User confirms or edits before save
3. Log cost via `logAudit()` with `entityType: 'AIGeneration'`

Rate limits: 30 AI requests / user / hour · 100 AI requests / fund / day (see `src/lib/ai/shared/rate-limiter.ts`)
