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
 * Used for permission checks (e.g., module access) where both roles
 * have elevated privileges within their scope.
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
 * Best-effort cookie persistence for the active fund.
 * In Server Actions / Route Handlers the cookie is written normally.
 * In RSC render context (where cookie writes are forbidden by Next.js 15),
 * the write is silently skipped — the fund ID is still returned to the caller.
 * The cookie may be set on the user's next Server Action or Route Handler invocation.
 */
async function trySaveActiveFundId(fundId: string): Promise<void> {
  try {
    await setActiveFundId(fundId)
  } catch (error) {
    // Next.js 15 throws when cookie writes happen during RSC render.
    // That is expected and safe to ignore. Anything else is unexpected.
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('Cookies can only be modified')) {
      console.error('trySaveActiveFundId: unexpected error', error)
    }
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
    // Fetch user role + org once to avoid repeated DB queries
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    })
    if (!user) return null

    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const isFundAdmin = user.role === 'FUND_ADMIN'
    const userOrgId = user.organizationId

    /** Check if user can access a fund based on role + org boundary */
    const canAccessFund = async (fundId: string, fundOrgId: string | null): Promise<boolean> => {
      if (isSuperAdmin) return true
      if (isFundAdmin && userOrgId && fundOrgId === userOrgId) return true
      const m = await prisma.fundMember.findUnique({
        where: { fundId_userId: { fundId, userId } },
        select: { isActive: true },
      })
      return m?.isActive === true
    }

    // 1. Try subdomain-resolved fund (from middleware header)
    const fundSlug = await getFundSlugFromHeaders()
    if (fundSlug) {
      const fund = await prisma.fund.findUnique({
        where: { slug: fundSlug },
        select: { id: true, organizationId: true },
      })
      if (fund && await canAccessFund(fund.id, fund.organizationId)) {
        await trySaveActiveFundId(fund.id)
        return fund.id
      }
    }

    // 2. Try cookie
    const cookieFundId = await getActiveFundId()
    if (cookieFundId) {
      const fund = await prisma.fund.findUnique({
        where: { id: cookieFundId },
        select: { id: true, organizationId: true },
      })
      if (fund && await canAccessFund(fund.id, fund.organizationId)) {
        return cookieFundId
      }
    }

    // 3. Fallback: first fund user has membership in
    const membership = await prisma.fundMember.findFirst({
      where: { userId, isActive: true },
      select: { fundId: true },
      orderBy: { joinedAt: 'asc' },
    })

    if (membership) {
      await trySaveActiveFundId(membership.fundId)
      return membership.fundId
    }

    // 4. Fallback for admins with no memberships
    if (isSuperAdmin) {
      const fund = await prisma.fund.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      if (fund) {
        await trySaveActiveFundId(fund.id)
        return fund.id
      }
    } else if (isFundAdmin) {
      // TODO(multi-org): Remove global fund fallback — security risk in multi-tenant.
      // A FUND_ADMIN with null organizationId can see any fund globally here.
      // Safe in single-tenant; must be removed before multi-org launch.
      const fund = await prisma.fund.findFirst({
        where: userOrgId ? { organizationId: userOrgId } : {},
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      if (fund) {
        await trySaveActiveFundId(fund.id)
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
