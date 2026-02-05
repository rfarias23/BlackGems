import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
 * Verifies the current user has access to the specified fund.
 * Checks that the user is either a SUPER_ADMIN or has an active FundMember
 * record for the given fund.
 */
export async function requireFundAccess(userId: string, fundId: string) {
  // Super admins bypass fund-level checks
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

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
 * Returns the default fund ID and validates user access in one call.
 * For MVP single-fund mode.
 */
export async function getAuthorizedFundId(userId: string): Promise<string> {
  const fund = await prisma.fund.findFirst()
  if (!fund) {
    throw new Error('No fund found. Please create a fund first.')
  }

  await requireFundAccess(userId, fund.id)
  return fund.id
}
