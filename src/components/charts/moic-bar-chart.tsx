'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts'
import { ChartWrapper, ChartEmptyState } from './chart-wrapper'
import { getChartPalette, type ChartTheme } from './chart-colors'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MoicDataPoint {
  name: string
  moic: number
}

interface MoicBarChartProps {
  data: MoicDataPoint[]
  theme?: ChartTheme
  height?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MoicBarChart({
  data,
  theme = 'dark',
  height = 300,
}: MoicBarChartProps) {
  const palette = getChartPalette(theme)

  if (!data.length) {
    return <ChartEmptyState message="No portfolio companies" theme={theme} />
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
          tickFormatter={(v) => `${v.toFixed(1)}x`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: palette.axisText, fontSize: 12 }}
          width={75}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: 8,
            color: palette.tooltipText,
          }}
          formatter={(value) => [`${Number(value).toFixed(2)}x`, 'MOIC']}
        />
        <ReferenceLine
          x={1}
          stroke={palette.neutral}
          strokeDasharray="3 3"
          label={{
            value: '1.0x',
            fill: palette.axisText,
            fontSize: 11,
          }}
        />
        <Bar dataKey="moic" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.moic >= 1 ? palette.positive : palette.negative}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  )
}
