import type { SubscriptionStatus } from '@prisma/client'

interface SubscriptionInput {
  subscriptionStatus: SubscriptionStatus | null
  trialEndsAt: Date | null
  stripeSubscriptionId: string | null
}

interface SubscriptionAccessResult {
  allowed: boolean
  reason?: string
  daysRemaining?: number
}

export function checkSubscriptionAccess(org: SubscriptionInput): SubscriptionAccessResult {
  const { subscriptionStatus, trialEndsAt } = org

  if (subscriptionStatus === 'ACTIVE') {
    return { allowed: true }
  }

  if (subscriptionStatus === 'TRIALING') {
    if (!trialEndsAt || trialEndsAt <= new Date()) {
      return { allowed: false, reason: 'Your trial has expired. Please subscribe to continue.' }
    }
    const daysRemaining = Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)
    return { allowed: true, daysRemaining }
  }

  if (subscriptionStatus === 'PAST_DUE') {
    return { allowed: true, reason: 'Your payment is past due. Please update your payment method.' }
  }

  if (subscriptionStatus === 'CANCELED') {
    return { allowed: false, reason: 'Your subscription has been canceled. Please resubscribe to continue.' }
  }

  if (subscriptionStatus === 'UNPAID') {
    return { allowed: false, reason: 'Your subscription is unpaid. Please update your payment method.' }
  }

  return { allowed: false, reason: 'No active subscription. Please subscribe to continue.' }
}
