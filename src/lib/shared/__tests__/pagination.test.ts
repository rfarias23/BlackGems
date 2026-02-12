import { describe, it, expect } from 'vitest'
import {
    parsePaginationParams,
    paginatedResult,
    DEFAULT_PAGE_SIZE,
} from '../pagination'

// ===========================================================================
// parsePaginationParams
// ===========================================================================

describe('parsePaginationParams', () => {
    describe('defaults', () => {
        it('returns page 1, default page size, skip 0 when no params', () => {
            const result = parsePaginationParams()
            expect(result).toEqual({
                page: 1,
                pageSize: DEFAULT_PAGE_SIZE,
                skip: 0,
                search: undefined,
            })
        })

        it('returns same defaults for empty object', () => {
            const result = parsePaginationParams({})
            expect(result).toEqual({
                page: 1,
                pageSize: DEFAULT_PAGE_SIZE,
                skip: 0,
                search: undefined,
            })
        })
    })

    describe('page clamping', () => {
        it('clamps page to minimum 1 when 0 is passed', () => {
            const result = parsePaginationParams({ page: 0 })
            expect(result.page).toBe(1)
        })

        it('clamps page to minimum 1 when negative is passed', () => {
            const result = parsePaginationParams({ page: -5 })
            expect(result.page).toBe(1)
        })

        it('accepts valid page number', () => {
            const result = parsePaginationParams({ page: 3 })
            expect(result.page).toBe(3)
        })
    })

    describe('pageSize clamping', () => {
        it('clamps pageSize to minimum 1', () => {
            const result = parsePaginationParams({ pageSize: 0 })
            expect(result.pageSize).toBe(1)
        })

        it('clamps pageSize to minimum 1 when negative', () => {
            const result = parsePaginationParams({ pageSize: -10 })
            expect(result.pageSize).toBe(1)
        })

        it('clamps pageSize to maximum 100', () => {
            const result = parsePaginationParams({ pageSize: 500 })
            expect(result.pageSize).toBe(100)
        })

        it('accepts valid pageSize', () => {
            const result = parsePaginationParams({ pageSize: 50 })
            expect(result.pageSize).toBe(50)
        })
    })

    describe('skip calculation', () => {
        it('calculates skip = 0 for page 1', () => {
            const result = parsePaginationParams({ page: 1, pageSize: 25 })
            expect(result.skip).toBe(0)
        })

        it('calculates skip correctly for page 2', () => {
            const result = parsePaginationParams({ page: 2, pageSize: 25 })
            expect(result.skip).toBe(25)
        })

        it('calculates skip correctly for page 5 with pageSize 10', () => {
            const result = parsePaginationParams({ page: 5, pageSize: 10 })
            expect(result.skip).toBe(40)
        })
    })

    describe('search handling', () => {
        it('trims whitespace from search', () => {
            const result = parsePaginationParams({ search: '  hello  ' })
            expect(result.search).toBe('hello')
        })

        it('returns undefined for empty search string', () => {
            const result = parsePaginationParams({ search: '' })
            expect(result.search).toBeUndefined()
        })

        it('returns undefined for whitespace-only search', () => {
            const result = parsePaginationParams({ search: '   ' })
            expect(result.search).toBeUndefined()
        })

        it('preserves valid search string', () => {
            const result = parsePaginationParams({ search: 'Acme Capital' })
            expect(result.search).toBe('Acme Capital')
        })
    })
})

// ===========================================================================
// paginatedResult
// ===========================================================================

describe('paginatedResult', () => {
    it('returns correct shape for a single page', () => {
        const items = ['a', 'b', 'c']
        const result = paginatedResult(items, 3, 1, 25)

        expect(result).toEqual({
            data: ['a', 'b', 'c'],
            total: 3,
            page: 1,
            pageSize: 25,
            totalPages: 1,
        })
    })

    it('calculates totalPages correctly when total is exactly divisible', () => {
        const result = paginatedResult([], 100, 1, 25)
        expect(result.totalPages).toBe(4)
    })

    it('rounds up totalPages for partial last page', () => {
        const result = paginatedResult([], 101, 1, 25)
        expect(result.totalPages).toBe(5)
    })

    it('returns 0 totalPages for 0 items', () => {
        const result = paginatedResult([], 0, 1, 25)
        expect(result.totalPages).toBe(0)
    })

    it('returns 1 totalPage when total equals pageSize', () => {
        const result = paginatedResult([], 25, 1, 25)
        expect(result.totalPages).toBe(1)
    })

    it('preserves all data items', () => {
        const items = [{ id: 1 }, { id: 2 }]
        const result = paginatedResult(items, 50, 3, 10)
        expect(result.data).toEqual(items)
        expect(result.page).toBe(3)
    })
})

// ===========================================================================
// DEFAULT_PAGE_SIZE constant
// ===========================================================================

describe('DEFAULT_PAGE_SIZE', () => {
    it('is 25', () => {
        expect(DEFAULT_PAGE_SIZE).toBe(25)
    })
})
