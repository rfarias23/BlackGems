'use client'

import Link from 'next/link'

export function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#1E293B] border-b border-[#334155]">
      <p className="text-[13px] text-slate-400">
        <span className="font-mono text-slate-300">{daysRemaining}</span>
        {' '}day{daysRemaining !== 1 ? 's' : ''} remaining in your trial
      </p>
      <Link
        href="/settings?tab=billing"
        className="text-[13px] font-medium text-[#3E5CFF] hover:text-[#3350E0] transition-colors"
      >
        Upgrade
      </Link>
    </div>
  )
}
