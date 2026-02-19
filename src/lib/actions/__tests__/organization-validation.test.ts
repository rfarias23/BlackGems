import { describe, it, expect, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must mock every external dependency of organizations.ts so the
// module loads without the Next.js runtime
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: { findUnique: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn(),
}))

import { generateSlug, validateSlug } from '../organizations'

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

  it('rejects slug longer than 63 chars', () => {
    expect(validateSlug('a'.repeat(64)).valid).toBe(false)
  })

  it('rejects reserved slugs', () => {
    expect(validateSlug('www').valid).toBe(false)
    expect(validateSlug('api').valid).toBe(false)
    expect(validateSlug('app').valid).toBe(false)
    expect(validateSlug('admin').valid).toBe(false)
    expect(validateSlug('login').valid).toBe(false)
    expect(validateSlug('portal').valid).toBe(false)
  })
})
