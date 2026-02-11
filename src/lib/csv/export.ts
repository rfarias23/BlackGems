/**
 * CSV Export Utility
 *
 * Pure client-side CSV generation — no external libraries.
 * BOM prefix for Excel compatibility, proper escaping.
 *
 * Usage:
 *   exportToCSV('fund-report', columns, data)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CSVColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => string | number | null)
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Generates a CSV string from columns and data.
 * Includes BOM for Excel compatibility.
 */
export function generateCSV<T>(
  columns: CSVColumn<T>[],
  data: T[]
): string {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel
  const headers = columns.map((c) => escapeCSV(c.header)).join(',')

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value =
          typeof col.accessor === 'function'
            ? col.accessor(row)
            : row[col.accessor]
        return escapeCSV(String(value ?? ''))
      })
      .join(',')
  )

  return BOM + [headers, ...rows].join('\r\n')
}

/**
 * Triggers a browser download of the CSV content.
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * One-step: generate and download CSV.
 */
export function exportToCSV<T>(
  filename: string,
  columns: CSVColumn<T>[],
  data: T[]
): void {
  const csv = generateCSV(columns, data)
  downloadCSV(filename, csv)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escapes a value for CSV: wraps in quotes if it contains commas,
 * quotes, or newlines; doubles any internal quotes.
 */
function escapeCSV(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
