'use client'

import { MoicBarChart, type MoicDataPoint } from './moic-bar-chart'
import { SectorAllocationChart, type SectorDataPoint } from './sector-allocation-chart'
import { CapitalDeploymentChart, type CapitalTimelinePoint } from './capital-deployment-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardChartsProps {
  moicByCompany: MoicDataPoint[]
  sectorAllocation: SectorDataPoint[]
  capitalTimeline: CapitalTimelinePoint[]
  fundIrr: number | null
}

export function DashboardCharts({
  moicByCompany,
  sectorAllocation,
  capitalTimeline,
  fundIrr,
}: DashboardChartsProps) {
  return (
    <>
      {/* IRR Card + MOIC Chart + Sector Allocation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary">MOIC by Company</CardTitle>
              {fundIrr !== null && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Fund IRR</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {(fundIrr * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <MoicBarChart data={moicByCompany} theme="dark" height={250} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-primary">Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <SectorAllocationChart
              data={sectorAllocation}
              theme="dark"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Capital Deployment */}
      {capitalTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Capital Deployment</CardTitle>
          </CardHeader>
          <CardContent>
            <CapitalDeploymentChart
              data={capitalTimeline}
              theme="dark"
              height={280}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}
