import { PipelineAnalytics } from '@/lib/actions/deals'
import { formatCurrency } from '@/lib/shared/formatters'

const STAGE_COLORS: Record<string, string> = {
    Identified: '#475569',
    'Initial Review': '#3b82f6',
    'NDA Signed': '#6366f1',
    'IOI Submitted': '#8b5cf6',
    'Due Diligence': '#0ea5e9',
    'LOI Negotiation': '#14b8a6',
    Closing: '#10b981',
}

const MIN_WIDTH_PCT = 30
const MAX_WIDTH_PCT = 100

function getWidthPct(count: number, maxCount: number): number {
    if (count === 0) return MIN_WIDTH_PCT
    return MIN_WIDTH_PCT + ((count / maxCount) * (MAX_WIDTH_PCT - MIN_WIDTH_PCT))
}

function MetricCard({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {label}
            </p>
            <p className={`text-xl font-semibold font-mono tabular-nums ${
                value ? 'text-foreground' : 'text-muted-foreground'
            }`}>
                {value ?? '\u2014'}
            </p>
        </div>
    )
}

interface DealPipelineAnalyticsProps {
    analytics: PipelineAnalytics
}

export function DealPipelineAnalytics({ analytics }: DealPipelineAnalyticsProps) {
    const maxCount = Math.max(...analytics.stages.map(s => s.count), 1)
    const totalDeals = analytics.stages.reduce((sum, s) => sum + s.count, 0)
        + analytics.closedWon + analytics.closedLost

    return (
        <div className="space-y-8">
            {/* Section 1: Pipeline Overview */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Pipeline Overview
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Active Deals"
                        value={String(analytics.totalActiveDeals)}
                    />
                    <MetricCard
                        label="Pipeline Value"
                        value={analytics.totalPipelineValue}
                    />
                    <MetricCard
                        label="Avg Days in Pipeline"
                        value={analytics.avgDaysInPipeline !== null
                            ? String(analytics.avgDaysInPipeline)
                            : null}
                    />
                    <MetricCard
                        label="Win Rate"
                        value={analytics.winRate}
                    />
                </div>
            </section>

            {/* Section 2: Stage Funnel */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#94a3b8' }}>
                        Stage Funnel
                    </h3>
                    <div className="flex items-center gap-8 text-xs font-mono" style={{ color: '#64748b' }}>
                        <span>VALUE</span>
                        <span>AVG</span>
                    </div>
                </div>

                {/* Funnel — centered, proportional width */}
                <div className="flex flex-col items-center gap-1.5 mb-8">
                    {analytics.stages.map((s) => {
                        const widthPct = getWidthPct(s.count, maxCount)
                        const hasDeals = s.count > 0
                        const color = STAGE_COLORS[s.stage] || '#475569'
                        const formattedValue = formatCurrency(s.totalValue)
                        const formattedDays = s.avgDaysInStage !== null
                            ? `${s.avgDaysInStage}d`
                            : '\u2014'

                        return (
                            <div
                                key={s.stage}
                                className="transition-all duration-500 ease-out"
                                style={{ width: `${widthPct}%` }}
                            >
                                <div
                                    className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-default transition-all duration-200 hover:scale-[1.01]"
                                    style={{
                                        backgroundColor: hasDeals
                                            ? `color-mix(in srgb, ${color} 12%, #0f172a)`
                                            : 'rgba(30, 41, 59, 0.25)',
                                        borderColor: hasDeals
                                            ? `color-mix(in srgb, ${color} 30%, transparent)`
                                            : 'rgba(51, 65, 85, 0.3)',
                                        opacity: hasDeals ? 1 : 0.4,
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: hasDeals ? color : '#334155' }}
                                        />
                                        <span
                                            className="text-sm font-medium truncate"
                                            style={{ color: hasDeals ? '#e2e8f0' : '#64748b' }}
                                        >
                                            {s.stage}
                                        </span>
                                        {hasDeals && (
                                            <span
                                                className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-xs font-mono font-semibold flex-shrink-0"
                                                style={{
                                                    backgroundColor: `color-mix(in srgb, ${color} 25%, transparent)`,
                                                    color: '#e2e8f0',
                                                }}
                                            >
                                                {s.count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-5 flex-shrink-0">
                                        <span
                                            className="text-sm font-mono tabular-nums"
                                            style={{ color: hasDeals ? '#cbd5e1' : '#334155' }}
                                        >
                                            {formattedValue ?? '\u2014'}
                                        </span>
                                        <span
                                            className="text-xs font-mono tabular-nums w-6 text-right"
                                            style={{ color: hasDeals ? '#94a3b8' : '#334155' }}
                                        >
                                            {formattedDays}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Outcomes divider */}
                <div className="flex items-center gap-3 mb-4 px-4">
                    <div className="h-px flex-1" style={{ backgroundColor: '#1e293b' }} />
                    <span
                        className="text-[10px] font-semibold tracking-widest uppercase"
                        style={{ color: '#475569' }}
                    >
                        Outcomes
                    </span>
                    <div className="h-px flex-1" style={{ backgroundColor: '#1e293b' }} />
                </div>

                {/* Closed Won / Closed Lost */}
                <div className="grid grid-cols-2 gap-2 px-4">
                    {([
                        { name: 'Closed Won', count: analytics.closedWon, color: '#059669', badgeColor: '#6ee7b7' },
                        { name: 'Closed Lost', count: analytics.closedLost, color: '#ef4444', badgeColor: '#fca5a5' },
                    ] as const).map((stage) => {
                        const hasDeals = stage.count > 0
                        return (
                            <div
                                key={stage.name}
                                className="flex items-center justify-between px-4 py-3 rounded-xl border"
                                style={{
                                    backgroundColor: hasDeals
                                        ? `color-mix(in srgb, ${stage.color} 8%, #0f172a)`
                                        : 'rgba(30, 41, 59, 0.25)',
                                    borderColor: hasDeals
                                        ? `color-mix(in srgb, ${stage.color} 25%, transparent)`
                                        : 'rgba(51, 65, 85, 0.3)',
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: hasDeals ? stage.color : '#334155' }}
                                    />
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: hasDeals ? '#e2e8f0' : '#64748b' }}
                                    >
                                        {stage.name}
                                    </span>
                                    {hasDeals && (
                                        <span
                                            className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-xs font-mono font-semibold"
                                            style={{
                                                backgroundColor: `color-mix(in srgb, ${stage.color} 20%, transparent)`,
                                                color: stage.badgeColor,
                                            }}
                                        >
                                            {stage.count}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className="text-sm font-mono tabular-nums"
                                    style={{ color: hasDeals ? '#cbd5e1' : '#334155' }}
                                >
                                    {stage.count}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Conversion footer */}
                {totalDeals > 0 && (
                    <div className="mt-4 px-4 flex justify-end">
                        <span className="text-xs font-mono" style={{ color: '#64748b' }}>
                            Conversion: {analytics.closedWon}/{totalDeals} = {analytics.conversionRate ?? '0%'}
                        </span>
                    </div>
                )}
            </section>
        </div>
    )
}
