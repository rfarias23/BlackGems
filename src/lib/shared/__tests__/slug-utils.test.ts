import { describe, it, expect } from 'vitest'
import { generateSlug, validateSlug, RESERVED_SLUGS } from '../slug-utils'

describe('generateSlug', () => {
  it('converts name to lowercase kebab-case', () => {
    expect(generateSlug('Martha Fund')).toBe('martha-fund')
  })

  it('handles multi-word names', () => {
    expect(generateSlug('Andes Capital Partners Fund I')).toBe('andes-capital-partners-fund-i')
  })

  it('removes special characters', () => {
    expect(generateSlug('Fund #1 (2025)')).toBe('fund-1-2025')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  ---Fund---  ')).toBe('fund')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('Fund   Multiple   Spaces')).toBe('fund-multiple-spaces')
  })

  it('truncates to 63 characters (DNS label max)', () => {
    const longName = 'A'.repeat(100)
    expect(generateSlug(longName).length).toBeLessThanOrEqual(63)
  })

  it('handles accented characters', () => {
    expect(generateSlug('Fondo de Inversión LATAM')).toBe('fondo-de-inversi-n-latam')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('handles numbers-only names', () => {
    expect(generateSlug('123 456')).toBe('123-456')
  })
})

describe('validateSlug', () => {
  it('accepts valid slug', () => {
    expect(validateSlug('martha-fund')).toEqual({ valid: true })
  })

  it('accepts single word', () => {
    expect(validateSlug('blackgem')).toEqual({ valid: true })
  })

  it('accepts alphanumeric with hyphens', () => {
    expect(validateSlug('fund-2025-v2')).toEqual({ valid: true })
  })

  it('accepts minimum length slug (1 char)', () => {
    expect(validateSlug('a')).toEqual({ valid: true })
  })

  it('rejects empty string', () => {
    expect(validateSlug('')).toEqual({ valid: false, error: 'Slug cannot be empty' })
  })

  it('rejects slug with spaces', () => {
    expect(validateSlug('martha fund').valid).toBe(false)
  })

  it('rejects slug with uppercase', () => {
    expect(validateSlug('MarthaFund').valid).toBe(false)
  })

  it('rejects slug starting with hyphen', () => {
    expect(validateSlug('-martha-fund').valid).toBe(false)
  })

  it('rejects slug ending with hyphen', () => {
    expect(validateSlug('martha-fund-').valid).toBe(false)
  })

  it('rejects slug longer than 63 chars', () => {
    expect(validateSlug('a'.repeat(64)).valid).toBe(false)
  })

  it('rejects all reserved slugs', () => {
    for (const slug of RESERVED_SLUGS) {
      const result = validateSlug(slug)
      expect(result.valid, `Expected "${slug}" to be rejected`).toBe(false)
    }
  })

  it('accepts slug that is not reserved', () => {
    expect(validateSlug('andes-capital')).toEqual({ valid: true })
  })
})
