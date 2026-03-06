import { DealAnalytics } from '@/lib/actions/deals'
import { PIPELINE_DISPLAY_STAGES } from '@/lib/shared/stage-transitions'

interface MetricCardProps {
    label: string
    value: string | null
    variant?: 'default' | 'currency' | 'percentage' | 'multiple' | 'days'
}

function MetricCard({ label, value, variant = 'default' }: MetricCardProps) {
    const isPercentage = variant === 'percentage'
    const isDays = variant === 'days'

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {label}
            </p>
            <p
                className={`text-xl font-semibold font-mono tabular-nums ${
                    isPercentage && value
                        ? 'text-[#059669]'
                        : isDays && value
                            ? 'text-foreground'
                            : value
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                }`}
            >
                {value ?? '\u2014'}
            </p>
        </div>
    )
}

interface DealAnalyticsTabProps {
    analytics: DealAnalytics
}

export function DealAnalyticsTab({ analytics }: DealAnalyticsTabProps) {
    const displayIdx = PIPELINE_DISPLAY_STAGES.indexOf(analytics.stage as typeof PIPELINE_DISPLAY_STAGES[number])
    const progressPercent = displayIdx >= 0
        ? Math.round((displayIdx / (PIPELINE_DISPLAY_STAGES.length - 1)) * 100)
        : 0

    return (
        <div className="space-y-8">
            {/* Section 1: Financial Overview */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Financial Overview
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard label="Revenue" value={analytics.revenue} variant="currency" />
                    <MetricCard label="EBITDA" value={analytics.ebitda} variant="currency" />
                    <MetricCard label="Gross Profit" value={analytics.grossProfit} variant="currency" />
                    <MetricCard label="Net Income" value={analytics.netIncome} variant="currency" />
                </div>
            </section>

            {/* Section 2: Valuation Metrics */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Valuation Metrics
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard label="Asking Price" value={analytics.askingPrice} variant="currency" />
                    <MetricCard label="Revenue Multiple" value={analytics.revenueMultiple} variant="multiple" />
                    <MetricCard label="EBITDA Multiple" value={analytics.ebitdaMultiple} variant="multiple" />
                </div>
            </section>

            {/* Section 3: Margin Analysis */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Margin Analysis
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard label="EBITDA Margin" value={analytics.ebitdaMargin} variant="percentage" />
                    <MetricCard label="Gross Margin" value={analytics.grossMargin} variant="percentage" />
                    <MetricCard label="Net Margin" value={analytics.netMargin} variant="percentage" />
                </div>
            </section>

            {/* Section 4: Pipeline Timeline */}
            <section>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Pipeline Timeline
                </h3>

                {/* Stage Progress — named milestones */}
                <div className="rounded-lg border border-border bg-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-foreground">
                            {analytics.stage}
                        </span>
                        {analytics.daysInPipeline !== null && (
                            <span className="text-xs font-mono tabular-nums text-muted-foreground">
                                {analytics.daysInPipeline}d in pipeline
                            </span>
                        )}
                    </div>
                    <div className="relative flex items-center justify-between">
                        {/* Connecting line */}
                        <div className="absolute top-2 left-0 right-0 h-0.5 bg-border" />
                        <div
                            className="absolute top-2 left-0 h-0.5 transition-all duration-300"
                            style={{
                                width: `${progressPercent}%`,
                                backgroundColor: '#3E5CFF',
                            }}
                        />
                        {/* Stage dots */}
                        {PIPELINE_DISPLAY_STAGES.map((stageName, i) => {
                            const isActive = i === displayIdx
                            const isCompleted = displayIdx >= 0 && i < displayIdx
                            return (
                                <div key={stageName} className="relative flex flex-col items-center z-10">
                                    <div
                                        className={`rounded-full border-2 transition-colors ${
                                            isActive
                                                ? 'w-4 h-4 bg-[#3E5CFF] border-[#3E5CFF] ring-2 ring-[#3E5CFF]/30 ring-offset-1 ring-offset-card'
                                                : isCompleted
                                                    ? 'w-4 h-4 bg-[#3E5CFF] border-[#3E5CFF]'
                                                    : 'w-4 h-4 bg-card border-border'
                                        }`}
                                    />
                                    <span
                                        className={`absolute top-6 text-[10px] whitespace-nowrap ${
                                            isActive ? 'text-[#3E5CFF] font-medium' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {stageName}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    {/* Spacer for stage labels below dots */}
                    <div className="h-8" />
                </div>

                {/* Timeline Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <MetricCard
                        label="Days in Pipeline"
                        value={analytics.daysInPipeline !== null ? String(analytics.daysInPipeline) : null}
                        variant="days"
                    />
                    <MetricCard
                        label="Days to NDA"
                        value={analytics.daysToNDA !== null ? String(analytics.daysToNDA) : null}
                        variant="days"
                    />
                    <MetricCard
                        label="Days to LOI"
                        value={analytics.daysToLOI !== null ? String(analytics.daysToLOI) : null}
                        variant="days"
                    />
                    <MetricCard
                        label="Days to Close"
                        value={analytics.daysToClose !== null ? String(analytics.daysToClose) : null}
                        variant="days"
                    />
                    <MetricCard
                        label="Expected Remaining"
                        value={analytics.expectedDaysRemaining !== null ? String(analytics.expectedDaysRemaining) : null}
                        variant="days"
                    />
                </div>
            </section>
        </div>
    )
}
