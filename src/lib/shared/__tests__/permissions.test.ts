import { describe, it, expect } from 'vitest'
import {
  MODULE_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  ALLOWED_FUND_ROLES,
  validateFundMemberRole,
  canBecomeFundMember,
  type ModulePermission,
} from '../permissions'

describe('MODULE_PERMISSIONS', () => {
  it('contains all required modules', () => {
    expect(MODULE_PERMISSIONS.DEALS).toBe('DEALS')
    expect(MODULE_PERMISSIONS.INVESTORS).toBe('INVESTORS')
    expect(MODULE_PERMISSIONS.PORTFOLIO).toBe('PORTFOLIO')
    expect(MODULE_PERMISSIONS.CAPITAL).toBe('CAPITAL')
    expect(MODULE_PERMISSIONS.REPORTS).toBe('REPORTS')
    expect(MODULE_PERMISSIONS.SETTINGS).toBe('SETTINGS')
    expect(MODULE_PERMISSIONS.TEAM).toBe('TEAM')
  })

  it('has exactly 7 modules', () => {
    expect(Object.keys(MODULE_PERMISSIONS)).toHaveLength(7)
  })
})

describe('DEFAULT_PERMISSIONS', () => {
  it('gives PRINCIPAL full access', () => {
    expect(DEFAULT_PERMISSIONS.PRINCIPAL).toEqual(
      expect.arrayContaining(['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'])
    )
    expect(DEFAULT_PERMISSIONS.PRINCIPAL).toHaveLength(7)
  })

  it('gives ADMIN full access', () => {
    expect(DEFAULT_PERMISSIONS.ADMIN).toEqual(DEFAULT_PERMISSIONS.PRINCIPAL)
  })

  it('gives CO_PRINCIPAL access without TEAM and SETTINGS', () => {
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).toContain('DEALS')
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).toContain('INVESTORS')
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).not.toContain('TEAM')
    expect(DEFAULT_PERMISSIONS.CO_PRINCIPAL).not.toContain('SETTINGS')
  })

  it('gives ANALYST limited access without INVESTORS', () => {
    expect(DEFAULT_PERMISSIONS.ANALYST).toContain('DEALS')
    expect(DEFAULT_PERMISSIONS.ANALYST).toContain('PORTFOLIO')
    expect(DEFAULT_PERMISSIONS.ANALYST).toContain('REPORTS')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('INVESTORS')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('TEAM')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('SETTINGS')
    expect(DEFAULT_PERMISSIONS.ANALYST).not.toContain('CAPITAL')
  })

  it('gives ADVISOR same access as ANALYST', () => {
    expect(DEFAULT_PERMISSIONS.ADVISOR).toEqual(DEFAULT_PERMISSIONS.ANALYST)
  })

  it('covers all FundMemberRole values', () => {
    const expectedRoles = ['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST']
    expect(Object.keys(DEFAULT_PERMISSIONS).sort()).toEqual(expectedRoles.sort())
  })
})

describe('ALLOWED_FUND_ROLES', () => {
  it('allows SUPER_ADMIN any fund role', () => {
    expect(ALLOWED_FUND_ROLES.SUPER_ADMIN).toEqual(
      expect.arrayContaining(['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST'])
    )
  })

  it('allows FUND_ADMIN any fund role', () => {
    expect(ALLOWED_FUND_ROLES.FUND_ADMIN).toEqual(ALLOWED_FUND_ROLES.SUPER_ADMIN)
  })

  it('limits INVESTMENT_MANAGER to CO_PRINCIPAL and below', () => {
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).toContain('CO_PRINCIPAL')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).toContain('ADVISOR')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).toContain('ANALYST')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).not.toContain('PRINCIPAL')
    expect(ALLOWED_FUND_ROLES.INVESTMENT_MANAGER).not.toContain('ADMIN')
  })

  it('limits ANALYST to ADVISOR and ANALYST only', () => {
    expect(ALLOWED_FUND_ROLES.ANALYST).toContain('ADVISOR')
    expect(ALLOWED_FUND_ROLES.ANALYST).toContain('ANALYST')
    expect(ALLOWED_FUND_ROLES.ANALYST).not.toContain('PRINCIPAL')
    expect(ALLOWED_FUND_ROLES.ANALYST).not.toContain('ADMIN')
    expect(ALLOWED_FUND_ROLES.ANALYST).not.toContain('CO_PRINCIPAL')
  })

  it('does not allow LP_PRIMARY to be a fund member', () => {
    expect(ALLOWED_FUND_ROLES.LP_PRIMARY).toEqual([])
  })

  it('does not allow LP_VIEWER to be a fund member', () => {
    expect(ALLOWED_FUND_ROLES.LP_VIEWER).toEqual([])
  })

  it('does not allow AUDITOR to be a fund member', () => {
    expect(ALLOWED_FUND_ROLES.AUDITOR).toEqual([])
  })

  it('covers all UserRole values', () => {
    const expectedRoles = [
      'SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER',
      'ANALYST', 'LP_PRIMARY', 'LP_VIEWER', 'AUDITOR',
    ]
    expect(Object.keys(ALLOWED_FUND_ROLES).sort()).toEqual(expectedRoles.sort())
  })
})

describe('validateFundMemberRole', () => {
  it('allows SUPER_ADMIN to be PRINCIPAL', () => {
    const result = validateFundMemberRole('SUPER_ADMIN', 'PRINCIPAL')
    expect(result).toEqual({ valid: true })
  })

  it('allows FUND_ADMIN to be ADMIN', () => {
    const result = validateFundMemberRole('FUND_ADMIN', 'ADMIN')
    expect(result).toEqual({ valid: true })
  })

  it('allows INVESTMENT_MANAGER to be CO_PRINCIPAL', () => {
    const result = validateFundMemberRole('INVESTMENT_MANAGER', 'CO_PRINCIPAL')
    expect(result).toEqual({ valid: true })
  })

  it('rejects INVESTMENT_MANAGER as PRINCIPAL', () => {
    const result = validateFundMemberRole('INVESTMENT_MANAGER', 'PRINCIPAL')
    expect(result.valid).toBe(false)
    expect((result as { valid: false; error: string }).error).toContain('INVESTMENT_MANAGER')
  })

  it('rejects ANALYST as ADMIN', () => {
    const result = validateFundMemberRole('ANALYST', 'ADMIN')
    expect(result.valid).toBe(false)
  })

  it('allows ANALYST as ADVISOR', () => {
    const result = validateFundMemberRole('ANALYST', 'ADVISOR')
    expect(result).toEqual({ valid: true })
  })

  it('rejects LP_PRIMARY for any fund role', () => {
    expect(validateFundMemberRole('LP_PRIMARY', 'ANALYST').valid).toBe(false)
    expect(validateFundMemberRole('LP_PRIMARY', 'PRINCIPAL').valid).toBe(false)
  })

  it('rejects AUDITOR for any fund role', () => {
    expect(validateFundMemberRole('AUDITOR', 'ANALYST').valid).toBe(false)
  })
})

describe('canBecomeFundMember', () => {
  it('returns true for SUPER_ADMIN', () => {
    expect(canBecomeFundMember('SUPER_ADMIN')).toBe(true)
  })

  it('returns true for INVESTMENT_MANAGER', () => {
    expect(canBecomeFundMember('INVESTMENT_MANAGER')).toBe(true)
  })

  it('returns true for system ANALYST', () => {
    expect(canBecomeFundMember('ANALYST')).toBe(true)
  })

  it('returns false for LP_PRIMARY', () => {
    expect(canBecomeFundMember('LP_PRIMARY')).toBe(false)
  })

  it('returns false for LP_VIEWER', () => {
    expect(canBecomeFundMember('LP_VIEWER')).toBe(false)
  })

  it('returns false for AUDITOR', () => {
    expect(canBecomeFundMember('AUDITOR')).toBe(false)
  })
})
