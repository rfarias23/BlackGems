import { describe, it, expect } from 'vitest'
import { resolveStageAlias } from '../lib/ai/tools/shared/stage-aliases'

describe('resolveStageAlias', () => {
  // Exact enum values
  it('accepts exact DealStage enum values', () => {
    expect(resolveStageAlias('IOI_SUBMITTED')).toBe('IOI_SUBMITTED')
    expect(resolveStageAlias('CLOSED_WON')).toBe('CLOSED_WON')
  })

  // Natural language aliases
  it('resolves "dead" to CLOSED_LOST', () => {
    expect(resolveStageAlias('dead')).toBe('CLOSED_LOST')
  })
  it('resolves "not interested" to CLOSED_LOST', () => {
    expect(resolveStageAlias('not interested')).toBe('CLOSED_LOST')
  })
  it('resolves "passed" to PASSED', () => {
    expect(resolveStageAlias('passed')).toBe('PASSED')
  })
  it('resolves "under LOI" to LOI_NEGOTIATION', () => {
    expect(resolveStageAlias('under LOI')).toBe('LOI_NEGOTIATION')
  })
  it('resolves "LOI signed" to LOI_NEGOTIATION', () => {
    expect(resolveStageAlias('LOI signed')).toBe('LOI_NEGOTIATION')
  })
  it('resolves "IOI" to IOI_SUBMITTED', () => {
    expect(resolveStageAlias('IOI')).toBe('IOI_SUBMITTED')
  })
  it('resolves "management meeting" to MANAGEMENT_MEETING', () => {
    expect(resolveStageAlias('management meeting')).toBe('MANAGEMENT_MEETING')
  })
  it('resolves "due diligence" to DUE_DILIGENCE', () => {
    expect(resolveStageAlias('due diligence')).toBe('DUE_DILIGENCE')
  })
  it('resolves "in DD" to DUE_DILIGENCE', () => {
    expect(resolveStageAlias('in DD')).toBe('DUE_DILIGENCE')
  })
  it('resolves "closed" to CLOSED_WON', () => {
    expect(resolveStageAlias('closed')).toBe('CLOSED_WON')
  })
  it('resolves "acquired" to CLOSED_WON', () => {
    expect(resolveStageAlias('acquired')).toBe('CLOSED_WON')
  })
  it('resolves "initial contact" to INITIAL_REVIEW', () => {
    expect(resolveStageAlias('initial contact')).toBe('INITIAL_REVIEW')
  })
  it('resolves "NDA signed" to NDA_SIGNED', () => {
    expect(resolveStageAlias('NDA signed')).toBe('NDA_SIGNED')
  })
  it('resolves "on hold" to ON_HOLD', () => {
    expect(resolveStageAlias('on hold')).toBe('ON_HOLD')
  })

  // Case insensitive
  it('is case insensitive', () => {
    expect(resolveStageAlias('DEAD')).toBe('CLOSED_LOST')
    expect(resolveStageAlias('Under LOI')).toBe('LOI_NEGOTIATION')
  })

  // Unknown returns null
  it('returns null for unknown aliases', () => {
    expect(resolveStageAlias('banana')).toBeNull()
  })
})
