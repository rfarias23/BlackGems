'use client'

import { useState, useTransition } from 'react'
import { switchActiveFund } from '@/lib/actions/funds'
import { ChevronsUpDown, Plus, Check } from 'lucide-react'
import type { FundSummary } from '@/lib/actions/funds'

interface FundSwitcherProps {
  funds: FundSummary[]
  activeFundId: string
  userRole?: string
}

const CURRENCY_BADGE: Record<string, string> = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
}

export function FundSwitcher({ funds, activeFundId, userRole }: FundSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'FUND_ADMIN'

  const activeFund = funds.find((f) => f.id === activeFundId)
  const hasMultipleFunds = funds.length > 1 || isAdmin

  const handleSwitch = (fundId: string) => {
    if (fundId === activeFundId) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      await switchActiveFund(fundId)
      setOpen(false)
    })
  }

  return (
    <div className="px-3 py-3 border-b border-[#334155]">
      <button
        type="button"
        onClick={() => hasMultipleFunds && setOpen(!open)}
        disabled={isPending}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
          hasMultipleFunds
            ? 'hover:bg-[#334155] cursor-pointer'
            : 'cursor-default'
        } ${isPending ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2 w-2 rounded-full bg-[#3E5CFF] flex-shrink-0" />
          <span className="text-sm font-medium text-[#F8FAFC] truncate">
            {activeFund?.name ?? 'No Fund'}
          </span>
          {activeFund && (
            <span className="text-[10px] font-mono text-[#94A3B8] border border-[#334155] rounded px-1 py-0.5 flex-shrink-0">
              {CURRENCY_BADGE[activeFund.currency] ?? activeFund.currency}
            </span>
          )}
        </div>
        {hasMultipleFunds && (
          <ChevronsUpDown className="h-4 w-4 text-[#64748B] flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="mt-1 rounded-md border border-[#334155] bg-[#1E293B] overflow-hidden">
          {funds.map((fund) => (
            <button
              key={fund.id}
              type="button"
              onClick={() => handleSwitch(fund.id)}
              disabled={isPending}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#334155] transition-colors"
            >
              {fund.id === activeFundId ? (
                <Check className="h-3.5 w-3.5 text-[#3E5CFF] flex-shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span
                className={`truncate ${
                  fund.id === activeFundId
                    ? 'text-[#F8FAFC] font-medium'
                    : 'text-[#94A3B8]'
                }`}
              >
                {fund.name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] border border-[#334155]/50 rounded px-1 py-0.5 flex-shrink-0 ml-auto">
                {CURRENCY_BADGE[fund.currency] ?? fund.currency}
              </span>
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="border-t border-[#334155]" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  // CreateFundDialog will be triggered by parent
                  document.dispatchEvent(new CustomEvent('open-create-fund'))
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                New Fund
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
