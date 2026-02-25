'use client'

import { useState, useTransition } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { StripeProvider } from './stripe-provider'
import {
  PaymentElement,
  useStripe,
  useElements,
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
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function selectTier(tier: Tier) {
    setSelectedTier(tier)
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to create checkout session')
          return
        }

        setClientSecret(data.clientSecret)
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div>
      <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
        Choose your plan
      </h1>
      <p className="text-[14px] text-slate-400 mb-8">
        Your 14-day trial is active. Choose a plan to continue after the trial.
      </p>

      {/* Tier selection */}
      <div className="space-y-3 mb-8">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => selectTier(tier.id)}
            disabled={isPending}
            className={`w-full text-left rounded-lg border p-5 transition-all ${
              selectedTier === tier.id
                ? 'border-[#3E5CFF] bg-[#3E5CFF]/5'
                : tier.highlighted
                  ? 'border-[#3E5CFF]/30 bg-[#1E2432] hover:border-[#3E5CFF]/60'
                  : 'border-[#334155] bg-[#1E2432] hover:border-slate-500'
            } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Payment form */}
      {clientSecret && selectedTier && (
        <StripeProvider clientSecret={clientSecret}>
          <CheckoutForm onComplete={onComplete} />
        </StripeProvider>
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

function CheckoutForm({ onComplete }: { onComplete: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsSubmitting(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Payment failed')
      setIsSubmitting(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?billing=success`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setIsSubmitting(false)
      return
    }

    onComplete()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3E5CFF] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#3350E0] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Processing...' : 'Subscribe'}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400" aria-live="polite">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </form>
  )
}
