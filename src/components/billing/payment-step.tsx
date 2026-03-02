'use client'

import { useState, useCallback } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { stripePromise } from './stripe-provider'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'

const TIERS = [
  {
    id: 'SEARCH' as const,
    name: 'Search',
    price: '59',
    features: [
      'AI copilot (read queries)',
      'Deal pipeline & DD automation',
      '2 team members',
    ],
  },
  {
    id: 'OPERATE' as const,
    name: 'Operate',
    price: '179',
    highlighted: true,
    features: [
      'Everything in Search',
      'AI agent (read + write)',
      'LP portal & capital ops',
      '5 team members',
    ],
  },
  {
    id: 'SCALE' as const,
    name: 'Scale',
    price: '349',
    features: [
      'Everything in Operate',
      'Multi-fund support',
      'API access',
      'Unlimited team members',
    ],
  },
]

type Tier = typeof TIERS[number]['id']

interface PaymentStepProps {
  onComplete: () => void
}

export function PaymentStep({ onComplete }: PaymentStepProps) {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)
  const [error, setError] = useState<string | null>(null)

  function selectTier(tier: Tier) {
    setError(null)
    setSelectedTier(tier)
  }

  const fetchClientSecret = useCallback(async () => {
    if (!selectedTier) throw new Error('No tier selected')

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: selectedTier }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create checkout session')
      throw new Error(data.error || 'Failed to create checkout session')
    }

    return data.clientSecret as string
  }, [selectedTier])

  return (
    <div>
      <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
        Choose your plan
      </h1>
      <p className="text-[14px] text-slate-400 mb-8">
        Your trial is active. Choose a plan to continue after the trial.
      </p>

      {/* Tier selection */}
      <div className="space-y-3 mb-8">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => selectTier(tier.id)}
            className={`w-full text-left rounded-lg border p-5 transition-all ${
              selectedTier === tier.id
                ? 'border-[#3E5CFF] bg-[#3E5CFF]/5'
                : tier.highlighted
                  ? 'border-[#3E5CFF]/30 bg-[#1E2432] hover:border-[#3E5CFF]/60'
                  : 'border-[#334155] bg-[#1E2432] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-medium text-[#F8FAFC]">{tier.name}</span>
              <span className="font-mono text-[18px] text-[#F8FAFC]">
                ${tier.price}<span className="text-[13px] text-slate-600">/mo</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {tier.features.map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-[12px] text-slate-400">
                  <Check className="h-3 w-3 text-[#059669] shrink-0" />
                  {f}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Embedded Checkout */}
      {selectedTier && (
        <div className="mb-6 rounded-lg overflow-hidden border border-[#334155]" key={selectedTier}>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret, onComplete }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      )}

      {/* Skip option */}
      <button
        type="button"
        onClick={onComplete}
        className="w-full mt-4 text-center text-[13px] text-slate-500 hover:text-slate-400 transition-colors"
      >
        Skip for now — you can subscribe later from Settings
      </button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 mt-4" aria-live="polite">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
