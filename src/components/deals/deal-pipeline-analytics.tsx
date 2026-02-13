import { PipelineAnalytics } from '@/lib/actions/deals'
import { formatCurrency } from '@/lib/shared/formatters'

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
    const maxCount = Math.max(...analytics.stages.map((s) => s.count), 1)

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
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Stage Funnel
                </h3>
                <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                    {analytics.stages.map((s) => {
                        const barWidth = Math.max((s.count / maxCount) * 100, 4)
                        const formattedValue = formatCurrency(s.totalValue)
                        const formattedDays = s.avgDaysInStage !== null
                            ? `${s.avgDaysInStage}d`
                            : '\u2014'

                        return (
                            <div key={s.stage} className="flex items-center gap-3">
                                <span className="w-28 text-right text-xs text-muted-foreground shrink-0">
                                    {s.stage}
                                </span>
                                <div className="flex-1 h-7 rounded bg-border/30 overflow-hidden">
                                    <div
                                        className="h-full rounded transition-all duration-200"
                                        style={{
                                            width: `${barWidth}%`,
                                            backgroundColor: '#334155',
                                        }}
                                    />
                                </div>
                                <span className="w-8 text-right font-mono tabular-nums text-sm text-foreground shrink-0">
                                    {s.count}
                                </span>
                                <span className="w-24 text-right font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                                    {formattedValue ?? '\u2014'}
                                </span>
                                <span className="w-12 text-right font-mono tabular-nums text-xs text-muted-foreground shrink-0">
                                    {formattedDays}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Section 3: Conversion Metrics */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Conversion Metrics
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard
                        label="Closed Won"
                        value={String(analytics.closedWon)}
                    />
                    <MetricCard
                        label="Closed Lost"
                        value={String(analytics.closedLost)}
                    />
                    <MetricCard
                        label="Conversion Rate"
                        value={analytics.conversionRate}
                    />
                </div>
            </section>
        </div>
    )
}
