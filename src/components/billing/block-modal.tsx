'use client'

import { useState, useTransition } from 'react'
import { AlertCircle } from 'lucide-react'

export function BlockModal({ reason }: { reason: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleManageBilling() {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#11141D]/95">
      <div className="max-w-md w-full mx-4 bg-[#1E293B] border border-[#334155] rounded-lg p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>

        <h2 className="font-serif text-[22px] font-normal text-[#F8FAFC] mb-2">
          Subscription required
        </h2>

        <p className="text-[14px] text-slate-400 mb-6 leading-relaxed">
          {reason}
        </p>

        <button
          onClick={handleManageBilling}
          disabled={isPending}
          className="w-full rounded-lg bg-[#3E5CFF] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#3350E0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Opening billing...' : 'Manage billing'}
        </button>

        {error && (
          <p className="text-[13px] text-red-400 mt-3">{error}</p>
        )}

        <p className="text-[12px] text-slate-600 mt-4">
          Need help? Contact{' '}
          <a href="mailto:contact@blackgem.ai" className="text-slate-400 hover:text-[#3E5CFF] transition-colors">
            contact@blackgem.ai
          </a>
        </p>
      </div>
    </div>
  )
}
