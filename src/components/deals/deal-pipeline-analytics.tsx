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
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex gap-4">
                        {/* Funnel shape */}
                        <div className="flex-1 flex flex-col">
                            {analytics.stages.map((s, i) => {
                                const total = analytics.stages.length
                                const maxInset = 38
                                const topInset = (i / total) * maxInset
                                const bottomInset = ((i + 1) / total) * maxInset
                                const hasDeals = s.count > 0
                                const bgColor = hasDeals ? '#334155' : '#1E293B'

                                return (
                                    <div
                                        key={s.stage}
                                        className="relative flex items-center justify-center"
                                        style={{
                                            height: '40px',
                                            clipPath: `polygon(${topInset}% 0%, ${100 - topInset}% 0%, ${100 - bottomInset}% 100%, ${bottomInset}% 100%)`,
                                            backgroundColor: bgColor,
                                        }}
                                    >
                                        <span className="text-xs text-[#F8FAFC] font-medium z-10">
                                            {s.stage}
                                        </span>
                                        <span className="ml-2 text-xs font-mono tabular-nums text-[#94A3B8] z-10">
                                            ({s.count})
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Right-side metrics */}
                        <div className="flex flex-col shrink-0">
                            {analytics.stages.map((s) => {
                                const formattedValue = formatCurrency(s.totalValue)
                                const formattedDays = s.avgDaysInStage !== null
                                    ? `${s.avgDaysInStage}d`
                                    : '\u2014'

                                return (
                                    <div
                                        key={s.stage}
                                        className="flex items-center gap-4 justify-end"
                                        style={{ height: '40px' }}
                                    >
                                        <span className="w-24 text-right font-mono tabular-nums text-xs text-muted-foreground">
                                            {formattedValue ?? '\u2014'}
                                        </span>
                                        <span className="w-10 text-right font-mono tabular-nums text-xs text-muted-foreground">
                                            {formattedDays}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
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
