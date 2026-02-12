import { describe, it, expect } from 'vitest'
import { generateCSV, type CSVColumn } from '../export'

// ===========================================================================
// Types for test data
// ===========================================================================

interface TestRow {
    name: string
    amount: number
    status: string
}

const COLUMNS: CSVColumn<TestRow>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Status', accessor: 'status' },
]

// ===========================================================================
// generateCSV
// ===========================================================================

describe('generateCSV', () => {
    describe('basic output', () => {
        it('starts with UTF-8 BOM', () => {
            const csv = generateCSV(COLUMNS, [])
            expect(csv.charCodeAt(0)).toBe(0xFEFF)
        })

        it('produces headers-only for empty data', () => {
            const csv = generateCSV(COLUMNS, [])
            // BOM + headers
            expect(csv).toBe('\uFEFFName,Amount,Status')
        })

        it('produces headers and one data row', () => {
            const data: TestRow[] = [{ name: 'Acme Fund', amount: 5000000, status: 'ACTIVE' }]
            const csv = generateCSV(COLUMNS, data)
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            expect(lines).toHaveLength(2)
            expect(lines[0]).toBe('Name,Amount,Status')
            expect(lines[1]).toBe('Acme Fund,5000000,ACTIVE')
        })

        it('produces multiple data rows', () => {
            const data: TestRow[] = [
                { name: 'Fund A', amount: 100, status: 'ACTIVE' },
                { name: 'Fund B', amount: 200, status: 'CLOSED' },
                { name: 'Fund C', amount: 300, status: 'DRAFT' },
            ]
            const csv = generateCSV(COLUMNS, data)
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            expect(lines).toHaveLength(4) // 1 header + 3 data
        })
    })

    describe('accessor types', () => {
        it('supports function accessors', () => {
            interface FnRow { first: string; last: string }
            const cols: CSVColumn<FnRow>[] = [
                { header: 'Full Name', accessor: (r) => `${r.first} ${r.last}` },
            ]
            const data: FnRow[] = [{ first: 'John', last: 'Doe' }]
            const csv = generateCSV(cols, data)
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            expect(lines[1]).toBe('John Doe')
        })

        it('handles null return from function accessor', () => {
            interface NullRow { value: string | null }
            const cols: CSVColumn<NullRow>[] = [
                { header: 'Value', accessor: (r) => r.value },
            ]
            const data: NullRow[] = [{ value: null }]
            const csv = generateCSV(cols, data)
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            expect(lines[1]).toBe('')
        })
    })

    describe('CSV escaping (via internal escapeCSV)', () => {
        it('wraps values containing commas in quotes', () => {
            const data: TestRow[] = [{ name: 'Smith, John', amount: 100, status: 'OK' }]
            const csv = generateCSV(COLUMNS, data)
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            expect(lines[1]).toBe('"Smith, John",100,OK')
        })

        it('wraps values containing double quotes and doubles them', () => {
            const data: TestRow[] = [{ name: 'The "Best" Fund', amount: 100, status: 'OK' }]
            const csv = generateCSV(COLUMNS, data)
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            expect(lines[1]).toBe('"The ""Best"" Fund",100,OK')
        })

        it('wraps values containing newlines in quotes', () => {
            const data: TestRow[] = [{ name: 'Line1\nLine2', amount: 100, status: 'OK' }]
            const csv = generateCSV(COLUMNS, data)

            // The value should be wrapped in quotes
            expect(csv).toContain('"Line1\nLine2"')
        })

        it('wraps values containing carriage returns in quotes', () => {
            const data: TestRow[] = [{ name: 'Line1\rLine2', amount: 100, status: 'OK' }]
            const csv = generateCSV(COLUMNS, data)

            expect(csv).toContain('"Line1\rLine2"')
        })

        it('does not wrap simple values', () => {
            const data: TestRow[] = [{ name: 'AcmeFund', amount: 100, status: 'OK' }]
            const csv = generateCSV(COLUMNS, data)
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            // No quotes around simple values
            expect(lines[1]).toBe('AcmeFund,100,OK')
        })
    })

    describe('line endings', () => {
        it('uses CRLF line endings between rows', () => {
            const data: TestRow[] = [
                { name: 'A', amount: 1, status: 'X' },
                { name: 'B', amount: 2, status: 'Y' },
            ]
            const csv = generateCSV(COLUMNS, data)
            const withoutBOM = csv.replace('\uFEFF', '')

            // Split by CRLF should give header + 2 rows
            expect(withoutBOM.split('\r\n')).toHaveLength(3)
        })
    })

    describe('header escaping', () => {
        it('escapes headers that contain special characters', () => {
            interface HRow { v: string }
            const cols: CSVColumn<HRow>[] = [
                { header: 'Name, Full', accessor: 'v' },
            ]
            const csv = generateCSV(cols, [{ v: 'test' }])
            const lines = csv.replace('\uFEFF', '').split('\r\n')

            expect(lines[0]).toBe('"Name, Full"')
        })
    })
})
