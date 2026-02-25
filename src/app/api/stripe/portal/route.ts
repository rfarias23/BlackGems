import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only SUPER_ADMIN can manage billing
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, organizationId: true },
  })

  if (!user?.organizationId || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only administrators can manage billing' }, { status: 403 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { stripeCustomerId: true },
  })

  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found. Please subscribe first.' }, { status: 400 })
  }

  const stripe = getStripe()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${baseUrl}/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
