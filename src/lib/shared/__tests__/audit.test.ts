import { describe, it, expect } from 'vitest'
import { computeChanges } from '../audit'

describe('computeChanges', () => {
    it('returns undefined when no fields changed', () => {
        const result = computeChanges(
            { name: 'Fund A', amount: 100 },
            { name: 'Fund A', amount: 100 }
        )
        expect(result).toBeUndefined()
    })

    it('detects a single field change', () => {
        const result = computeChanges(
            { name: 'Fund A', amount: 100 },
            { name: 'Fund B', amount: 100 }
        )
        expect(result).toEqual({
            name: { old: 'Fund A', new: 'Fund B' },
        })
    })

    it('detects multiple field changes', () => {
        const result = computeChanges(
            { name: 'Fund A', amount: 100, status: 'ACTIVE' },
            { name: 'Fund B', amount: 200, status: 'ACTIVE' }
        )
        expect(result).toEqual({
            name: { old: 'Fund A', new: 'Fund B' },
            amount: { old: 100, new: 200 },
        })
    })

    it('handles null to value change', () => {
        const result = computeChanges(
            { name: null },
            { name: 'Fund A' }
        )
        expect(result).toEqual({
            name: { old: null, new: 'Fund A' },
        })
    })

    it('handles value to null change', () => {
        const result = computeChanges(
            { name: 'Fund A' },
            { name: null }
        )
        expect(result).toEqual({
            name: { old: 'Fund A', new: null },
        })
    })

    it('handles undefined values', () => {
        const result = computeChanges(
            { name: undefined },
            { name: 'Fund A' }
        )
        expect(result).toEqual({
            name: { old: undefined, new: 'Fund A' },
        })
    })

    it('only includes changed fields from newData keys', () => {
        const result = computeChanges(
            { name: 'Fund A', extra: 'ignored' },
            { name: 'Fund B' }
        )
        expect(result).toEqual({
            name: { old: 'Fund A', new: 'Fund B' },
        })
        expect(result).not.toHaveProperty('extra')
    })

    it('treats 0 and null as different', () => {
        const result = computeChanges(
            { amount: 0 },
            { amount: null }
        )
        expect(result).toEqual({
            amount: { old: 0, new: null },
        })
    })
})
