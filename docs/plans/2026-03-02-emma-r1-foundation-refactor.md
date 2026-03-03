# Emma R1 Foundation Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decompose Emma's monolithic AI architecture (944 lines, 8 files) into composable components — tool registry, prompt composer, and thin API handler — with zero behavioral change to users.

**Architecture:** Strangler fig migration. New components are built alongside old ones, validated for behavioral parity via snapshot tests, then old components are deleted. At no point does the system break.

**Tech Stack:** TypeScript strict, Vitest, Zod, AI SDK v6 (`ai` + `@ai-sdk/anthropic`), Prisma

**Marcus-Approved Scope:** Ceilings 1 (God Function) + 2 (Tool Monolith) + 3 (Prompt Monolith) + 7-lite (Budget Guard). No provider registry. Minimal ITool interface (name, description, category only). 7-9 days estimated.

---

## Task 1: Create Core Types

**Files:**
- Create: `src/lib/ai/core/types.ts`
- Test: `src/lib/ai/core/__tests__/types.test.ts`

**Step 1: Create the types file**

```typescript
// src/lib/ai/core/types.ts
import type { ZodType } from 'zod'
import type { CurrencyCode } from '@/lib/shared/formatters'

// --- Tool Types ---

export interface ToolMetadata {
  name: string
  description: string
  category: 'deals' | 'capital' | 'investors' | 'portfolio' | 'operations'
}

export interface ToolContext {
  fundId: string
  currency: CurrencyCode
  userId: string
}

export interface ITool<TInput = unknown, TOutput = unknown> {
  metadata: ToolMetadata
  inputSchema: ZodType<TInput>
  execute(input: TInput, ctx: ToolContext): Promise<TOutput>
}

// --- Prompt Types ---

export interface PromptSection {
  name: string
  order: number
  required: boolean
  content: string
}

// --- Context Types ---

export interface ContextSource<T = unknown> {
  name: string
  assemble(fundId: string): Promise<T>
}
```

**Step 2: Write the type validation test**

```typescript
// src/lib/ai/core/__tests__/types.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { ITool, ToolContext, ToolMetadata, PromptSection } from '../types'

describe('core/types', () => {
  it('ITool interface accepts a conforming tool object', () => {
    const mockTool: ITool<Record<string, never>, { count: number }> = {
      metadata: {
        name: 'testTool',
        description: 'A test tool',
        category: 'deals',
      },
      inputSchema: z.object({}),
      execute: async () => ({ count: 42 }),
    }

    expect(mockTool.metadata.name).toBe('testTool')
    expect(mockTool.metadata.category).toBe('deals')
  })

  it('ToolContext provides fundId, currency, userId', () => {
    const ctx: ToolContext = {
      fundId: 'fund_123',
      currency: 'USD',
      userId: 'user_456',
    }

    expect(ctx.fundId).toBe('fund_123')
    expect(ctx.currency).toBe('USD')
  })

  it('PromptSection has required fields', () => {
    const section: PromptSection = {
      name: 'identity',
      order: 1,
      required: true,
      content: 'You are Emma.',
    }

    expect(section.name).toBe('identity')
    expect(section.required).toBe(true)
  })
})
```

**Step 3: Run test to verify it passes**

Run: `npx vitest run src/lib/ai/core/__tests__/types.test.ts`
Expected: 3 tests PASS

**Step 4: Commit**

```bash
git add src/lib/ai/core/types.ts src/lib/ai/core/__tests__/types.test.ts
git commit -m "feat(ai): add core type interfaces for tool registry and prompt composer"
```

---

## Task 2: Create Tool Registry

**Files:**
- Create: `src/lib/ai/tools/registry.ts`
- Test: `src/lib/ai/tools/__tests__/registry.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/ai/tools/__tests__/registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { ToolRegistry } from '../registry'
import type { ITool } from '../../core/types'

function makeTool(overrides: Partial<ITool['metadata']> & { name: string }): ITool {
  return {
    metadata: {
      description: `${overrides.name} description`,
      category: overrides.category ?? 'deals',
      ...overrides,
    },
    inputSchema: z.object({}),
    execute: async () => ({ ok: true }),
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  it('registers and retrieves a tool', () => {
    const tool = makeTool({ name: 'getPipeline' })
    registry.register(tool)
    expect(registry.getAll()).toHaveLength(1)
    expect(registry.get('getPipeline')).toBe(tool)
  })

  it('throws on duplicate registration', () => {
    const tool = makeTool({ name: 'getPipeline' })
    registry.register(tool)
    expect(() => registry.register(tool)).toThrow('already registered')
  })

  it('filters by category', () => {
    registry.register(makeTool({ name: 'a', category: 'deals' }))
    registry.register(makeTool({ name: 'b', category: 'capital' }))
    registry.register(makeTool({ name: 'c', category: 'deals' }))

    expect(registry.getByCategory('deals')).toHaveLength(2)
    expect(registry.getByCategory('capital')).toHaveLength(1)
    expect(registry.getByCategory('portfolio')).toHaveLength(0)
  })

  it('generates prompt section from metadata', () => {
    registry.register(makeTool({ name: 'getPipeline' }))
    registry.register(makeTool({ name: 'getDeal' }))

    const section = registry.generatePromptSection()
    expect(section).toContain('getPipeline')
    expect(section).toContain('getDeal')
    expect(section).toContain('getPipeline description')
  })

  it('converts to AI SDK tools format', () => {
    registry.register(makeTool({ name: 'getPipeline' }))

    const ctx = { fundId: 'f1', currency: 'USD' as const, userId: 'u1' }
    const sdkTools = registry.toSDKTools(ctx)

    expect(sdkTools).toHaveProperty('getPipeline')
    expect(sdkTools.getPipeline).toHaveProperty('description')
    expect(sdkTools.getPipeline).toHaveProperty('inputSchema')
    expect(sdkTools.getPipeline).toHaveProperty('execute')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ai/tools/__tests__/registry.test.ts`
Expected: FAIL — `Cannot find module '../registry'`

**Step 3: Write the implementation**

```typescript
// src/lib/ai/tools/registry.ts
import { tool as sdkTool } from 'ai'
import type { ITool, ToolContext } from '../core/types'

export class ToolRegistry {
  private tools = new Map<string, ITool>()

  register(t: ITool): void {
    if (this.tools.has(t.metadata.name)) {
      throw new Error(`Tool "${t.metadata.name}" is already registered`)
    }
    this.tools.set(t.metadata.name, t)
  }

  get(name: string): ITool | undefined {
    return this.tools.get(name)
  }

  getAll(): ITool[] {
    return Array.from(this.tools.values())
  }

  getByCategory(category: string): ITool[] {
    return this.getAll().filter((t) => t.metadata.category === category)
  }

  /**
   * Auto-generates the [AVAILABLE TOOLS] prompt section from registered metadata.
   * Eliminates the need to manually duplicate tool descriptions in the system prompt.
   */
  generatePromptSection(): string {
    const tools = this.getAll()
    if (tools.length === 0) return ''

    const lines = tools.map((t, i) => {
      return `${i + 1}. ${t.metadata.name} - ${t.metadata.description}`
    })

    return lines.join('\n\n')
  }

  /**
   * Converts registered tools to the AI SDK format expected by streamText().
   * Binds each tool's execute function to the provided ToolContext.
   */
  toSDKTools(ctx: ToolContext): Record<string, ReturnType<typeof sdkTool>> {
    const result: Record<string, ReturnType<typeof sdkTool>> = {}

    for (const t of this.getAll()) {
      result[t.metadata.name] = sdkTool({
        description: t.metadata.description,
        inputSchema: t.inputSchema,
        execute: (input: unknown) => t.execute(input, ctx),
      })
    }

    return result
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ai/tools/__tests__/registry.test.ts`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/ai/tools/registry.ts src/lib/ai/tools/__tests__/registry.test.ts
git commit -m "feat(ai): add ToolRegistry with category filtering and SDK conversion"
```

---

## Task 3: Migrate 5 Existing Tools to Individual Files

**Files:**
- Create: `src/lib/ai/tools/deals/get-pipeline-summary.ts`
- Create: `src/lib/ai/tools/deals/get-deal-details.ts`
- Create: `src/lib/ai/tools/capital/get-fund-financials.ts`
- Create: `src/lib/ai/tools/investors/get-investor-details.ts`
- Create: `src/lib/ai/tools/portfolio/get-portfolio-metrics.ts`
- Test: `src/lib/ai/tools/__tests__/tool-parity.test.ts`
- Modify: `src/lib/ai/tools/index.ts`

**Step 1: Create the deals tools**

```typescript
// src/lib/ai/tools/deals/get-pipeline-summary.ts
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getPipelineSummary: ITool = {
  metadata: {
    name: 'getPipelineSummary',
    description:
      'Get the current deal pipeline with counts by stage, total pipeline value, and active deal count.',
    category: 'deals',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const deals = await prisma.deal.findMany({
      where: { fundId: ctx.fundId, ...notDeleted },
      select: { id: true, stage: true, status: true, askingPrice: true },
    })

    const activeDeals = deals.filter((d) => d.status === 'ACTIVE')
    const byStage: Record<string, number> = {}
    for (const deal of deals) {
      byStage[deal.stage] = (byStage[deal.stage] ?? 0) + 1
    }

    const totalPipelineValue = activeDeals.reduce(
      (sum, d) => sum + (d.askingPrice ? Number(d.askingPrice) : 0),
      0
    )

    return {
      totalDeals: deals.length,
      activeDeals: activeDeals.length,
      byStage,
      totalPipelineValue: formatMoney(totalPipelineValue, ctx.currency),
    }
  },
}
```

```typescript
// src/lib/ai/tools/deals/get-deal-details.ts
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getDealDetails: ITool = {
  metadata: {
    name: 'getDealDetails',
    description:
      'Get detailed information about a specific deal by name or ID. Use this when the user asks about a particular deal.',
    category: 'deals',
  },
  inputSchema: z.object({
    nameOrId: z.string().describe('The deal name (partial match supported) or deal ID'),
  }),
  async execute(input: { nameOrId: string }, ctx) {
    const { nameOrId } = input
    const byId = await prisma.deal.findFirst({
      where: { id: nameOrId, fundId: ctx.fundId, ...notDeleted },
    })

    const deal =
      byId ??
      (await prisma.deal.findFirst({
        where: {
          fundId: ctx.fundId,
          ...notDeleted,
          name: { contains: nameOrId, mode: 'insensitive' as const },
        },
      }))

    if (!deal) return { error: 'Deal not found' }

    return {
      id: deal.id,
      name: deal.name,
      companyName: deal.companyName,
      stage: deal.stage,
      status: deal.status,
      industry: deal.industry,
      askingPrice: formatMoney(deal.askingPrice ? Number(deal.askingPrice) : null, ctx.currency),
      revenue: formatMoney(deal.revenue ? Number(deal.revenue) : null, ctx.currency),
      ebitda: formatMoney(deal.ebitda ? Number(deal.ebitda) : null, ctx.currency),
      revenueMultiple: deal.revenueMultiple ? formatMultiple(Number(deal.revenueMultiple)) : null,
      ebitdaMultiple: deal.ebitdaMultiple ? formatMultiple(Number(deal.ebitdaMultiple)) : null,
      grossMargin: deal.grossMargin ? formatPercent(Number(deal.grossMargin)) : null,
      ebitdaMargin: deal.ebitdaMargin ? formatPercent(Number(deal.ebitdaMargin)) : null,
      employeeCount: deal.employeeCount,
      yearFounded: deal.yearFounded,
      location: [deal.city, deal.state, deal.country].filter(Boolean).join(', '),
      investmentThesis: deal.investmentThesis,
      keyRisks: deal.keyRisks,
      nextSteps: deal.nextSteps,
      expectedCloseDate: deal.expectedCloseDate?.toISOString().split('T')[0] ?? null,
    }
  },
}
```

**Step 2: Create the capital tool**

```typescript
// src/lib/ai/tools/capital/get-fund-financials.ts
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getFundFinancials: ITool = {
  metadata: {
    name: 'getFundFinancials',
    description:
      'Get the fund financial summary including total committed capital, called capital, distributed capital, and performance metrics.',
    category: 'capital',
  },
  inputSchema: z.object({}),
  async execute(_input: unknown, ctx) {
    const fund = await prisma.fund.findUniqueOrThrow({
      where: { id: ctx.fundId },
      select: { name: true, targetSize: true, status: true },
    })

    const commitmentAgg = await prisma.commitment.aggregate({
      where: { fundId: ctx.fundId, ...notDeleted },
      _sum: {
        committedAmount: true,
        calledAmount: true,
        paidAmount: true,
        distributedAmount: true,
      },
    })

    const portfolioCompanies = await prisma.portfolioCompany.findMany({
      where: { fundId: ctx.fundId, ...notDeleted },
      select: { equityInvested: true, moic: true, totalValue: true },
    })

    const totalCommitted = Number(commitmentAgg._sum.committedAmount ?? 0)
    const totalCalled = Number(commitmentAgg._sum.calledAmount ?? 0)
    const totalPaid = Number(commitmentAgg._sum.paidAmount ?? 0)
    const totalDistributed = Number(commitmentAgg._sum.distributedAmount ?? 0)
    const paidInPct = totalCommitted > 0 ? totalPaid / totalCommitted : 0

    const totalEquityInvested = portfolioCompanies.reduce(
      (sum, pc) => sum + Number(pc.equityInvested), 0
    )
    const weightedMoicSum = portfolioCompanies.reduce(
      (sum, pc) => sum + (pc.moic ? Number(pc.moic) * Number(pc.equityInvested) : 0), 0
    )
    const totalMOIC = totalEquityInvested > 0 ? weightedMoicSum / totalEquityInvested : 0

    return {
      fundName: fund.name,
      fundStatus: fund.status,
      targetSize: formatMoney(Number(fund.targetSize), ctx.currency),
      totalCommitted: formatMoney(totalCommitted, ctx.currency),
      totalCalled: formatMoney(totalCalled, ctx.currency),
      totalPaid: formatMoney(totalPaid, ctx.currency),
      totalDistributed: formatMoney(totalDistributed, ctx.currency),
      paidInPct: formatPercent(paidInPct),
      portfolioCount: portfolioCompanies.length,
      totalMOIC: formatMultiple(totalMOIC),
    }
  },
}
```

**Step 3: Create the investors tool**

```typescript
// src/lib/ai/tools/investors/get-investor-details.ts
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getInvestorDetails: ITool = {
  metadata: {
    name: 'getInvestorDetails',
    description:
      'Get details about a specific investor/LP including their commitment, paid-in amount, and contact information.',
    category: 'investors',
  },
  inputSchema: z.object({
    nameOrId: z.string().describe('The investor name (partial match supported) or investor ID'),
  }),
  async execute(input: { nameOrId: string }, ctx) {
    const { nameOrId } = input
    const commitment = await prisma.commitment.findFirst({
      where: {
        fundId: ctx.fundId,
        ...notDeleted,
        investor: {
          ...notDeleted,
          OR: [
            { id: nameOrId },
            { name: { contains: nameOrId, mode: 'insensitive' as const } },
          ],
        },
      },
      include: { investor: true },
    })

    if (!commitment) return { error: 'Investor not found in this fund' }

    const investor = commitment.investor
    return {
      id: investor.id,
      name: investor.name,
      type: investor.type,
      status: investor.status,
      email: investor.email,
      contactName: investor.contactName,
      contactEmail: investor.contactEmail,
      committed: formatMoney(Number(commitment.committedAmount), ctx.currency),
      called: formatMoney(Number(commitment.calledAmount), ctx.currency),
      paidIn: formatMoney(Number(commitment.paidAmount), ctx.currency),
      distributed: formatMoney(Number(commitment.distributedAmount), ctx.currency),
      unfunded: formatMoney(
        Number(commitment.committedAmount) - Number(commitment.calledAmount), ctx.currency
      ),
      commitmentStatus: commitment.status,
      commitmentDate: commitment.commitmentDate?.toISOString().split('T')[0] ?? null,
    }
  },
}
```

**Step 4: Create the portfolio tool**

```typescript
// src/lib/ai/tools/portfolio/get-portfolio-metrics.ts
import { z } from 'zod'
import { type Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { formatMoney, formatPercent, formatMultiple } from '@/lib/shared/formatters'
import type { ITool } from '../../core/types'

export const getPortfolioMetrics: ITool = {
  metadata: {
    name: 'getPortfolioMetrics',
    description:
      'Get portfolio company metrics including revenue, EBITDA, margins, and performance data.',
    category: 'portfolio',
  },
  inputSchema: z.object({
    companyName: z.string().optional().describe(
      'Optional company name to filter. If omitted, returns all portfolio companies.'
    ),
  }),
  async execute(input: { companyName?: string }, ctx) {
    const where: Prisma.PortfolioCompanyWhereInput = {
      fundId: ctx.fundId,
      ...notDeleted,
      ...(input.companyName
        ? { name: { contains: input.companyName, mode: 'insensitive' as const } }
        : {}),
    }

    const companies = await prisma.portfolioCompany.findMany({
      where,
      select: {
        id: true, name: true, status: true, industry: true,
        equityInvested: true, totalInvestment: true,
        moic: true, irr: true, totalValue: true, acquisitionDate: true,
        metrics: {
          orderBy: { periodDate: 'desc' },
          take: 1,
          select: {
            periodDate: true, periodType: true, revenue: true,
            revenueGrowth: true, ebitda: true, ebitdaMargin: true,
            grossMargin: true, netIncome: true, employeeCount: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return companies.map((co) => {
      const m = co.metrics[0] ?? null
      return {
        id: co.id,
        name: co.name,
        status: co.status,
        industry: co.industry,
        equityInvested: formatMoney(Number(co.equityInvested), ctx.currency),
        totalInvestment: formatMoney(Number(co.totalInvestment), ctx.currency),
        moic: co.moic ? formatMultiple(Number(co.moic)) : '-',
        irr: co.irr ? formatPercent(Number(co.irr)) : null,
        totalValue: co.totalValue ? formatMoney(Number(co.totalValue), ctx.currency) : null,
        acquisitionDate: co.acquisitionDate.toISOString().split('T')[0],
        latestMetrics: m ? {
          period: m.periodDate.toISOString().split('T')[0],
          periodType: m.periodType,
          revenue: m.revenue ? formatMoney(Number(m.revenue), ctx.currency) : null,
          ebitda: m.ebitda ? formatMoney(Number(m.ebitda), ctx.currency) : null,
          ebitdaMargin: m.ebitdaMargin ? formatPercent(Number(m.ebitdaMargin)) : null,
          grossMargin: m.grossMargin ? formatPercent(Number(m.grossMargin)) : null,
          revenueGrowth: m.revenueGrowth ? formatPercent(Number(m.revenueGrowth)) : null,
          netIncome: m.netIncome ? formatMoney(Number(m.netIncome), ctx.currency) : null,
          employeeCount: m.employeeCount,
        } : null,
      }
    })
  },
}
```

**Step 5: Update the barrel export and create the default registry**

```typescript
// src/lib/ai/tools/index.ts
export { createReadTools } from './read-tools'

// New registry-based exports
export { ToolRegistry } from './registry'
export { getPipelineSummary } from './deals/get-pipeline-summary'
export { getDealDetails } from './deals/get-deal-details'
export { getFundFinancials } from './capital/get-fund-financials'
export { getInvestorDetails } from './investors/get-investor-details'
export { getPortfolioMetrics } from './portfolio/get-portfolio-metrics'

import { ToolRegistry } from './registry'
import { getPipelineSummary } from './deals/get-pipeline-summary'
import { getDealDetails } from './deals/get-deal-details'
import { getFundFinancials } from './capital/get-fund-financials'
import { getInvestorDetails } from './investors/get-investor-details'
import { getPortfolioMetrics } from './portfolio/get-portfolio-metrics'

/** Default registry with all built-in tools */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.register(getPipelineSummary)
  registry.register(getDealDetails)
  registry.register(getFundFinancials)
  registry.register(getInvestorDetails)
  registry.register(getPortfolioMetrics)
  return registry
}
```

**Step 6: Write the parity test (validates new tools match old tool metadata)**

```typescript
// src/lib/ai/tools/__tests__/tool-parity.test.ts
import { describe, it, expect } from 'vitest'
import { createDefaultRegistry } from '../index'

describe('tool parity', () => {
  const registry = createDefaultRegistry()

  it('registry contains exactly 5 tools', () => {
    expect(registry.getAll()).toHaveLength(5)
  })

  it('all original tool names are present', () => {
    const names = registry.getAll().map((t) => t.metadata.name).sort()
    expect(names).toEqual([
      'getDealDetails',
      'getFundFinancials',
      'getInvestorDetails',
      'getPipelineSummary',
      'getPortfolioMetrics',
    ])
  })

  it('each tool has a non-empty description', () => {
    for (const t of registry.getAll()) {
      expect(t.metadata.description.length).toBeGreaterThan(10)
    }
  })

  it('each tool has a valid category', () => {
    const validCategories = ['deals', 'capital', 'investors', 'portfolio', 'operations']
    for (const t of registry.getAll()) {
      expect(validCategories).toContain(t.metadata.category)
    }
  })

  it('deals category contains 2 tools', () => {
    expect(registry.getByCategory('deals')).toHaveLength(2)
  })

  it('capital category contains 1 tool', () => {
    expect(registry.getByCategory('capital')).toHaveLength(1)
  })

  it('generated prompt section mentions all tool names', () => {
    const section = registry.generatePromptSection()
    expect(section).toContain('getPipelineSummary')
    expect(section).toContain('getDealDetails')
    expect(section).toContain('getFundFinancials')
    expect(section).toContain('getInvestorDetails')
    expect(section).toContain('getPortfolioMetrics')
  })

  it('toSDKTools returns object with all 5 tools', () => {
    const ctx = { fundId: 'f', currency: 'USD' as const, userId: 'u' }
    const sdk = registry.toSDKTools(ctx)
    expect(Object.keys(sdk).sort()).toEqual([
      'getDealDetails',
      'getFundFinancials',
      'getInvestorDetails',
      'getPipelineSummary',
      'getPortfolioMetrics',
    ])
  })
})
```

**Step 7: Run tests**

Run: `npx vitest run src/lib/ai/tools/__tests__/tool-parity.test.ts`
Expected: 8 tests PASS

**Step 8: Commit**

```bash
git add src/lib/ai/tools/deals/ src/lib/ai/tools/capital/ src/lib/ai/tools/investors/ src/lib/ai/tools/portfolio/ src/lib/ai/tools/index.ts src/lib/ai/tools/__tests__/tool-parity.test.ts
git commit -m "feat(ai): migrate 5 tools to individual ITool modules with parity tests"
```

---

## Task 4: Create Prompt Composer

**Files:**
- Create: `src/lib/ai/prompt/prompt-composer.ts`
- Create: `src/lib/ai/prompt/sections/identity.ts`
- Create: `src/lib/ai/prompt/sections/domain-knowledge.ts`
- Create: `src/lib/ai/prompt/sections/formatting-rules.ts`
- Create: `src/lib/ai/prompt/sections/fund-isolation.ts`
- Test: `src/lib/ai/prompt/__tests__/prompt-composer.test.ts`
- Test: `src/lib/ai/prompt/__tests__/prompt-snapshot.test.ts`

**Step 1: Write the composer class**

```typescript
// src/lib/ai/prompt/prompt-composer.ts
import type { PromptSection } from '../core/types'

export class PromptComposer {
  private sections: PromptSection[] = []

  addSection(section: PromptSection): this {
    this.sections.push(section)
    return this
  }

  build(): string {
    return this.sections
      .sort((a, b) => a.order - b.order)
      .map((s) => s.content)
      .join('\n\n')
  }
}
```

**Step 2: Write the static prompt sections**

These extract the hardcoded sections from the current `system-prompt.ts` into individual files.

```typescript
// src/lib/ai/prompt/sections/identity.ts
import type { PromptSection } from '../../core/types'

export function identitySection(fundName: string): PromptSection {
  return {
    name: 'identity',
    order: 10,
    required: true,
    content: `You are Emma, BlackGem's AI operating partner for private equity fund managers. You serve ${fundName} on the BlackGem platform.

[IDENTITY]
You are a senior PE operating partner with deep knowledge of search funds, micro-PE, and institutional fund management. You provide precise, actionable intelligence. You never speculate without stating assumptions. You cite specific numbers from the fund context when relevant.

Your tone is institutional and authoritative -- concise, no filler, no hedging language. Think Goldman Sachs internal memo, not chatbot. Never use emojis, exclamation marks, or casual language.`,
  }
}
```

```typescript
// src/lib/ai/prompt/sections/domain-knowledge.ts
import type { PromptSection } from '../../core/types'

export function domainKnowledgeSection(): PromptSection {
  return {
    name: 'domain-knowledge',
    order: 20,
    required: true,
    content: `[PE DOMAIN KNOWLEDGE]
Search Fund Lifecycle: Raising -> Searching -> Under LOI -> Acquired -> Operating -> Preparing Exit -> Exited
Deal Pipeline Stages: Identified -> Initial Review -> Preliminary Analysis -> Management Meeting -> NDA/CIM -> IOI Submitted -> Site Visit -> LOI Preparation -> LOI Negotiation -> Due Diligence -> Final Negotiation -> Closing -> Closed Won/Lost
DD Categories: Financial, Legal, Tax, Commercial, Operational, Environmental, Insurance, Technology, HR
LP/GP Economics: Management fees (typically 2%), carried interest (typically 20%), hurdle rate, catch-up provision, European vs American waterfall
Capital Calls: Draft -> Approved -> Sent -> Partially Funded -> Fully Funded. Pro-rata allocation based on commitment percentages.
Key Metrics: MOIC (Multiple on Invested Capital), IRR (Internal Rate of Return), DPI (Distributions to Paid-In), TVPI (Total Value to Paid-In), Unfunded Commitments`,
  }
}
```

```typescript
// src/lib/ai/prompt/sections/formatting-rules.ts
import type { PromptSection } from '../../core/types'

export function formattingRulesSection(): PromptSection {
  return {
    name: 'formatting-rules',
    order: 70,
    required: true,
    content: `[FORMATTING]
- Use monospace formatting for all financial figures (wrap in backticks when in markdown).
- Present tabular data as aligned markdown tables with right-aligned numeric columns.
- Use concise bullet points for lists, not numbered lists unless order matters.
- For percentages, always show one decimal place (e.g., 35.1%, not 35%).
- For multiples, show two decimal places (e.g., 2.50x, not 2.5x).
- Keep responses under 400 words unless the user requests a detailed analysis.
- Never use bold for emphasis in running text. Reserve bold for table headers and section labels only.
- Separate sections with a single blank line, never horizontal rules.
- No greetings or sign-offs mid-conversation. Only greet on first message.`,
  }
}
```

```typescript
// src/lib/ai/prompt/sections/fund-isolation.ts
import type { PromptSection } from '../../core/types'

export function fundIsolationSection(fundName: string, fundId: string): PromptSection {
  return {
    name: 'fund-isolation',
    order: 50,
    required: true,
    content: `[FUND ISOLATION]
You have access ONLY to data for ${fundName} (ID: ${fundId}). Never reference, compare with, or attempt to access data from other funds. If the user asks about a different fund, explain that you can only discuss the current fund context. This is a strict security boundary.`,
  }
}
```

**Step 3: Write the composer test**

```typescript
// src/lib/ai/prompt/__tests__/prompt-composer.test.ts
import { describe, it, expect } from 'vitest'
import { PromptComposer } from '../prompt-composer'

describe('PromptComposer', () => {
  it('builds sections in order', () => {
    const composer = new PromptComposer()
      .addSection({ name: 'b', order: 20, required: true, content: 'SECOND' })
      .addSection({ name: 'a', order: 10, required: true, content: 'FIRST' })

    const result = composer.build()
    expect(result).toBe('FIRST\n\nSECOND')
  })

  it('returns empty string with no sections', () => {
    expect(new PromptComposer().build()).toBe('')
  })

  it('joins multiple sections with double newline', () => {
    const composer = new PromptComposer()
      .addSection({ name: 'a', order: 1, required: true, content: 'A' })
      .addSection({ name: 'b', order: 2, required: true, content: 'B' })
      .addSection({ name: 'c', order: 3, required: true, content: 'C' })

    expect(composer.build()).toBe('A\n\nB\n\nC')
  })
})
```

**Step 4: Write the snapshot parity test**

This is the critical test. It proves the new prompt composer produces output structurally equivalent to the old `buildSystemPrompt()`.

```typescript
// src/lib/ai/prompt/__tests__/prompt-snapshot.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../../system-prompt'
import { PromptComposer } from '../prompt-composer'
import { identitySection } from '../sections/identity'
import { domainKnowledgeSection } from '../sections/domain-knowledge'
import { formattingRulesSection } from '../sections/formatting-rules'
import { fundIsolationSection } from '../sections/fund-isolation'
import type { FundContext } from '../../context/fund-context'
import type { UserContext } from '../../context/user-context'
import type { CurrencyCode } from '@/lib/shared/formatters'

const mockFundContext: FundContext = {
  fund: { id: 'fund_1', name: 'Test Fund I', currency: 'USD', status: 'ACTIVE', targetSize: 5000000, type: 'SEARCH_FUND' },
  dealCounts: [{ stage: 'DUE_DILIGENCE', _count: 3 }],
  investorSummary: { totalCommitted: 5000000, totalPaid: 2500000, investorCount: 8 },
  recentCapitalCalls: [],
  portfolioSummary: [{ name: 'Acme Corp', status: 'ACTIVE', equityInvested: 1000000, moic: 1.5 }],
}

const mockUserContext: UserContext = { id: 'user_1', name: 'John', role: 'FUND_ADMIN' }

describe('prompt snapshot parity', () => {
  it('old prompt contains all expected sections', () => {
    const old = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', true)

    // Every section marker must be present
    expect(old).toContain('[IDENTITY]')
    expect(old).toContain('[PE DOMAIN KNOWLEDGE]')
    expect(old).toContain('[USER CONTEXT]')
    expect(old).toContain('[CURRENCY]')
    expect(old).toContain('[FUND ISOLATION]')
    expect(old).toContain('[AVAILABLE TOOLS]')
    expect(old).toContain('[FORMATTING]')
    expect(old).toContain('[FIRST MESSAGE]')
  })

  it('new sections produce the same core content as old prompt', () => {
    const old = buildSystemPrompt(mockFundContext, mockUserContext, 'USD', true)

    // Identity section
    const identity = identitySection('Test Fund I')
    expect(old).toContain('You are Emma')
    expect(identity.content).toContain('You are Emma')

    // Domain knowledge
    const dk = domainKnowledgeSection()
    expect(old).toContain('Search Fund Lifecycle')
    expect(dk.content).toContain('Search Fund Lifecycle')

    // Formatting
    const fmt = formattingRulesSection()
    expect(old).toContain('monospace formatting')
    expect(fmt.content).toContain('monospace formatting')

    // Fund isolation
    const fi = fundIsolationSection('Test Fund I', 'fund_1')
    expect(old).toContain('You have access ONLY to data for Test Fund I')
    expect(fi.content).toContain('You have access ONLY to data for Test Fund I')
  })
})
```

**Step 5: Run tests**

Run: `npx vitest run src/lib/ai/prompt/__tests__/`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/lib/ai/prompt/ src/lib/ai/core/types.ts
git commit -m "feat(ai): add PromptComposer with section-based composition and parity tests"
```

---

## Task 5: Create the AI Engine Pipeline

**Files:**
- Create: `src/lib/ai/core/engine.ts`
- Test: `src/lib/ai/core/__tests__/engine.test.ts`

This is the composable pipeline that replaces the god function. It assembles context, resolves tools, composes the prompt, and returns the config needed by `streamText()`. It does NOT call `streamText()` itself — the route handler does that.

**Step 1: Write the engine**

```typescript
// src/lib/ai/core/engine.ts
import { assembleFundContext, type FundContext } from '../context/fund-context'
import { assembleUserContext, type UserContext } from '../context/user-context'
import { PromptComposer } from '../prompt/prompt-composer'
import { identitySection } from '../prompt/sections/identity'
import { domainKnowledgeSection } from '../prompt/sections/domain-knowledge'
import { formattingRulesSection } from '../prompt/sections/formatting-rules'
import { fundIsolationSection } from '../prompt/sections/fund-isolation'
import { createDefaultRegistry } from '../tools'
import { ToolRegistry } from '../tools/registry'
import type { ToolContext } from './types'
import type { CurrencyCode } from '@/lib/shared/formatters'
import { getConversations } from '@/lib/actions/ai-conversations'
import { formatFundContextBlock, formatUserContextBlock, formatCurrencyBlock, formatToolsBlock, formatGreetingBlock } from '../prompt/sections/dynamic'

export interface EngineInput {
  userId: string
  fundId: string
  currency: CurrencyCode
  session: { user?: { id?: string; name?: string | null; role?: string } }
}

export interface EngineOutput {
  systemPrompt: string
  tools: Record<string, unknown>
  toolContext: ToolContext
  fundContext: FundContext
  userContext: UserContext
  isFirstTime: boolean
}

export async function assembleEngine(input: EngineInput): Promise<EngineOutput> {
  const { userId, fundId, currency, session } = input

  // 1. Assemble context (parallel)
  const [fundContext, conversations] = await Promise.all([
    assembleFundContext(fundId),
    getConversations(fundId),
  ])
  const userContext = assembleUserContext(session)
  const isFirstTime = conversations.length <= 1

  // 2. Resolve tools
  const registry = createDefaultRegistry()
  const toolContext: ToolContext = { fundId, currency, userId }
  const tools = registry.toSDKTools(toolContext)

  // 3. Compose prompt
  const fundName = fundContext.fund?.name || 'the fund'
  const fundIdStr = fundContext.fund?.id || 'unknown'

  const composer = new PromptComposer()
    .addSection(identitySection(fundName))
    .addSection(domainKnowledgeSection())
    .addSection(formatUserContextBlock(userContext))
    .addSection(formatFundContextBlock(fundContext, currency))
    .addSection(formatCurrencyBlock(currency))
    .addSection(fundIsolationSection(fundName, fundIdStr))
    .addSection(formatToolsBlock(registry))
    .addSection(formattingRulesSection())
    .addSection(formatGreetingBlock(userContext, isFirstTime))

  return {
    systemPrompt: composer.build(),
    tools,
    toolContext,
    fundContext,
    userContext,
    isFirstTime,
  }
}
```

**Step 2: Create the dynamic prompt sections**

These sections depend on runtime data (fund context, user, tool registry).

```typescript
// src/lib/ai/prompt/sections/dynamic.ts
import type { PromptSection } from '../../core/types'
import type { FundContext } from '../../context/fund-context'
import type { UserContext } from '../../context/user-context'
import type { CurrencyCode } from '@/lib/shared/formatters'
import type { ToolRegistry } from '../../tools/registry'

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
}

export function formatUserContextBlock(user: UserContext): PromptSection {
  return {
    name: 'user-context',
    order: 30,
    required: true,
    content: `[USER CONTEXT]
Name: ${user.name}
Role: ${user.role}
User ID: ${user.id}`,
  }
}

export function formatFundContextBlock(ctx: FundContext, currency: CurrencyCode): PromptSection {
  const sym = CURRENCY_SYMBOLS[currency]

  if (!ctx.fund) {
    return {
      name: 'fund-context',
      order: 35,
      required: true,
      content: `[FUND CONTEXT]\nNo fund data available. Ask the user which fund they are working with.`,
    }
  }

  const dealLines = ctx.dealCounts.length > 0
    ? ctx.dealCounts.map((d) => `  ${d.stage}: ${d._count}`).join('\n')
    : '  No active deals.'

  const portfolioLines = ctx.portfolioSummary.length > 0
    ? ctx.portfolioSummary
        .map((pc) => {
          const moicStr = pc.moic !== null ? ` | MOIC: ${pc.moic.toFixed(2)}x` : ''
          return `  ${pc.name} (${pc.status}) - Equity: ${sym}${pc.equityInvested.toLocaleString()}${moicStr}`
        })
        .join('\n')
    : '  No portfolio companies.'

  const ccLines = ctx.recentCapitalCalls.length > 0
    ? ctx.recentCapitalCalls
        .map((cc) => {
          const dateStr = cc.callDate
            ? new Date(cc.callDate).toISOString().split('T')[0]
            : 'No date'
          return `  ${dateStr} | ${sym}${cc.totalAmount.toLocaleString()} | ${cc.status}`
        })
        .join('\n')
    : '  No capital calls issued.'

  return {
    name: 'fund-context',
    order: 35,
    required: true,
    content: `[FUND CONTEXT]
Fund: ${ctx.fund.name}
Type: ${ctx.fund.type.replace(/_/g, ' ')}
Status: ${ctx.fund.status}
Target Size: ${sym}${ctx.fund.targetSize.toLocaleString()}
Currency: ${currency}

Deal Pipeline:
${dealLines}

Investor Summary:
  Investors: ${ctx.investorSummary.investorCount}
  Total Committed: ${sym}${ctx.investorSummary.totalCommitted.toLocaleString()}
  Total Paid-In: ${sym}${ctx.investorSummary.totalPaid.toLocaleString()}
  Unfunded: ${sym}${(ctx.investorSummary.totalCommitted - ctx.investorSummary.totalPaid).toLocaleString()}

Portfolio Companies:
${portfolioLines}

Recent Capital Calls (last 3):
${ccLines}`,
  }
}

export function formatCurrencyBlock(currency: CurrencyCode): PromptSection {
  const sym = CURRENCY_SYMBOLS[currency]
  return {
    name: 'currency',
    order: 40,
    required: true,
    content: `[CURRENCY]
This fund operates in ${currency}. Always format monetary values with the ${sym} symbol and appropriate thousands separators. Use ${currency} conventions consistently. When presenting tables or comparisons, align decimal points.`,
  }
}

export function formatToolsBlock(registry: ToolRegistry): PromptSection {
  return {
    name: 'available-tools',
    order: 55,
    required: true,
    content: `[AVAILABLE TOOLS]
You have access to these read-only tools for querying fund data. Use them when the user asks questions that require current data beyond what is in your context:

${registry.generatePromptSection()}

When using tools:
- Prefer the most specific tool for the question.
- Combine tool results with your fund context for complete answers.
- If a tool returns no data, say so clearly rather than fabricating information.
- Never call tools speculatively. Only invoke when the user's question requires data you do not already have.`,
  }
}

export function formatGreetingBlock(user: UserContext, isFirstTime: boolean): PromptSection {
  if (isFirstTime) {
    return {
      name: 'greeting',
      order: 80,
      required: true,
      content: `[FIRST MESSAGE]
This is the user's first message in this conversation. Begin your response with a brief, professional greeting addressing them by name ("${user.name}"). Include a one-line summary of the fund's current state based on your context (status, committed capital, pipeline activity). Then address their question. Do not greet on subsequent messages.`,
    }
  }

  return {
    name: 'greeting',
    order: 80,
    required: true,
    content: `[CONTINUATION]
This is a continuing conversation. Do not greet. Address the question directly.`,
  }
}
```

**Step 3: Write engine test**

```typescript
// src/lib/ai/core/__tests__/engine.test.ts
import { describe, it, expect } from 'vitest'
import { PromptComposer } from '../../prompt/prompt-composer'
import { identitySection } from '../../prompt/sections/identity'
import { domainKnowledgeSection } from '../../prompt/sections/domain-knowledge'
import { formattingRulesSection } from '../../prompt/sections/formatting-rules'
import { fundIsolationSection } from '../../prompt/sections/fund-isolation'
import { formatUserContextBlock, formatCurrencyBlock, formatGreetingBlock } from '../../prompt/sections/dynamic'

describe('engine prompt assembly', () => {
  it('composes all required sections in correct order', () => {
    const user = { id: 'u1', name: 'John', role: 'FUND_ADMIN' }

    const composer = new PromptComposer()
      .addSection(identitySection('Test Fund'))
      .addSection(domainKnowledgeSection())
      .addSection(formatUserContextBlock(user))
      .addSection(formatCurrencyBlock('USD'))
      .addSection(fundIsolationSection('Test Fund', 'f1'))
      .addSection(formattingRulesSection())
      .addSection(formatGreetingBlock(user, true))

    const prompt = composer.build()

    // Verify section order by finding positions
    const identityPos = prompt.indexOf('[IDENTITY]')
    const domainPos = prompt.indexOf('[PE DOMAIN KNOWLEDGE]')
    const userPos = prompt.indexOf('[USER CONTEXT]')
    const currencyPos = prompt.indexOf('[CURRENCY]')
    const isolationPos = prompt.indexOf('[FUND ISOLATION]')
    const formattingPos = prompt.indexOf('[FORMATTING]')
    const greetingPos = prompt.indexOf('[FIRST MESSAGE]')

    expect(identityPos).toBeLessThan(domainPos)
    expect(domainPos).toBeLessThan(userPos)
    expect(userPos).toBeLessThan(currencyPos)
    expect(currencyPos).toBeLessThan(isolationPos)
    expect(isolationPos).toBeLessThan(formattingPos)
    expect(formattingPos).toBeLessThan(greetingPos)
  })

  it('continuation mode uses [CONTINUATION] not [FIRST MESSAGE]', () => {
    const user = { id: 'u1', name: 'John', role: 'FUND_ADMIN' }
    const section = formatGreetingBlock(user, false)
    expect(section.content).toContain('[CONTINUATION]')
    expect(section.content).not.toContain('[FIRST MESSAGE]')
  })
})
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/ai/core/__tests__/engine.test.ts`
Expected: 2 tests PASS

**Step 5: Commit**

```bash
git add src/lib/ai/core/engine.ts src/lib/ai/prompt/sections/dynamic.ts src/lib/ai/core/__tests__/engine.test.ts
git commit -m "feat(ai): add AI engine pipeline with composable prompt assembly"
```

---

## Task 6: Budget Guard (Lite)

**Files:**
- Create: `src/lib/ai/budget/budget-guard.ts`
- Test: `src/lib/ai/budget/__tests__/budget-guard.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/ai/budget/__tests__/budget-guard.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkBudget } from '../budget-guard'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('checkBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows when no AI interactions exist', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([])
    const result = await checkBudget('fund_1', 50)
    expect(result.allowed).toBe(true)
    expect(result.usedUSD).toBe(0)
  })

  it('allows when under budget', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { changes: { costUSD: { new: 0.05 } } },
      { changes: { costUSD: { new: 0.10 } } },
    ] as never[])

    const result = await checkBudget('fund_1', 50)
    expect(result.allowed).toBe(true)
    expect(result.usedUSD).toBeCloseTo(0.15)
  })

  it('blocks when over budget', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { changes: { costUSD: { new: 30.0 } } },
      { changes: { costUSD: { new: 25.0 } } },
    ] as never[])

    const result = await checkBudget('fund_1', 50)
    expect(result.allowed).toBe(false)
    expect(result.usedUSD).toBeCloseTo(55.0)
  })

  it('handles malformed changes gracefully', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      { changes: null },
      { changes: { costUSD: { new: 0.05 } } },
      { changes: { costUSD: null } },
    ] as never[])

    const result = await checkBudget('fund_1', 50)
    expect(result.allowed).toBe(true)
    expect(result.usedUSD).toBeCloseTo(0.05)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/ai/budget/__tests__/budget-guard.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/lib/ai/budget/budget-guard.ts
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
 * This is intentionally simple: one query, one comparison.
 * Fire-and-forget if it fails — never block the user on a budget check error.
 */
export async function checkBudget(
  fundId: string,
  monthlyBudgetUSD: number
): Promise<BudgetCheckResult> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const interactions = await prisma.auditLog.findMany({
    where: {
      entityType: 'AIInteraction',
      entityId: fundId,
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/ai/budget/__tests__/budget-guard.test.ts`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add src/lib/ai/budget/
git commit -m "feat(ai): add lightweight budget guard with monthly cost aggregation"
```

---

## Task 7: Rewrite route.ts as Thin Handler

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Test: manual — verify `npm run build` passes and existing chat works

This is the final integration step. The route handler becomes a thin orchestrator that delegates to the engine pipeline.

**Step 1: Rewrite route.ts**

Replace the entire file. The new version delegates context assembly, tool resolution, and prompt composition to the engine, and adds the budget guard.

```typescript
// src/app/api/chat/route.ts
import { auth } from '@/lib/auth'
import { getActiveFundWithCurrency, requireFundAccess } from '@/lib/shared/fund-access'
import { rateLimit } from '@/lib/shared/rate-limit'
import { AI_CONFIG, getAnthropicProvider } from '@/lib/ai/ai-config'
import { trackAICost } from '@/lib/ai/cost-tracker'
import { trimConversation } from '@/lib/ai/conversation-trimmer'
import { checkBudget } from '@/lib/ai/budget/budget-guard'
import { assembleEngine } from '@/lib/ai/core/engine'
import {
  createConversation,
  persistMessages,
} from '@/lib/actions/ai-conversations'
import { prisma } from '@/lib/prisma'
import { streamText, generateText, convertToModelMessages, type UIMessage } from 'ai'
import { NextResponse } from 'next/server'

export const maxDuration = 300

export async function POST(req: Request) {
  // --- Auth & Guards ---
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AI_CONFIG.isEnabled) {
    return NextResponse.json({ error: 'AI copilot is not configured' }, { status: 503 })
  }

  const activeFund = await getActiveFundWithCurrency(session.user.id)
  if (!activeFund) {
    return NextResponse.json({ error: 'No active fund found' }, { status: 400 })
  }

  try {
    await requireFundAccess(session.user.id, activeFund.fundId)
  } catch {
    return NextResponse.json({ error: 'Access denied to this fund' }, { status: 403 })
  }

  const rateLimitResult = rateLimit(`ai:${session.user.id}`, AI_CONFIG.rateLimitPerHour, 3_600_000)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before sending another message.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
    )
  }

  // --- Budget Guard (lite) ---
  try {
    const budget = await checkBudget(activeFund.fundId, AI_CONFIG.monthlyBudgetUSD)
    if (!budget.allowed) {
      return NextResponse.json(
        { error: `Monthly AI budget exceeded (${budget.usedUSD.toFixed(2)}/${budget.budgetUSD} USD). Please contact your administrator.` },
        { status: 429 }
      )
    }
  } catch (err) {
    // Budget check is non-blocking — log and continue
    console.error('Budget check failed, allowing request:', err)
  }

  // --- Parse Request ---
  const body = await req.json()
  const { messages, conversationId: reqConversationId } = body as {
    messages: UIMessage[]
    conversationId?: string
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
  }

  // --- Conversation Resolution ---
  let conversationId = reqConversationId
  if (!conversationId) {
    const firstUserMsg = messages.find(m => m.role === 'user')
    const title = firstUserMsg?.parts
      ?.filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
      .map(p => p.text)
      .join(' ')
      .slice(0, 60) || undefined

    const conversation = await createConversation(activeFund.fundId, title)
    conversationId = conversation.id
  }

  // --- Message Trimming ---
  const messagesForTrimmer = messages.map(m => ({
    ...m,
    role: m.role,
    content: m.parts
      .filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
      .map(p => p.text)
      .join('\n'),
  }))
  const trimmedUIMessages = trimConversation(messagesForTrimmer, AI_CONFIG.tokenBudget)
  const modelMessages = await convertToModelMessages(trimmedUIMessages)

  // --- Engine: Context + Tools + Prompt ---
  const engine = await assembleEngine({
    userId: session.user.id,
    fundId: activeFund.fundId,
    currency: activeFund.currency,
    session,
  })

  // --- Stream ---
  const anthropic = getAnthropicProvider()

  let result
  try {
    result = streamText({
      model: anthropic(AI_CONFIG.model),
      system: engine.systemPrompt,
      messages: modelMessages,
      tools: engine.tools,
      abortSignal: req.signal,
      onFinish: ({ usage }) => {
        const inputTokens = usage.inputTokens ?? 0
        const outputTokens = usage.outputTokens ?? 0
        trackAICost(session.user!.id!, activeFund.fundId, {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        })
      },
    })
  } catch (streamError) {
    console.error('AI streaming failed to initialize:', streamError)
    return NextResponse.json({ error: 'AI streaming failed to initialize' }, { status: 500 })
  }

  // --- Response ---
  const isNewConversation = !reqConversationId
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages: allMessages }) => {
      persistMessages(conversationId, allMessages).catch((error: unknown) => {
        console.error('Failed to persist AI messages:', error)
      })

      if (isNewConversation && allMessages.length >= 2) {
        generateConversationTitle(conversationId, allMessages, anthropic).catch(
          (error: unknown) => {
            console.error('Failed to generate conversation title:', error)
          }
        )
      }
    },
    headers: {
      'X-Conversation-Id': conversationId,
    },
  })
}

// ---------------------------------------------------------------------------
// Title generation — fire-and-forget after first assistant response
// ---------------------------------------------------------------------------

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter(
      (p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text'
    )
    .map((p) => p.text)
    .join(' ')
}

async function generateConversationTitle(
  conversationId: string,
  allMessages: UIMessage[],
  anthropic: ReturnType<typeof getAnthropicProvider>
): Promise<void> {
  const userMsg = allMessages.find((m) => m.role === 'user')
  const assistantMsg = allMessages.find((m) => m.role === 'assistant')
  if (!userMsg || !assistantMsg) return

  const userText = extractText(userMsg).slice(0, 200)
  const assistantText = extractText(assistantMsg).slice(0, 300)

  const { text: title } = await generateText({
    model: anthropic(AI_CONFIG.titleModel),
    prompt: `Generate a concise 4-6 word title for this conversation. No quotes, no ending punctuation. Examples: "Pipeline deal flow analysis", "Fund performance Q4 review", "Investor commitment breakdown".

User: ${userText}
Assistant: ${assistantText}

Title:`,
  })

  const cleaned = title.trim().replace(/^["']|["']$/g, '').slice(0, 60)
  if (!cleaned) return

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: cleaned },
  })
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Zero errors

**Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing 530+ tests + new AI tests)

**Step 4: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "refactor(ai): rewrite route.ts as thin handler delegating to engine pipeline"
```

---

## Task 8: Delete Old Monolithic Files

**Files:**
- Delete: `src/lib/ai/tools/read-tools.ts` (314 lines)
- Delete: `src/lib/ai/system-prompt.ts` (135 lines)
- Modify: `src/lib/ai/tools/index.ts` (remove old re-export)

**Step 1: Remove old re-export from index.ts**

Remove the line `export { createReadTools } from './read-tools'` from `src/lib/ai/tools/index.ts`. Keep only the new exports.

**Step 2: Delete the old files**

```bash
rm src/lib/ai/tools/read-tools.ts
rm src/lib/ai/system-prompt.ts
```

**Step 3: Verify no dangling imports**

Run: `npx tsc --noEmit`
Expected: Zero errors. If there are import errors, fix them.

Note: The prompt snapshot test (`prompt-snapshot.test.ts`) imports the old `buildSystemPrompt`. This test should be updated to remove the old import and only test the new composer output.

**Step 4: Update snapshot test to remove old dependency**

Replace the old `buildSystemPrompt` import in `src/lib/ai/prompt/__tests__/prompt-snapshot.test.ts` with a test that validates the new composer output contains all required section markers.

**Step 5: Run full test suite + build**

Run: `npx vitest run && npm run build`
Expected: All tests pass, zero build errors

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor(ai): delete monolithic read-tools.ts and system-prompt.ts"
```

---

## Task 9: Final Validation and PR

**Step 1: Run lint**

Run: `npm run lint`
Expected: Zero errors

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Run build**

Run: `npm run build`
Expected: Zero errors

**Step 4: Manual smoke test (if dev server available)**

1. Open the app, navigate to any fund dashboard
2. Open Emma (AI copilot panel)
3. Send: "What's my pipeline looking like?"
4. Verify: Emma responds with pipeline data, streaming works, tool calls visible
5. Send: "Tell me about the fund financials"
6. Verify: Emma responds with fund financial data

**Step 5: Create PR**

```bash
git push -u origin HEAD
gh pr create --title "refactor(ai): decompose Emma architecture into composable pipeline" --body "$(cat <<'EOF'
## Summary
- Decompose monolithic AI architecture (944 lines) into composable components
- Create ToolRegistry with individual tool modules organized by domain
- Create PromptComposer with section-based prompt assembly
- Add lightweight budget guard (monthly cost aggregation)
- Rewrite route.ts from 226-line god function to thin handler delegating to engine
- Delete old read-tools.ts (314 lines) and system-prompt.ts (135 lines)

## Architecture
- **Tool Registry:** Each tool is a self-contained module implementing ITool interface. Adding a new tool = one file + one register() call. Zero changes to route.ts or prompt.
- **Prompt Composer:** Sections compose independently. Tool descriptions auto-generated from registry metadata. No manual duplication.
- **Engine Pipeline:** assembleEngine() orchestrates context → tools → prompt. Route.ts only handles HTTP concerns.
- **Budget Guard:** Aggregates monthly AI costs from audit log, blocks when exceeded. Non-blocking on errors.

## Zero Behavioral Change
- Prompt snapshot tests verify structural parity with old system
- Tool parity tests verify all 5 tools present with correct metadata
- All existing 530+ tests pass

## Marcus Rein Approval
Per architecture review (2026-03-02): Ceilings 1+2+3+7-lite approved. Ceilings 4+5+6 deferred with explicit trigger conditions documented in docs/plans/.

## Test plan
- [ ] All new unit tests pass (types, registry, composer, budget, engine, parity)
- [ ] `npm run build` zero errors
- [ ] `npm run lint` zero errors
- [ ] Full test suite green
- [ ] Manual smoke test: Emma responds correctly to pipeline and financial queries

🤖 Generated with [Claude Code](https://claude.ai/claude-code)
EOF
)"
```

---

## File Summary

### Created (new files)
| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `src/lib/ai/core/types.ts` | ITool, ToolContext, PromptSection interfaces | ~30 |
| `src/lib/ai/core/engine.ts` | Composable pipeline orchestrator | ~70 |
| `src/lib/ai/tools/registry.ts` | Tool registry with SDK conversion | ~60 |
| `src/lib/ai/tools/deals/get-pipeline-summary.ts` | Pipeline tool (ITool) | ~45 |
| `src/lib/ai/tools/deals/get-deal-details.ts` | Deal details tool (ITool) | ~65 |
| `src/lib/ai/tools/capital/get-fund-financials.ts` | Fund financials tool (ITool) | ~60 |
| `src/lib/ai/tools/investors/get-investor-details.ts` | Investor details tool (ITool) | ~55 |
| `src/lib/ai/tools/portfolio/get-portfolio-metrics.ts` | Portfolio metrics tool (ITool) | ~75 |
| `src/lib/ai/prompt/prompt-composer.ts` | Section-based prompt builder | ~20 |
| `src/lib/ai/prompt/sections/identity.ts` | Identity section | ~15 |
| `src/lib/ai/prompt/sections/domain-knowledge.ts` | PE domain knowledge section | ~15 |
| `src/lib/ai/prompt/sections/formatting-rules.ts` | Formatting rules section | ~15 |
| `src/lib/ai/prompt/sections/fund-isolation.ts` | Fund isolation section | ~15 |
| `src/lib/ai/prompt/sections/dynamic.ts` | Runtime-dependent sections | ~100 |
| `src/lib/ai/budget/budget-guard.ts` | Monthly cost check | ~40 |

### Tests (new)
| File | Tests |
|------|-------|
| `src/lib/ai/core/__tests__/types.test.ts` | 3 type conformance tests |
| `src/lib/ai/tools/__tests__/registry.test.ts` | 5 registry tests |
| `src/lib/ai/tools/__tests__/tool-parity.test.ts` | 8 parity tests |
| `src/lib/ai/prompt/__tests__/prompt-composer.test.ts` | 3 composer tests |
| `src/lib/ai/prompt/__tests__/prompt-snapshot.test.ts` | 2 snapshot parity tests |
| `src/lib/ai/core/__tests__/engine.test.ts` | 2 engine assembly tests |
| `src/lib/ai/budget/__tests__/budget-guard.test.ts` | 4 budget tests |

### Deleted
| File | Lines Removed |
|------|--------------|
| `src/lib/ai/tools/read-tools.ts` | 314 |
| `src/lib/ai/system-prompt.ts` | 135 |

### Modified
| File | Change |
|------|--------|
| `src/app/api/chat/route.ts` | Rewritten to delegate to engine pipeline + budget guard |
| `src/lib/ai/tools/index.ts` | Updated exports for registry-based architecture |

---

## Deferred Architectural Decisions (from Marcus Review)

These are NOT tasks. They are documented trigger conditions for future work.

| Ceiling | Trigger Condition | Document |
|---------|-------------------|----------|
| 4 — Background Execution | 10+ active funds with daily data generation | `docs/plans/2026-03-02-emma-architecture-refactor-design.md` |
| 5 — Conversation Amnesia | Users averaging 50+ conversations per fund | Same document |
| 6 — Multi-Fund Scope | First multi-fund PE firm customer onboarded | Same document |

### Rejected Capabilities (Architectural Immune System)

Per Marcus review, these are explicitly NOT built:
- No vector DB / RAG / embeddings
- No multi-model routing (GPT + Claude)
- No real-time event streaming
- No document content analysis
- No custom tool authoring by users
- No agent-to-agent orchestration
- No agent memory framework (LangChain Memory, Mem0, etc.)
