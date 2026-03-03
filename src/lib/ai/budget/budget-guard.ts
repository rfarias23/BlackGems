import { prisma } from '@/lib/prisma'

export interface BudgetCheckResult {
  allowed: boolean
  usedUSD: number
  budgetUSD: number
}

/**
 * Lightweight budget guard. Aggregates AIInteraction costs from the audit log
 * for the current calendar month and compares against the budget.
 *
 * Marcus Correction 2: Aggregates by userId (not fundId) to prevent users
 * from bypassing budget limits by switching between funds in the same
 * organization. A single user's total AI spend is capped regardless of
 * which fund they're querying.
 *
 * This is intentionally simple: one query, one comparison.
 * Fire-and-forget if it fails — never block the user on a budget check error.
 */
export async function checkBudget(
  userId: string,
  monthlyBudgetUSD: number
): Promise<BudgetCheckResult> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const interactions = await prisma.auditLog.findMany({
    where: {
      entityType: 'AIInteraction',
      userId,
      action: 'CREATE',
      createdAt: { gte: startOfMonth },
    },
    select: { changes: true },
  })

  let usedUSD = 0
  for (const row of interactions) {
    const changes = row.changes as Record<string, { new?: number }> | null
    const cost = changes?.costUSD?.new
    if (typeof cost === 'number') {
      usedUSD += cost
    }
  }

  return {
    allowed: usedUSD < monthlyBudgetUSD,
    usedUSD: Math.round(usedUSD * 10000) / 10000,
    budgetUSD: monthlyBudgetUSD,
  }
}
