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
  conversationId: string
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
