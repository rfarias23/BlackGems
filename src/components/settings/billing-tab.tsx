'use client'

import { useState, useTransition } from 'react'
import { CreditCard, AlertCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { SubscriptionStatus, SubscriptionTier } from '@prisma/client'

const TIER_LABELS: Record<SubscriptionTier, string> = {
  SEARCH: 'Search',
  OPERATE: 'Operate',
  SCALE: 'Scale',
}

const TIER_PRICES: Record<SubscriptionTier, string> = {
  SEARCH: '$59',
  OPERATE: '$179',
  SCALE: '$349',
}

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; color: string }> = {
  TRIALING: { label: 'Trial', color: 'text-[#3E5CFF]' },
  ACTIVE: { label: 'Active', color: 'text-[#059669]' },
  PAST_DUE: { label: 'Past Due', color: 'text-amber-400' },
  CANCELED: { label: 'Canceled', color: 'text-red-400' },
  UNPAID: { label: 'Unpaid', color: 'text-red-400' },
}

interface BillingTabProps {
  tier: SubscriptionTier | null
  status: SubscriptionStatus | null
  daysRemaining?: number
  hasStripeCustomer: boolean
}

export function BillingTab({ tier, status, daysRemaining, hasStripeCustomer }: BillingTabProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openPortal() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/portal', { method: 'POST' })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to open billing portal')
          return
        }

        window.location.href = data.url
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  const statusInfo = status ? STATUS_LABELS[status] : null

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="border-[#334155] bg-[#1E2432]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <h3 className="text-[15px] font-medium text-[#F8FAFC]">Current Plan</h3>
          </div>

          <div className="grid grid-cols-2 gap-y-3 text-[14px]">
            <span className="text-slate-400">Plan</span>
            <span className="font-mono text-[#F8FAFC]">
              {tier ? `${TIER_LABELS[tier]} — ${TIER_PRICES[tier]}/mo` : 'No plan selected'}
            </span>

            <span className="text-slate-400">Status</span>
            <span className={statusInfo?.color ?? 'text-slate-500'}>
              {statusInfo?.label ?? 'None'}
              {status === 'TRIALING' && daysRemaining != null && (
                <span className="text-slate-500 ml-1">
                  ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-[#334155] bg-[#1E2432]">
        <CardContent className="p-6">
          {hasStripeCustomer ? (
            <div>
              <p className="text-[14px] text-slate-400 mb-4">
                Manage your subscription, update payment method, or view invoices through the Stripe billing portal.
              </p>
              <button
                onClick={openPortal}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-[#3E5CFF] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#3350E0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Opening...' : 'Manage billing'}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-[14px] text-slate-400">
              No billing account yet. Subscribe to a plan to get started.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-[13px] text-red-400 mt-3">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[12px] text-slate-600">
        Need help with billing? Contact{' '}
        <a href="mailto:contact@blackgem.ai" className="text-slate-400 hover:text-[#3E5CFF] transition-colors">
          contact@blackgem.ai
        </a>
      </p>
    </div>
  )
}
