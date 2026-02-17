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
import { formatCompact, type CurrencyCode } from '@/lib/shared/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WaterfallDataPoint {
  name: string
  lpAmount: number
  gpAmount: number
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[]
  theme?: ChartTheme
  height?: number
  currency?: CurrencyCode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WaterfallChart({
  data,
  theme = 'dark',
  height = 300,
  currency,
}: WaterfallChartProps) {
  const palette = getChartPalette(theme)

  if (!data.length) {
    return <ChartEmptyState message="No waterfall data" theme={theme} />
  }

  return (
    <ChartWrapper height={height}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={palette.gridLine} />
        <XAxis
          dataKey="name"
          tick={{ fill: palette.axisText, fontSize: 11 }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
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
            name === 'lpAmount' ? 'LP Share' : 'GP Share',
          ]}
        />
        <Legend
          wrapperStyle={{ color: palette.axisText, fontSize: 12 }}
          formatter={(value) =>
            value === 'lpAmount' ? 'LP Share' : 'GP Share'
          }
        />
        <Bar
          dataKey="lpAmount"
          stackId="waterfall"
          fill={palette.primary}
          radius={[0, 0, 0, 0]}
          maxBarSize={60}
        />
        <Bar
          dataKey="gpAmount"
          stackId="waterfall"
          fill={palette.quaternary}
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ChartWrapper>
  )
}
