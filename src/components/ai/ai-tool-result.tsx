'use client'

import type { DynamicToolUIPart } from 'ai'

// ---------------------------------------------------------------------------
// Typed tool result shapes (match the server-side tool return types)
// ---------------------------------------------------------------------------

interface PipelineStageSummary {
  stage: string
  count: number
  value: number
}

interface PipelineSummaryResult {
  stages: PipelineStageSummary[]
  totalDeals: number
  totalPipelineValue: number
}

interface DealDetailsResult {
  name: string
  stage: string
  askingPrice: number | null
  revenue: number | null
  ebitda: number | null
  multiple: number | null
}

interface FundFinancialsResult {
  totalCommitted: number
  totalCalled: number
  totalDistributed: number
  moic: number | null
  irr: number | null
  nav: number
}

interface InvestorDetailsResult {
  name: string
  type: string
  commitment: number
  paidIn: number
  unfunded: number
}

interface PortfolioCompanyMetric {
  name: string
  revenue: number | null
  ebitda: number | null
  moic: number | null
}

interface PortfolioMetricsResult {
  companies: PortfolioCompanyMetric[]
  totalInvested: number
  totalNav: number
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '--'
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}

function formatMultiple(value: number | null | undefined): string {
  if (value == null) return '--'
  return `${value.toFixed(2)}x`
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '--'
  return `${(value * 100).toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// Stage badge color mapping
// ---------------------------------------------------------------------------

const STAGE_COLORS: Record<string, string> = {
  SOURCING: '#3E5CFF',
  SCREENING: '#6366F1',
  DUE_DILIGENCE: '#8B5CF6',
  LOI: '#A855F7',
  CLOSING: '#059669',
  CLOSED: '#047857',
  PASSED: '#64748B',
  DEAD: '#64748B',
}

function StageBadge({ stage }: { stage: string }) {
  const color = STAGE_COLORS[stage] ?? '#64748B'
  const label = stage.replace(/_/g, ' ')

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Metric cell
// ---------------------------------------------------------------------------

function MetricCell({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
        {label}
      </span>
      <span className="font-mono tabular-nums text-sm text-[#F8FAFC]">
        {value}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tool-specific renderers
// ---------------------------------------------------------------------------

function PipelineSummary({ data }: { data: PipelineSummaryResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
          Pipeline Overview
        </span>
        <span className="font-mono tabular-nums text-xs text-[#F8FAFC]">
          {data.totalDeals} deals
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {data.stages.map((s) => (
          <div key={s.stage} className="flex flex-col items-center gap-0.5">
            <StageBadge stage={s.stage} />
            <span className="font-mono tabular-nums text-xs text-[#F8FAFC]">
              {s.count}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-[#1E293B] pt-2">
        <MetricCell
          label="Total Pipeline Value"
          value={formatCurrency(data.totalPipelineValue)}
        />
      </div>
    </div>
  )
}

function DealDetails({ data }: { data: DealDetailsResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#F8FAFC] truncate">
          {data.name}
        </span>
        <StageBadge stage={data.stage} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCell label="Asking Price" value={formatCurrency(data.askingPrice)} />
        <MetricCell label="Revenue" value={formatCurrency(data.revenue)} />
        <MetricCell label="EBITDA" value={formatCurrency(data.ebitda)} />
        <MetricCell label="Multiple" value={formatMultiple(data.multiple)} />
      </div>
    </div>
  )
}

function FundFinancials({ data }: { data: FundFinancialsResult }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
        Fund Financials
      </span>
      <div className="grid grid-cols-2 gap-3">
        <MetricCell label="Committed" value={formatCurrency(data.totalCommitted)} />
        <MetricCell label="Called" value={formatCurrency(data.totalCalled)} />
        <MetricCell label="Distributed" value={formatCurrency(data.totalDistributed)} />
        <MetricCell label="MOIC" value={formatMultiple(data.moic)} />
        <MetricCell label="IRR" value={formatPercent(data.irr)} />
        <MetricCell label="NAV" value={formatCurrency(data.nav)} />
      </div>
    </div>
  )
}

function InvestorDetails({ data }: { data: InvestorDetailsResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#F8FAFC] truncate">
          {data.name}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
          {data.type}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MetricCell label="Commitment" value={formatCurrency(data.commitment)} />
        <MetricCell label="Paid-In" value={formatCurrency(data.paidIn)} />
        <MetricCell label="Unfunded" value={formatCurrency(data.unfunded)} />
      </div>
    </div>
  )
}

function PortfolioMetrics({ data }: { data: PortfolioMetricsResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
          Portfolio
        </span>
        <span className="font-mono tabular-nums text-xs text-[#F8FAFC]">
          {data.companies.length} companies
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E293B]">
              <th className="pb-1 text-left text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
                Company
              </th>
              <th className="pb-1 text-right text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
                Revenue
              </th>
              <th className="pb-1 text-right text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
                EBITDA
              </th>
              <th className="pb-1 text-right text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
                MOIC
              </th>
            </tr>
          </thead>
          <tbody>
            {data.companies.map((c) => (
              <tr key={c.name} className="border-b border-[#1E293B]/50">
                <td className="py-1 text-[#E2E8F0]">{c.name}</td>
                <td className="py-1 text-right font-mono tabular-nums text-[#F8FAFC]">
                  {formatCurrency(c.revenue)}
                </td>
                <td className="py-1 text-right font-mono tabular-nums text-[#F8FAFC]">
                  {formatCurrency(c.ebitda)}
                </td>
                <td className="py-1 text-right font-mono tabular-nums text-[#F8FAFC]">
                  {formatMultiple(c.moic)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-[#1E293B] pt-2">
        <MetricCell label="Total Invested" value={formatCurrency(data.totalInvested)} />
        <MetricCell label="Total NAV" value={formatCurrency(data.totalNav)} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Generic fallback for unknown tools
// ---------------------------------------------------------------------------

function GenericToolResult({ toolName, data }: { toolName: string; data: unknown }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
        {toolName.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <pre className="text-xs text-[#94A3B8] whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading indicator for in-progress tool calls
// ---------------------------------------------------------------------------

function ToolLoading({ toolName }: { toolName: string }) {
  const label = toolName.replace(/([A-Z])/g, ' $1').trim()
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-1.5 rounded-full bg-[#3E5CFF] animate-pulse" />
      <span className="text-xs text-[#94A3B8]">
        Querying {label}...
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface AIToolResultProps {
  part: DynamicToolUIPart
}

export function AIToolResult({ part }: AIToolResultProps) {
  const toolName = part.toolName
  const isLoading =
    part.state === 'input-streaming' || part.state === 'input-available'

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-lg p-3 my-2">
      {isLoading ? (
        <ToolLoading toolName={toolName} />
      ) : part.state === 'output-available' ? (
        <ToolResultContent toolName={toolName} output={part.output} />
      ) : part.state === 'output-error' ? (
        <div className="text-xs text-red-400">
          Tool error: {part.errorText}
        </div>
      ) : (
        <ToolLoading toolName={toolName} />
      )}
    </div>
  )
}

function ToolResultContent({
  toolName,
  output,
}: {
  toolName: string
  output: unknown
}) {
  const data = output as Record<string, unknown>

  switch (toolName) {
    case 'getPipelineSummary':
      return <PipelineSummary data={data as unknown as PipelineSummaryResult} />
    case 'getDealDetails':
      return <DealDetails data={data as unknown as DealDetailsResult} />
    case 'getFundFinancials':
      return <FundFinancials data={data as unknown as FundFinancialsResult} />
    case 'getInvestorDetails':
      return <InvestorDetails data={data as unknown as InvestorDetailsResult} />
    case 'getPortfolioMetrics':
      return <PortfolioMetrics data={data as unknown as PortfolioMetricsResult} />
    default:
      return <GenericToolResult toolName={toolName} data={data} />
  }
}
