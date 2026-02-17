'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartWrapper, ChartEmptyState } from './chart-wrapper'
import { getChartPalette, type ChartTheme } from './chart-colors'
import { formatCompact, type CurrencyCode } from '@/lib/shared/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CapitalTimelinePoint {
  date: string // formatted label (e.g. "Q1 2023")
  called: number
  distributed: number
}

interface CapitalDeploymentChartProps {
  data: CapitalTimelinePoint[]
  theme?: ChartTheme
  height?: number
  currency?: CurrencyCode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CapitalDeploymentChart({
  data,
  theme = 'dark',
  height = 300,
  currency,
}: CapitalDeploymentChartProps) {
  const palette = getChartPalette(theme)

  if (!data.length) {
    return <ChartEmptyState message="No capital activity" theme={theme} />
  }

  return (
    <ChartWrapper height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="calledGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={palette.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={palette.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="distributedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={palette.quaternary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={palette.quaternary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.gridLine} />
        <XAxis
          dataKey="date"
          tick={{ fill: palette.axisText, fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: palette.axisText, fontSize: 12 }}
          tickFormatter={(v) => formatCompact(v, currency)}
        />
        <Tooltip
          cursor={false}
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: 8,
            color: palette.tooltipText,
          }}
          labelStyle={{ color: palette.tooltipText }}
          itemStyle={{ color: palette.tooltipText }}
          formatter={(value, name) => [
            formatCompact(Number(value), currency),
            name === 'called' ? 'Capital Called' : 'Distributed',
          ]}
        />
        <Legend
          wrapperStyle={{ color: palette.axisText, fontSize: 12 }}
          formatter={(value) =>
            value === 'called' ? 'Capital Called' : 'Distributed'
          }
        />
        <Area
          type="monotone"
          dataKey="called"
          stroke={palette.primary}
          fill="url(#calledGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="distributed"
          stroke={palette.quaternary}
          fill="url(#distributedGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartWrapper>
  )
}
