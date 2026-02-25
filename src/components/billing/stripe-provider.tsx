'use client'

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useMemo } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function StripeProvider({
  clientSecret,
  children,
}: {
  clientSecret: string
  children: React.ReactNode
}) {
  const options = useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#3E5CFF',
        colorBackground: '#1E2432',
        colorText: '#F8FAFC',
        colorDanger: '#DC2626',
        borderRadius: '8px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      rules: {
        '.Input': {
          border: '1px solid #334155',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '1px solid #3E5CFF',
          boxShadow: '0 0 0 1px #3E5CFF',
        },
        '.Label': {
          color: '#94A3B8',
          fontSize: '13px',
        },
      },
    },
  }), [clientSecret])

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}
