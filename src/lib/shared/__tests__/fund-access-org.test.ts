import { describe, it, expect, vi } from 'vitest'

// Mock dependencies to prevent Next.js module resolution errors
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    fundMember: { findUnique: vi.fn(), findFirst: vi.fn() },
    fund: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/shared/active-fund', () => ({
  getActiveFundId: vi.fn(),
  setActiveFundId: vi.fn(),
}))

import { validateOrganizationBoundary } from '../fund-access'

describe('validateOrganizationBoundary', () => {
  it('returns true when both orgIds match', () => {
    expect(validateOrganizationBoundary('org_1', 'org_1')).toBe(true)
  })

  it('returns true when user has no orgId (platform admin)', () => {
    expect(validateOrganizationBoundary(null, 'org_1')).toBe(true)
  })

  it('returns true when fund has no orgId (pre-migration)', () => {
    expect(validateOrganizationBoundary('org_1', null)).toBe(true)
  })

  it('returns true when both are null (pre-migration)', () => {
    expect(validateOrganizationBoundary(null, null)).toBe(true)
  })

  it('returns false when orgIds differ', () => {
    expect(validateOrganizationBoundary('org_1', 'org_2')).toBe(false)
  })
})
