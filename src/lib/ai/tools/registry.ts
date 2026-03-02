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
        parameters: t.inputSchema,
        execute: (input: unknown) => t.execute(input, ctx),
      })
    }

    return result
  }
}
