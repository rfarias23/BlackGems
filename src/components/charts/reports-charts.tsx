'use client'

import { WaterfallChart, type WaterfallDataPoint } from './waterfall-chart'
import { MoicBarChart, type MoicDataPoint } from './moic-bar-chart'
import { SectorAllocationChart, type SectorDataPoint } from './sector-allocation-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartTheme } from './chart-colors'

// ---------------------------------------------------------------------------
// Fund Performance Charts (Waterfall + IRR cards)
// ---------------------------------------------------------------------------

interface FundPerformanceChartsProps {
  waterfallData: WaterfallDataPoint[] | null
  grossIrr: string | null
  netIrr: string | null
  theme?: ChartTheme
}

export function FundPerformanceCharts({
  waterfallData,
  grossIrr,
  netIrr,
  theme = 'dark',
}: FundPerformanceChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* IRR Cards */}
      <Card>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-primary' : 'text-slate-900'}>
            Internal Rate of Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'}`}>
                Gross IRR
              </p>
              <p className="text-3xl font-bold text-emerald-500">
                {grossIrr || 'N/A'}
              </p>
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-slate-500'}`}>
                Net IRR
              </p>
              <p className="text-3xl font-bold text-emerald-500">
                {netIrr || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Chart */}
      {waterfallData && waterfallData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-primary' : 'text-slate-900'}>
              Distribution Waterfall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WaterfallChart data={waterfallData} theme={theme} height={220} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Portfolio Charts (MOIC Bar + Sector Pie)
// ---------------------------------------------------------------------------

interface PortfolioChartsProps {
  moicData: MoicDataPoint[]
  sectorData: SectorDataPoint[]
  theme?: ChartTheme
}

export function PortfolioCharts({
  moicData,
  sectorData,
  theme = 'dark',
}: PortfolioChartsProps) {
  if (!moicData.length && !sectorData.length) return null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {moicData.length > 0 && (
        <Card className={theme === 'light' ? 'bg-white border-slate-200' : ''}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-primary' : 'text-slate-900'}>
              MOIC by Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MoicBarChart data={moicData} theme={theme} height={250} />
          </CardContent>
        </Card>
      )}
      {sectorData.length > 0 && (
        <Card className={theme === 'light' ? 'bg-white border-slate-200' : ''}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-primary' : 'text-slate-900'}>
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SectorAllocationChart data={sectorData} theme={theme} height={250} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
