import Stripe from 'stripe'

// Lazy-init pattern to avoid build crashes without env vars
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  }
  return _stripe
}

export const STRIPE_PRICES = {
  SEARCH: process.env.STRIPE_PRICE_SEARCH!,
  OPERATE: process.env.STRIPE_PRICE_OPERATE!,
  SCALE: process.env.STRIPE_PRICE_SCALE!,
} as const

export type StripeTier = keyof typeof STRIPE_PRICES

export function priceIdToTier(priceId: string): StripeTier | null {
  for (const [tier, id] of Object.entries(STRIPE_PRICES)) {
    if (id === priceId) return tier as StripeTier
  }
  return null
}
