'use client'

import {
  BarChart,
  Bar,
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

export interface CapitalAccountDataPoint {
  name: string
  committed: number
  called: number
  distributed: number
}

interface CapitalAccountChartProps {
  data: CapitalAccountDataPoint[]
  theme?: ChartTheme
  height?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export function CapitalAccountChart({
  data,
  theme = 'dark',
  height = 300,
}: CapitalAccountChartProps) {
  const palette = getChartPalette(theme)

  if (!data.length) {
    return <ChartEmptyState message="No capital account data" theme={theme} />
  }

  return (
    <ChartWrapper height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={palette.gridLine}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fill: palette.axisText, fontSize: 12 }}
          tickFormatter={formatCurrency}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: palette.axisText, fontSize: 12 }}
          width={75}
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
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              committed: 'Committed',
              called: 'Called',
              distributed: 'Distributed',
            }
            const key = String(name || '')
            return [formatCurrency(Number(value)), labels[key] || key]
          }}
        />
        <Legend
          wrapperStyle={{ color: palette.axisText, fontSize: 12 }}
          formatter={(value) => {
            const labels: Record<string, string> = {
              committed: 'Committed',
              called: 'Called',
              distributed: 'Distributed',
            }
            return labels[value] || value
          }}
        />
        <Bar
          dataKey="committed"
          fill={palette.neutral}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
        />
        <Bar
          dataKey="called"
          fill={palette.primary}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
        />
        <Bar
          dataKey="distributed"
          fill={palette.quaternary}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ChartWrapper>
  )
}
