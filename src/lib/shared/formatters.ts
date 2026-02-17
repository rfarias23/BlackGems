import type { Decimal } from '@prisma/client/runtime/library'

/**
 * Shared formatters for currency, percentages, and multiples.
 * Used across all server actions and components.
 *
 * Accepts Prisma Decimal, number, string, null, or undefined.
 */

type NumericValue = Decimal | number | string | null | undefined

/**
 * Supported fund currencies. Each fund operates in exactly one currency.
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP'

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
}

/**
 * Formats a numeric value as a currency string.
 * Returns null if value is falsy.
 */
export function formatCurrency(value: NumericValue, currency: CurrencyCode = 'USD'): string | null {
  if (!value) return null
  const { symbol, locale } = CURRENCY_CONFIG[currency]
  return `${symbol}${Number(value).toLocaleString(locale)}`
}

/**
 * Formats a numeric value as a currency string, defaulting to symbol + '0'.
 */
export function formatMoney(value: NumericValue, currency: CurrencyCode = 'USD'): string {
  if (!value) return `${CURRENCY_CONFIG[currency].symbol}0`
  const { symbol, locale } = CURRENCY_CONFIG[currency]
  return `${symbol}${Number(value).toLocaleString(locale)}`
}

/**
 * Formats a numeric value with M/K abbreviations for chart axes and compact displays.
 */
export function formatCompact(value: NumericValue, currency: CurrencyCode = 'USD'): string {
  const { symbol } = CURRENCY_CONFIG[currency]
  const num = Number(value) || 0
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(0)}K`
  return `${sign}${symbol}${abs.toFixed(0)}`
}

/**
 * Returns the raw numeric string representation of a Decimal.
 */
export function formatDecimalRaw(value: NumericValue): string | null {
  if (!value) return null
  return Number(value).toString()
}

/**
 * Formats a decimal ratio (0.351) as a percentage string ("35.1%").
 * Returns null if value is falsy.
 */
export function formatPercentage(value: NumericValue): string | null {
  if (!value) return null
  return `${(Number(value) * 100).toFixed(1)}%`
}

/**
 * Formats a decimal ratio as a percentage, defaulting to '0%'.
 */
export function formatPercent(value: NumericValue): string {
  if (!value) return '0%'
  return `${(Number(value) * 100).toFixed(1)}%`
}

/**
 * Formats a numeric value as a multiple (e.g., "2.50x").
 */
export function formatMultiple(value: NumericValue): string {
  if (!value) return '-'
  return `${Number(value).toFixed(2)}x`
}

/**
 * Parses a currency string ("$1,234,567" or "€1.234.567" or "£1,234,567") into a number.
 * Handles both dot-decimal (USD/GBP) and comma-decimal (EUR) formats.
 */
export function parseMoney(value: string): number {
  if (!value) return 0
  // Strip currency symbols and whitespace
  let cleaned = value.replace(/[$€£\s]/g, '')
  const dotCount = (cleaned.match(/\./g) || []).length
  const commaCount = (cleaned.match(/,/g) || []).length
  if (dotCount > 1) {
    // Multiple dots = EUR thousands separators (e.g., "1.234.567") — strip all dots
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (commaCount > 1) {
    // Multiple commas = USD/GBP thousands separators (e.g., "1,234,567") — strip all commas
    cleaned = cleaned.replace(/,/g, '')
  } else if (dotCount === 1 && commaCount === 1) {
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastDot > lastComma) {
      // Format: "1,234.89" — comma is thousands, dot is decimal
      cleaned = cleaned.replace(/,/g, '')
    } else {
      // Format: "1.234,89" — dot is thousands, comma is decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    }
  } else if (commaCount === 1 && dotCount === 0) {
    // Ambiguous single comma: "1,234" — treat as thousands separator.
    // Note: EUR decimal amounts like "2500,00" will be parsed as 250000.
    // This is acceptable because BlackGem UI always formats without decimals
    // in form fields. If EUR decimal input is needed, parseMoney should
    // accept a CurrencyCode parameter in the future.
    cleaned = cleaned.replace(/,/g, '')
  }
  // Single dot with no comma: parseFloat handles it naturally as decimal
  return parseFloat(cleaned) || 0
}

/**
 * Parses a percentage string ("85%" or "0.85") into a decimal.
 * Values > 1 are treated as whole-number percentages (e.g., 85 -> 0.85).
 */
export function parsePercent(value: string): number {
  if (!value) return 0
  const num = parseFloat(value.replace(/%/g, ''))
  return num > 1 ? num / 100 : num
}
