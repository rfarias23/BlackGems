'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartWrapper, ChartEmptyState } from './chart-wrapper'
import { getChartPalette, type ChartTheme } from './chart-colors'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PerformanceDataPoint {
  date: string
  moic?: number
  tvpi?: number
  dpi?: number
}

interface FundPerformanceChartProps {
  data: PerformanceDataPoint[]
  theme?: ChartTheme
  height?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FundPerformanceChart({
  data,
  theme = 'dark',
  height = 300,
}: FundPerformanceChartProps) {
  const palette = getChartPalette(theme)

  if (!data.length) {
    return (
      <ChartEmptyState message="No performance data" theme={theme} />
    )
  }

  return (
    <ChartWrapper height={height}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.gridLine} />
        <XAxis
          dataKey="date"
          tick={{ fill: palette.axisText, fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: palette.axisText, fontSize: 12 }}
          tickFormatter={(v) => `${v.toFixed(1)}x`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: 8,
            color: palette.tooltipText,
          }}
          formatter={(value, name) => [
            `${Number(value).toFixed(2)}x`,
            String(name || '').toUpperCase(),
          ]}
        />
        <Legend
          wrapperStyle={{ color: palette.axisText, fontSize: 12 }}
          formatter={(value) => value.toUpperCase()}
        />
        <Line
          type="monotone"
          dataKey="moic"
          stroke={palette.primary}
          strokeWidth={2}
          dot={{ fill: palette.primary, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="tvpi"
          stroke={palette.secondary}
          strokeWidth={2}
          dot={{ fill: palette.secondary, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="dpi"
          stroke={palette.quaternary}
          strokeWidth={2}
          dot={{ fill: palette.quaternary, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartWrapper>
  )
}
