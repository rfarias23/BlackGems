import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActiveFundId, setActiveFundId } from '@/lib/shared/active-fund'
import type { CurrencyCode } from '@/lib/shared/formatters'

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
 * Verifies the current user has access to the specified fund.
 * Checks that the user is either a SUPER_ADMIN/FUND_ADMIN or has an active
 * FundMember record for the given fund.
 */
export async function requireFundAccess(userId: string, fundId: string) {
  if (await isAdminRole(userId)) {
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
 * 1. Cookie value (if user still has access)
 * 2. First fund the user has membership in
 * 3. First fund in DB (for admins with no memberships)
 * 4. Returns null if no fund exists (never throws)
 */
export async function getAuthorizedFundId(userId: string): Promise<string | null> {
  try {
    // 1. Try cookie
    const cookieFundId = await getActiveFundId()

    if (cookieFundId) {
      // Validate user still has access to this fund
      const isAdmin = await isAdminRole(userId)

      if (isAdmin) {
        // Verify fund exists
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

    // 2. Fallback: first fund user has membership in
    const membership = await prisma.fundMember.findFirst({
      where: { userId, isActive: true },
      select: { fundId: true },
      orderBy: { joinedAt: 'asc' },
    })

    if (membership) {
      await setActiveFundId(membership.fundId)
      return membership.fundId
    }

    // 3. Fallback for admins with no memberships: first fund in DB
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
