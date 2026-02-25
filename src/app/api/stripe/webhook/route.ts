import { NextResponse } from 'next/server'
import { getStripe, priceIdToTier } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/shared/audit'
import type { SubscriptionStatus, SubscriptionTier } from '@prisma/client'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      case 'invoice.payment_failed': {
        const failedSubId = (event.data.object as unknown as { subscription?: string | null }).subscription
        if (failedSubId) {
          await updateOrgBySubscriptionId(failedSubId, { subscriptionStatus: 'PAST_DUE' })
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const succeededSubId = (event.data.object as unknown as { subscription?: string | null }).subscription
        if (succeededSubId) {
          await updateOrgBySubscriptionId(succeededSubId, { subscriptionStatus: 'ACTIVE' })
        }
        break
      }
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'trialing': return 'TRIALING'
    case 'active': return 'ACTIVE'
    case 'past_due': return 'PAST_DUE'
    case 'canceled': return 'CANCELED'
    case 'unpaid': return 'UNPAID'
    default: return 'CANCELED'
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id
  const tier = priceId ? priceIdToTier(priceId) : null

  const data: {
    subscriptionStatus: SubscriptionStatus
    subscriptionTier?: SubscriptionTier
    stripeSubscriptionId: string
  } = {
    subscriptionStatus: mapStripeStatus(subscription.status),
    stripeSubscriptionId: subscription.id,
  }

  if (tier) {
    data.subscriptionTier = tier as SubscriptionTier
  }

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })

  if (!org) {
    console.error('No organization found for Stripe customer:', customerId)
    return
  }

  await prisma.organization.update({
    where: { id: org.id },
    data,
  })

  // Audit log
  const adminUser = await prisma.user.findFirst({
    where: { organizationId: org.id, role: 'SUPER_ADMIN' },
    select: { id: true },
  })

  if (adminUser) {
    logAudit({
      userId: adminUser.id,
      action: 'UPDATE',
      entityType: 'Organization',
      entityId: org.id,
      changes: {
        subscriptionStatus: { old: null, new: data.subscriptionStatus },
        source: { old: null, new: 'stripe_webhook' },
      },
    }).catch(err => console.error('Audit log failed:', err))
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: { subscriptionStatus: 'CANCELED' },
  })
}

async function updateOrgBySubscriptionId(
  subscriptionId: string,
  data: { subscriptionStatus: SubscriptionStatus }
) {
  await prisma.organization.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data,
  })
}
