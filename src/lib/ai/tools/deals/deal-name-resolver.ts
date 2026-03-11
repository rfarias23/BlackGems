import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'

type ResolveResult =
  | { dealId: string; dealName: string }
  | { ambiguous: true; candidates: Array<{ id: string; name: string }> }
  | { notFound: true; query: string }

export async function resolveDealName(
  nameOrId: string,
  fundId: string
): Promise<ResolveResult> {
  const query = nameOrId.trim()

  // Load all active deals for the fund (typically < 100)
  const deals = await prisma.deal.findMany({
    where: { fundId, status: { in: ['ACTIVE', 'ON_HOLD'] }, ...notDeleted },
    select: { id: true, companyName: true, stage: true },
    orderBy: { companyName: 'asc' },
  })

  // 1. Try ID passthrough (if query looks like a cuid)
  if (query.length > 20 && !query.includes(' ')) {
    const byId = await prisma.deal.findFirst({
      where: { id: query, fundId, ...notDeleted },
      select: { id: true, companyName: true },
    })
    if (byId) return { dealId: byId.id, dealName: byId.companyName }
  }

  const lower = query.toLowerCase()

  // 2. Exact match (case-insensitive)
  const exactMatch = deals.find(d => d.companyName.toLowerCase() === lower)
  if (exactMatch) return { dealId: exactMatch.id, dealName: exactMatch.companyName }

  // 3. Substring match
  const substringMatches = deals.filter(d =>
    d.companyName.toLowerCase().includes(lower) ||
    lower.includes(d.companyName.toLowerCase())
  )

  // 4. Token match — split query into words and match against deal name tokens
  const queryTokens = lower.split(/\s+/)
  const tokenMatches = substringMatches.length === 0
    ? deals.filter(d => {
        const dealTokens = d.companyName.toLowerCase().split(/\s+/)
        return queryTokens.some(qt => dealTokens.some(dt => dt.startsWith(qt) || qt.startsWith(dt)))
      })
    : substringMatches

  if (tokenMatches.length === 1) {
    return { dealId: tokenMatches[0].id, dealName: tokenMatches[0].companyName }
  }

  if (tokenMatches.length > 1) {
    return {
      ambiguous: true,
      candidates: tokenMatches.map(d => ({ id: d.id, name: d.companyName })),
    }
  }

  return { notFound: true, query }
}
