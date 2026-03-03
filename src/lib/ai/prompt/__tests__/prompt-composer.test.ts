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
