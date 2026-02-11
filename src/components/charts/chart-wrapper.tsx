'use client'

import { ResponsiveContainer } from 'recharts'
import type { ChartTheme } from './chart-colors'

// ---------------------------------------------------------------------------
// Chart Wrapper
// ---------------------------------------------------------------------------

interface ChartWrapperProps {
  children: React.ReactNode
  theme?: ChartTheme
  height?: number
  className?: string
}

/**
 * Responsive chart wrapper that handles sizing and theme context.
 * All chart components should be wrapped in this.
 */
export function ChartWrapper({
  children,
  height = 300,
  className = '',
}: ChartWrapperProps) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

interface ChartEmptyStateProps {
  message?: string
  theme?: ChartTheme
}

export function ChartEmptyState({
  message = 'No data available',
  theme = 'dark',
}: ChartEmptyStateProps) {
  return (
    <div
      className={`flex items-center justify-center h-full rounded-lg border ${
        theme === 'dark'
          ? 'border-slate-700 bg-slate-800/50 text-slate-400'
          : 'border-slate-200 bg-slate-50 text-slate-500'
      }`}
    >
      <p className="text-sm">{message}</p>
    </div>
  )
}
