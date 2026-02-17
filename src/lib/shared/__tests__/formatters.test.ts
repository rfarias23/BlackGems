import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatMoney,
  formatCompact,
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

  it('formats EUR with euro symbol', () => {
    expect(formatCurrency(1234567, 'EUR')).toBe('€1.234.567')
  })

  it('formats GBP with pound symbol', () => {
    expect(formatCurrency(1234567, 'GBP')).toBe('£1,234,567')
  })

  it('handles string input with currency', () => {
    expect(formatCurrency('50000', 'EUR')).toBe('€50.000')
  })
})

describe('formatMoney', () => {
  it('formats a number as USD', () => {
    expect(formatMoney(1234567)).toBe('$1,234,567')
  })

  it('returns currency zero for falsy values', () => {
    expect(formatMoney(null)).toBe('$0')
    expect(formatMoney(undefined)).toBe('$0')
    expect(formatMoney(0)).toBe('$0')
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

  it('handles negative values', () => {
    expect(formatCompact(-2500000)).toBe('-$2.5M')
    expect(formatCompact(-500000, 'EUR')).toBe('-€500K')
    expect(formatCompact(-750, 'GBP')).toBe('-£750')
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

  it('handles plain numbers', () => {
    expect(parseMoney('50000')).toBe(50000)
  })

  it('strips $ and commas', () => {
    expect(parseMoney('$1,234,567')).toBe(1234567)
  })

  it('handles USD decimal amounts', () => {
    expect(parseMoney('$1,234,567.89')).toBe(1234567.89)
  })

  it('parses EUR strings', () => {
    expect(parseMoney('€1.234.567')).toBe(1234567)
  })

  it('parses GBP strings', () => {
    expect(parseMoney('£1,234,567')).toBe(1234567)
  })

  it('handles EUR with thousands and decimals', () => {
    expect(parseMoney('€1.234.567,89')).toBe(1234567.89)
  })

  it('handles mixed EUR format with single thousands group', () => {
    expect(parseMoney('1.234,89')).toBe(1234.89)
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
