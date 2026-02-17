'use client'

import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { ChartWrapper, ChartEmptyState } from './chart-wrapper'
import { getChartPalette, type ChartTheme } from './chart-colors'
import { formatCompact, type CurrencyCode } from '@/lib/shared/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectorDataPoint {
  name: string
  value: number
}

interface SectorAllocationChartProps {
  data: SectorDataPoint[]
  theme?: ChartTheme
  height?: number
  currency?: CurrencyCode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectorAllocationChart({
  data,
  theme = 'dark',
  height = 300,
  currency,
}: SectorAllocationChartProps) {
  const palette = getChartPalette(theme)

  if (!data.length) {
    return <ChartEmptyState message="No sector data" theme={theme} />
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <ChartWrapper height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={palette.series[index % palette.series.length]}
            />
          ))}
        </Pie>
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
            `${formatCompact(Number(value), currency)} (${((Number(value) / total) * 100).toFixed(1)}%)`,
            String(name || ''),
          ]}
        />
        <Legend
          wrapperStyle={{ color: palette.axisText, fontSize: 12 }}
          layout="vertical"
          align="right"
          verticalAlign="middle"
        />
      </PieChart>
    </ChartWrapper>
  )
}
