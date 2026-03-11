'use client'

import { useState } from 'react'
import { approveAgentAction, rejectAgentAction } from '@/lib/actions/agent-actions'

interface AIApprovalCardProps {
  actionId: string
  tool: string
  summary: string
  details: Record<string, string>
}

const TOOL_LABELS: Record<string, string> = {
  'update-deal-stage': 'DEAL UPDATE',
  'log-meeting-note': 'MEETING LOG',
  'draft-lp-update': 'LP UPDATE DRAFT',
}

type CardStatus = 'pending' | 'executing' | 'approved' | 'rejected'

export function AIApprovalCard({ actionId, tool, summary, details }: AIApprovalCardProps) {
  const [status, setStatus] = useState<CardStatus>('pending')
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setStatus('executing')
    setError(null)
    const result = await approveAgentAction(actionId)
    if ('error' in result) {
      setError(result.error)
      setStatus('pending')
      return
    }
    setStatus('approved')
  }

  async function handleReject() {
    const result = await rejectAgentAction(actionId)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setStatus('rejected')
  }

  // Collapsed states
  if (status === 'approved') {
    return (
      <div className="bg-[#1E293B]/50 border border-[#334155] rounded-lg px-4 py-2 my-2">
        <span className="text-sm text-[#94A3B8]">Executed — {summary}</span>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="bg-[#1E293B]/30 border border-[#334155]/50 rounded-lg px-4 py-2 my-2">
        <span className="text-sm text-[#64748B]">Cancelled</span>
      </div>
    )
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg my-2 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <span className="text-[10px] tracking-wider uppercase text-[#64748B] font-medium">
          {TOOL_LABELS[tool] ?? tool}
        </span>
      </div>

      {/* Summary */}
      <div className="px-4 pb-2">
        <p className="text-sm text-white">{summary}</p>
      </div>

      {/* Details */}
      <div className="px-4 pb-3">
        <div className="space-y-1">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-[#94A3B8]">{key}</span>
              <span className="text-white font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {status === 'executing' ? (
          <div className="h-8 flex-1 rounded bg-[#334155] animate-pulse" />
        ) : (
          <>
            <button
              onClick={handleApprove}
              className="px-4 py-1.5 rounded text-sm font-medium bg-[#3E5CFF] text-white hover:bg-[#5A75FF] transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-1.5 rounded text-sm font-medium border border-[#334155] text-[#94A3B8] hover:border-[#475569] transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
