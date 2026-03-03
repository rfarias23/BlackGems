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
