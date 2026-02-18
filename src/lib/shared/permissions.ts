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
