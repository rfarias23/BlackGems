'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToCSV, type CSVColumn } from '@/lib/csv/export'

// ---------------------------------------------------------------------------
// Fund Performance Export
// ---------------------------------------------------------------------------

interface FundPerformanceExportData {
  metric: string
  value: string
}

export function ExportFundPerformance({
  data,
}: {
  data: FundPerformanceExportData[]
}) {
  const columns: CSVColumn<FundPerformanceExportData>[] = [
    { header: 'Metric', accessor: 'metric' },
    { header: 'Value', accessor: 'value' },
  ]

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        exportToCSV(
          `fund-performance-${new Date().toISOString().slice(0, 10)}`,
          columns,
          data
        )
      }
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Portfolio Summary Export
// ---------------------------------------------------------------------------

interface PortfolioExportData {
  name: string
  industry: string
  acquired: string
  holdMonths: number
  invested: string
  value: string
  moic: string
  irr: string
  status: string
}

export function ExportPortfolioSummary({
  data,
}: {
  data: PortfolioExportData[]
}) {
  const columns: CSVColumn<PortfolioExportData>[] = [
    { header: 'Company', accessor: 'name' },
    { header: 'Industry', accessor: 'industry' },
    { header: 'Acquired', accessor: 'acquired' },
    { header: 'Hold (months)', accessor: 'holdMonths' },
    { header: 'Invested', accessor: 'invested' },
    { header: 'Current Value', accessor: 'value' },
    { header: 'MOIC', accessor: 'moic' },
    { header: 'IRR', accessor: 'irr' },
    { header: 'Status', accessor: 'status' },
  ]

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        exportToCSV(
          `portfolio-summary-${new Date().toISOString().slice(0, 10)}`,
          columns,
          data
        )
      }
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Deal Pipeline Export
// ---------------------------------------------------------------------------

interface DealExportData {
  name: string
  stage: string
  askingPrice: string
  lastUpdated: string
}

export function ExportDealPipeline({
  data,
}: {
  data: DealExportData[]
}) {
  const columns: CSVColumn<DealExportData>[] = [
    { header: 'Deal', accessor: 'name' },
    { header: 'Stage', accessor: 'stage' },
    { header: 'Asking Price', accessor: 'askingPrice' },
    { header: 'Last Updated', accessor: 'lastUpdated' },
  ]

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        exportToCSV(
          `deal-pipeline-${new Date().toISOString().slice(0, 10)}`,
          columns,
          data
        )
      }
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  )
}
