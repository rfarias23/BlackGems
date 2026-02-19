import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveFundId, setActiveFundId } from '@/lib/shared/active-fund'
import type { CurrencyCode } from '@/lib/shared/formatters'
import { headers } from 'next/headers'
import { MODULE_PERMISSIONS, type ModulePermission } from './permissions'

/**
 * Verifies the current user is authenticated and returns session info.
 * Throws an error if not authenticated.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Returns true if the user role is SUPER_ADMIN or FUND_ADMIN.
 */
async function isAdminRole(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === 'SUPER_ADMIN' || user?.role === 'FUND_ADMIN'
}

/**
 * Reads the fund slug injected by middleware from the request headers.
 * Returns null if no subdomain was detected.
 */
async function getFundSlugFromHeaders(): Promise<string | null> {
  try {
    const headersList = await headers()
    return headersList.get('x-fund-slug')
  } catch {
    // headers() may throw outside of request context (e.g., in tests)
    return null
  }
}

/**
 * Validates that a user and fund belong to the same organization.
 * Returns true if:
 * - Both orgIds match
 * - Either orgId is null (pre-migration or platform admin)
 * Returns false only when both are non-null and differ.
 */
export function validateOrganizationBoundary(
  userOrgId: string | null | undefined,
  fundOrgId: string | null | undefined
): boolean {
  if (!userOrgId || !fundOrgId) return true
  return userOrgId === fundOrgId
}

/**
 * Verifies the current user has access to the specified fund.
 * Checks that the user is either a SUPER_ADMIN/FUND_ADMIN or has an active
 * FundMember record for the given fund.
 */
export async function requireFundAccess(userId: string, fundId: string) {
  // Organization boundary check
  const [user, fund] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    }),
    prisma.fund.findUnique({
      where: { id: fundId },
      select: { organizationId: true },
    }),
  ])

  if (!validateOrganizationBoundary(user?.organizationId ?? null, fund?.organizationId ?? null)) {
    throw new Error('Access denied: fund belongs to a different organization')
  }

  // Admin bypass (already fetched the role above)
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'FUND_ADMIN') {
    return true
  }

  const membership = await prisma.fundMember.findUnique({
    where: {
      fundId_userId: { fundId, userId },
    },
    select: { isActive: true },
  })

  if (!membership?.isActive) {
    throw new Error('Access denied: you do not have access to this fund')
  }

  return true
}

/**
 * Returns the active fund ID for the current user.
 *
 * Resolution order:
 * 1. Subdomain-resolved fund (from x-fund-slug header → find Fund by slug → verify access)
 * 2. Cookie value (if user still has access)
 * 3. First fund the user has membership in
 * 4. First fund in DB (for admins with no memberships)
 * 5. Returns null if no fund exists (never throws)
 */
export async function getAuthorizedFundId(userId: string): Promise<string | null> {
  try {
    // 1. Try subdomain-resolved fund (from middleware header)
    const fundSlug = await getFundSlugFromHeaders()
    if (fundSlug) {
      const fund = await prisma.fund.findUnique({
        where: { slug: fundSlug },
        select: { id: true },
      })
      if (fund) {
        // Verify user has access to this fund
        const isAdmin = await isAdminRole(userId)
        if (isAdmin) {
          await setActiveFundId(fund.id)
          return fund.id
        }
        const membership = await prisma.fundMember.findUnique({
          where: { fundId_userId: { fundId: fund.id, userId } },
          select: { isActive: true },
        })
        if (membership?.isActive) {
          await setActiveFundId(fund.id)
          return fund.id
        }
        // User doesn't have access to this fund — fall through to cookie
      }
    }

    // 2. Try cookie
    const cookieFundId = await getActiveFundId()

    if (cookieFundId) {
      const isAdmin = await isAdminRole(userId)

      if (isAdmin) {
        const fundExists = await prisma.fund.findUnique({
          where: { id: cookieFundId },
          select: { id: true },
        })
        if (fundExists) return cookieFundId
      } else {
        const membership = await prisma.fundMember.findUnique({
          where: { fundId_userId: { fundId: cookieFundId, userId } },
          select: { isActive: true },
        })
        if (membership?.isActive) return cookieFundId
      }
    }

    // 3. Fallback: first fund user has membership in
    const membership = await prisma.fundMember.findFirst({
      where: { userId, isActive: true },
      select: { fundId: true },
      orderBy: { joinedAt: 'asc' },
    })

    if (membership) {
      await setActiveFundId(membership.fundId)
      return membership.fundId
    }

    // 4. Fallback for admins with no memberships: first fund in DB
    if (await isAdminRole(userId)) {
      const fund = await prisma.fund.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      if (fund) {
        await setActiveFundId(fund.id)
        return fund.id
      }
    }

    return null
  } catch (error) {
    console.error('getAuthorizedFundId failed:', error)
    return null
  }
}

/**
 * Returns the active fund ID and its currency in a single call.
 * Returns null if no fund is accessible (e.g., DB migration pending).
 * Avoids double-querying in server actions that need both.
 */
export async function getActiveFundWithCurrency(userId: string): Promise<{
  fundId: string
  currency: CurrencyCode
} | null> {
  try {
    const fundId = await getAuthorizedFundId(userId)
    if (!fundId) return null
    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      select: { currency: true },
    })
    return { fundId, currency: (fund?.currency ?? 'USD') as CurrencyCode }
  } catch (error) {
    console.error('getActiveFundWithCurrency failed:', error)
    return null
  }
}

/**
 * Verifies the user has permission to access a specific module within the active fund.
 * SUPER_ADMIN/FUND_ADMIN bypass permission checks but queries still filter by fundId.
 */
export async function requireModuleAccess(
  userId: string,
  fundId: string,
  module: ModulePermission
): Promise<void> {
  if (await isAdminRole(userId)) {
    return
  }

  const membership = await prisma.fundMember.findUnique({
    where: { fundId_userId: { fundId, userId } },
    select: { isActive: true, permissions: true },
  })

  if (!membership?.isActive) {
    throw new Error('Access denied: no active membership in this fund')
  }

  if (!membership.permissions.includes(module)) {
    throw new Error(`Access denied: no ${module} permission in this fund`)
  }
}

/**
 * Returns the module permissions for a user in a specific fund.
 * Used by the sidebar to conditionally render navigation links.
 */
export async function getUserModulePermissions(
  userId: string,
  fundId: string
): Promise<string[]> {
  if (await isAdminRole(userId)) {
    return Object.values(MODULE_PERMISSIONS)
  }

  const membership = await prisma.fundMember.findUnique({
    where: { fundId_userId: { fundId, userId } },
    select: { permissions: true, isActive: true },
  })

  if (!membership?.isActive) return []
  return membership.permissions
}
