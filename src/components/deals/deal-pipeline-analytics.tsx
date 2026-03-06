import { PipelineAnalytics, DisplayStage } from '@/lib/actions/deals'
import { formatMoney } from '@/lib/shared/formatters'

/** Brand-compliant stage color: sapphire for active, emerald for won, slate for lost */
const STAGE_COLOR: Record<DisplayStage, string> = {
    Identified: '#3E5CFF',
    'Initial Review': '#3E5CFF',
    'NDA Signed': '#3E5CFF',
    'IOI Submitted': '#3E5CFF',
    'Due Diligence': '#3E5CFF',
    'LOI Negotiation': '#3E5CFF',
    Closing: '#3E5CFF',
}

const WON_COLOR = '#059669'
const LOST_COLOR = '#475569'

const MIN_WIDTH_PCT = 30
const MAX_WIDTH_PCT = 100

function getWidthPct(count: number, maxCount: number): number {
    if (count === 0) return MIN_WIDTH_PCT
    return MIN_WIDTH_PCT + ((count / maxCount) * (MAX_WIDTH_PCT - MIN_WIDTH_PCT))
}

/** Convert hex #RRGGBB to rgba() at a given alpha */
function hexRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
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
                            ? `${analytics.avgDaysInPipeline}d`
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
                    <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                        Stage Funnel
                    </h3>
                    <div className="flex items-center gap-8 text-xs font-mono text-muted-foreground">
                        <span>VALUE</span>
                        <span>AVG</span>
                    </div>
                </div>

                {/* Funnel — centered, proportional width */}
                <div className="flex flex-col items-center gap-1.5 mb-8">
                    {analytics.stages.map((s) => {
                        const widthPct = getWidthPct(s.count, maxCount)
                        const hasDeals = s.count > 0
                        const color = STAGE_COLOR[s.stage]
                        const formattedValue = hasDeals
                            ? formatMoney(s.totalValue, analytics.currency)
                            : null
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
                                    className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-default"
                                    style={{
                                        backgroundColor: hasDeals
                                            ? hexRgba(color, 0.12)
                                            : 'rgba(30, 41, 59, 0.25)',
                                        borderColor: hasDeals
                                            ? hexRgba(color, 0.30)
                                            : 'rgba(51, 65, 85, 0.3)',
                                        opacity: hasDeals ? 1 : 0.4,
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: hasDeals ? color : '#334155' }}
                                        />
                                        <span className={`text-sm font-medium truncate ${hasDeals ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {s.stage}
                                        </span>
                                        {hasDeals && (
                                            <span
                                                className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-xs font-mono font-semibold text-foreground flex-shrink-0"
                                                style={{ backgroundColor: hexRgba(color, 0.25) }}
                                            >
                                                {s.count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-5 flex-shrink-0">
                                        <span className={`text-sm font-mono tabular-nums ${hasDeals ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {formattedValue ?? '\u2014'}
                                        </span>
                                        <span className={`text-xs font-mono tabular-nums w-6 text-right text-muted-foreground ${hasDeals ? '' : 'opacity-40'}`}>
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
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                        Outcomes
                    </span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                {/* Closed Won / Closed Lost */}
                <div className="grid grid-cols-2 gap-2 px-4">
                    {([
                        { name: 'Closed Won' as const, count: analytics.closedWon, color: WON_COLOR },
                        { name: 'Closed Lost' as const, count: analytics.closedLost, color: LOST_COLOR },
                    ]).map((stage) => {
                        const hasDeals = stage.count > 0
                        return (
                            <div
                                key={stage.name}
                                className="flex items-center justify-between px-4 py-3 rounded-xl border"
                                style={{
                                    backgroundColor: hasDeals
                                        ? hexRgba(stage.color, 0.08)
                                        : 'rgba(30, 41, 59, 0.25)',
                                    borderColor: hasDeals
                                        ? hexRgba(stage.color, 0.25)
                                        : 'rgba(51, 65, 85, 0.3)',
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: hasDeals ? stage.color : '#334155' }}
                                    />
                                    <span className={`text-sm font-medium ${hasDeals ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {stage.name}
                                    </span>
                                    {hasDeals && (
                                        <span
                                            className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md text-xs font-mono font-semibold text-foreground"
                                            style={{ backgroundColor: hexRgba(stage.color, 0.20) }}
                                        >
                                            {stage.count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Conversion footer */}
                <div className="mt-4 px-4 flex justify-end">
                    <span className="text-xs font-mono text-muted-foreground">
                        Conversion: {analytics.closedWon}/{analytics.totalDeals} = {analytics.conversionRate ?? '0%'}
                    </span>
                </div>
            </section>
        </div>
    )
}
