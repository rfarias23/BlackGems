import { describe, it, expect } from 'vitest'
import { MODULE_PERMISSIONS, DEFAULT_PERMISSIONS, type ModulePermission } from '../permissions'

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
