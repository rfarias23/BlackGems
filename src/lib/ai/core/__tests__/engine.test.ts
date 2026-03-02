import { describe, it, expect } from 'vitest'
import { PromptComposer } from '../../prompt/prompt-composer'
import { identitySection } from '../../prompt/sections/identity'
import { domainKnowledgeSection } from '../../prompt/sections/domain-knowledge'
import { formattingRulesSection } from '../../prompt/sections/formatting-rules'
import { fundIsolationSection } from '../../prompt/sections/fund-isolation'
import {
  formatUserContextBlock,
  formatCurrencyBlock,
  formatGreetingBlock,
} from '../../prompt/sections/dynamic'

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

    expect(identityPos).toBeGreaterThan(-1)
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

  it('first message mode includes user name in greeting', () => {
    const user = { id: 'u1', name: 'Marcus', role: 'FUND_ADMIN' }
    const section = formatGreetingBlock(user, true)
    expect(section.content).toContain('Marcus')
    expect(section.content).toContain('[FIRST MESSAGE]')
  })
})
