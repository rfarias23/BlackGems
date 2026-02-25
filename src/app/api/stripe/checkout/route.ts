import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe, STRIPE_PRICES, type StripeTier } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const tier = body.tier as StripeTier

  if (!tier || !STRIPE_PRICES[tier]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  // Look up user's organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, email: true, name: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeCustomerId: true, trialEndsAt: true, subscriptionStatus: true, name: true },
  })

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const stripe = getStripe()

  // Find or create Stripe Customer
  let customerId = org.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: org.name,
      metadata: { organizationId: user.organizationId },
    })
    customerId = customer.id

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { stripeCustomerId: customerId },
    })
  }

  // Build checkout session config
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const checkoutConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICES[tier], quantity: 1 }],
    success_url: `${baseUrl}/dashboard?billing=success`,
    cancel_url: `${baseUrl}/dashboard?billing=canceled`,
    ui_mode: 'embedded',
    return_url: `${baseUrl}/dashboard?billing=success`,
  }

  // If still in trial, preserve remaining trial on subscription
  if (org.subscriptionStatus === 'TRIALING' && org.trialEndsAt && org.trialEndsAt > new Date()) {
    checkoutConfig.subscription_data = {
      trial_end: Math.floor(org.trialEndsAt.getTime() / 1000),
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create(checkoutConfig)

  return NextResponse.json({ clientSecret: checkoutSession.client_secret })
}
