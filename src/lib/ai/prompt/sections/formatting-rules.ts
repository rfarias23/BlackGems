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
