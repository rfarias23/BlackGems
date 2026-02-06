/**
 * Shared formatters for currency, percentages, and multiples.
 * Used across all server actions and components.
 */

/**
 * Formats a numeric value as a USD currency string.
 * Returns null if value is falsy.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatCurrency(value: any): string | null {
  if (!value) return null
  return `$${Number(value).toLocaleString()}`
}

/**
 * Formats a numeric value as a currency string, defaulting to '$0'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatMoney(value: any): string {
  if (!value) return '$0'
  return `$${Number(value).toLocaleString()}`
}

/**
 * Returns the raw numeric string representation of a Decimal.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatDecimalRaw(value: any): string | null {
  if (!value) return null
  return Number(value).toString()
}

/**
 * Formats a decimal ratio (0.351) as a percentage string ("35.1%").
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatPercentage(value: any): string | null {
  if (!value) return null
  return `${(Number(value) * 100).toFixed(1)}%`
}

/**
 * Formats a decimal ratio as a percentage, defaulting to '0%'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatPercent(value: any): string {
  if (!value) return '0%'
  return `${(Number(value) * 100).toFixed(1)}%`
}

/**
 * Formats a numeric value as a multiple (e.g., "2.50x").
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatMultiple(value: any): string {
  if (!value) return '-'
  return `${Number(value).toFixed(2)}x`
}

/**
 * Parses a currency string ("$1,234,567") into a number.
 */
export function parseMoney(value: string): number {
  if (!value) return 0
  return parseFloat(value.replace(/[$,]/g, '')) || 0
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
