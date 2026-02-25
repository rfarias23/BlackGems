'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkSubscriptionAccess } from '@/lib/shared/subscription-access'

export async function getSubscriptionStatus() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })

  if (!user?.organizationId) return null

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      subscriptionStatus: true,
      subscriptionTier: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
    },
  })

  if (!org) return null

  const access = checkSubscriptionAccess({
    subscriptionStatus: org.subscriptionStatus,
    trialEndsAt: org.trialEndsAt,
    stripeSubscriptionId: org.stripeSubscriptionId,
  })

  return {
    ...access,
    tier: org.subscriptionTier,
    status: org.subscriptionStatus,
    hasStripeCustomer: !!org.stripeCustomerId,
  }
}
