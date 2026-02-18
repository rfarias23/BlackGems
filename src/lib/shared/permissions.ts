/**
 * Module-level permission constants for RBAC.
 *
 * Stored as String[] on FundMember.permissions.
 * Using strings (not a Prisma enum) allows adding new modules
 * without a database migration.
 */
export const MODULE_PERMISSIONS = {
  DEALS: 'DEALS',
  INVESTORS: 'INVESTORS',
  PORTFOLIO: 'PORTFOLIO',
  CAPITAL: 'CAPITAL',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
  TEAM: 'TEAM',
} as const

export type ModulePermission = typeof MODULE_PERMISSIONS[keyof typeof MODULE_PERMISSIONS]

export const DEFAULT_PERMISSIONS: Record<string, ModulePermission[]> = {
  PRINCIPAL:    ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'],
  ADMIN:        ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS', 'SETTINGS', 'TEAM'],
  CO_PRINCIPAL: ['DEALS', 'INVESTORS', 'PORTFOLIO', 'CAPITAL', 'REPORTS'],
  ADVISOR:      ['DEALS', 'PORTFOLIO', 'REPORTS'],
  ANALYST:      ['DEALS', 'PORTFOLIO', 'REPORTS'],
}

// ============================================================================
// ROLE HIERARCHY — UserRole → allowed FundMemberRole[]
// ============================================================================

/**
 * Defines which FundMemberRoles each UserRole can hold.
 * Empty array = cannot be a FundMember at all.
 */
export const ALLOWED_FUND_ROLES: Record<string, string[]> = {
  SUPER_ADMIN:        ['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST'],
  FUND_ADMIN:         ['PRINCIPAL', 'ADMIN', 'CO_PRINCIPAL', 'ADVISOR', 'ANALYST'],
  INVESTMENT_MANAGER: ['CO_PRINCIPAL', 'ADVISOR', 'ANALYST'],
  ANALYST:            ['ADVISOR', 'ANALYST'],
  LP_PRIMARY:         [],
  LP_VIEWER:          [],
  AUDITOR:            [],
}

export function validateFundMemberRole(
  systemRole: string,
  fundRole: string
): { valid: true } | { valid: false; error: string } {
  const allowed = ALLOWED_FUND_ROLES[systemRole]
  if (!allowed) {
    return { valid: false, error: `Unknown system role: ${systemRole}` }
  }
  if (allowed.length === 0) {
    return { valid: false, error: `Users with role ${systemRole} cannot be fund members` }
  }
  if (!allowed.includes(fundRole)) {
    return { valid: false, error: `Users with role ${systemRole} cannot hold fund role ${fundRole}. Allowed: ${allowed.join(', ')}` }
  }
  return { valid: true }
}

export function canBecomeFundMember(systemRole: string): boolean {
  const allowed = ALLOWED_FUND_ROLES[systemRole]
  return Array.isArray(allowed) && allowed.length > 0
}
