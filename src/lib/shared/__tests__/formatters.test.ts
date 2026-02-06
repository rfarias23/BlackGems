import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatMoney,
  formatDecimalRaw,
  formatPercentage,
  formatPercent,
  formatMultiple,
  parseMoney,
  parsePercent,
} from '../formatters'

describe('formatCurrency', () => {
  it('formats a number as USD', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })

  it('returns null for falsy values', () => {
    expect(formatCurrency(null)).toBeNull()
    expect(formatCurrency(undefined)).toBeNull()
    expect(formatCurrency(0)).toBeNull()
  })

  it('handles Decimal-like objects with toString', () => {
    expect(formatCurrency('1500000')).toBe('$1,500,000')
  })
})

describe('formatMoney', () => {
  it('formats a number as USD', () => {
    expect(formatMoney(1234567)).toBe('$1,234,567')
  })

  it('returns $0 for falsy values', () => {
    expect(formatMoney(null)).toBe('$0')
    expect(formatMoney(undefined)).toBe('$0')
    expect(formatMoney(0)).toBe('$0')
  })
})

describe('formatDecimalRaw', () => {
  it('returns string representation', () => {
    expect(formatDecimalRaw(1234.56)).toBe('1234.56')
  })

  it('returns null for falsy values', () => {
    expect(formatDecimalRaw(null)).toBeNull()
  })
})

describe('formatPercentage', () => {
  it('formats a decimal as percentage', () => {
    expect(formatPercentage(0.351)).toBe('35.1%')
  })

  it('returns null for falsy values', () => {
    expect(formatPercentage(null)).toBeNull()
    expect(formatPercentage(0)).toBeNull()
  })

  it('handles string values from Prisma Decimal', () => {
    expect(formatPercentage('0.25')).toBe('25.0%')
  })
})

describe('formatPercent', () => {
  it('formats a decimal as percentage', () => {
    expect(formatPercent(0.85)).toBe('85.0%')
  })

  it('returns 0% for falsy values', () => {
    expect(formatPercent(null)).toBe('0%')
    expect(formatPercent(0)).toBe('0%')
  })
})

describe('formatMultiple', () => {
  it('formats as a multiple with x suffix', () => {
    expect(formatMultiple(2.5)).toBe('2.50x')
  })

  it('returns dash for falsy values', () => {
    expect(formatMultiple(null)).toBe('-')
    expect(formatMultiple(0)).toBe('-')
  })
})

describe('parseMoney', () => {
  it('parses a clean number string', () => {
    expect(parseMoney('1234567')).toBe(1234567)
  })

  it('strips $ and commas', () => {
    expect(parseMoney('$1,234,567')).toBe(1234567)
  })

  it('handles decimal amounts', () => {
    expect(parseMoney('$1,234,567.89')).toBe(1234567.89)
  })

  it('returns 0 for empty string', () => {
    expect(parseMoney('')).toBe(0)
  })

  it('returns 0 for non-numeric', () => {
    expect(parseMoney('abc')).toBe(0)
  })
})

describe('parsePercent', () => {
  it('converts whole number percentage to decimal', () => {
    expect(parsePercent('85')).toBe(0.85)
  })

  it('strips % sign', () => {
    expect(parsePercent('85%')).toBe(0.85)
  })

  it('passes through values <= 1 as-is', () => {
    expect(parsePercent('0.85')).toBe(0.85)
  })

  it('returns 0 for empty string', () => {
    expect(parsePercent('')).toBe(0)
  })
})
