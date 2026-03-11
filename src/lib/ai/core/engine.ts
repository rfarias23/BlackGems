import { assembleFundContext, type FundContext } from '../context/fund-context'
import { assembleUserContext, type UserContext } from '../context/user-context'
import { PromptComposer } from '../prompt/prompt-composer'
import { identitySection } from '../prompt/sections/identity'
import { domainKnowledgeSection } from '../prompt/sections/domain-knowledge'
import { formattingRulesSection } from '../prompt/sections/formatting-rules'
import { fundIsolationSection } from '../prompt/sections/fund-isolation'
import {
  formatUserContextBlock,
  formatFundContextBlock,
  formatCurrencyBlock,
  formatToolsBlock,
  formatGreetingBlock,
} from '../prompt/sections/dynamic'
import { createDefaultRegistry } from '../tools/create-default-registry'
import { writeCapabilitiesSection } from '../prompt/sections/write-capabilities'
import { financialGuardrailsSection } from '../prompt/sections/financial-guardrails'
import type { ToolContext } from './types'
import type { CurrencyCode } from '@/lib/shared/formatters'
import { getConversations } from '@/lib/actions/ai-conversations'
import type { ToolSet } from 'ai'

// Singleton registry — tool objects are statically defined (metadata + Zod schemas
// don't change between requests). Per-request ToolContext is bound in toSDKTools().
// Marcus Correction 3: avoids recreating 5+ tool objects per request.
const defaultRegistry = createDefaultRegistry()

export interface EngineInput {
  userId: string
  fundId: string
  currency: CurrencyCode
  conversationId: string
  session: { user?: { id?: string; name?: string | null; role?: string } }
}

export interface EngineOutput {
  systemPrompt: string
  tools: ToolSet
  toolContext: ToolContext
  fundContext: FundContext
  userContext: UserContext
  isFirstTime: boolean
}

export async function assembleEngine(input: EngineInput): Promise<EngineOutput> {
  const { userId, fundId, currency, conversationId, session } = input

  // 1. Assemble context (parallel)
  const [fundContext, conversations] = await Promise.all([
    assembleFundContext(fundId),
    getConversations(fundId),
  ])
  const userContext = assembleUserContext(session)
  const isFirstTime = conversations.length <= 1

  // 2. Resolve tools — bind per-request context to singleton registry
  const toolContext: ToolContext = { fundId, currency, userId, conversationId }
  const tools = defaultRegistry.toSDKTools(toolContext)

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
    .addSection(formatToolsBlock(defaultRegistry))
    .addSection(writeCapabilitiesSection())
    .addSection(financialGuardrailsSection())
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
