import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatMoney,
  formatCompact,
  parseMoney,
} from '@/lib/shared/formatters'

describe('formatCurrency', () => {
  it('returns null for falsy values', () => {
    expect(formatCurrency(null)).toBeNull()
    expect(formatCurrency(undefined)).toBeNull()
    expect(formatCurrency(0)).toBeNull()
  })

  it('formats USD by default', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })

  it('formats EUR with euro symbol', () => {
    expect(formatCurrency(1234567, 'EUR')).toBe('€1.234.567')
  })

  it('formats GBP with pound symbol', () => {
    expect(formatCurrency(1234567, 'GBP')).toBe('£1,234,567')
  })

  it('handles string input', () => {
    expect(formatCurrency('50000', 'EUR')).toBe('€50.000')
  })
})

describe('formatMoney', () => {
  it('returns currency zero for falsy values', () => {
    expect(formatMoney(null)).toBe('$0')
    expect(formatMoney(null, 'EUR')).toBe('€0')
    expect(formatMoney(null, 'GBP')).toBe('£0')
  })

  it('formats with correct currency symbol', () => {
    expect(formatMoney(1000)).toBe('$1,000')
    expect(formatMoney(1000, 'EUR')).toBe('€1.000')
    expect(formatMoney(1000, 'GBP')).toBe('£1,000')
  })
})

describe('formatCompact', () => {
  it('abbreviates millions', () => {
    expect(formatCompact(5000000)).toBe('$5.0M')
    expect(formatCompact(5000000, 'EUR')).toBe('€5.0M')
    expect(formatCompact(5000000, 'GBP')).toBe('£5.0M')
  })

  it('abbreviates thousands', () => {
    expect(formatCompact(250000)).toBe('$250K')
    expect(formatCompact(250000, 'EUR')).toBe('€250K')
  })

  it('formats small numbers without abbreviation', () => {
    expect(formatCompact(500)).toBe('$500')
    expect(formatCompact(500, 'GBP')).toBe('£500')
  })

  it('handles zero and null', () => {
    expect(formatCompact(0)).toBe('$0')
    expect(formatCompact(null, 'EUR')).toBe('€0')
  })
})

describe('parseMoney', () => {
  it('parses USD strings', () => {
    expect(parseMoney('$1,234,567')).toBe(1234567)
  })

  it('parses EUR strings', () => {
    expect(parseMoney('€1.234.567')).toBe(1234567)
  })

  it('parses GBP strings', () => {
    expect(parseMoney('£1,234,567')).toBe(1234567)
  })

  it('handles empty string', () => {
    expect(parseMoney('')).toBe(0)
  })

  it('handles plain numbers', () => {
    expect(parseMoney('50000')).toBe(50000)
  })
})
