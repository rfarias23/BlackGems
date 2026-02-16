import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { MetricItem } from '@/lib/actions/portfolio';
import { KPISparkline } from '@/components/portfolio/kpi-sparkline';

interface PortfolioKPIsProps {
    metrics: MetricItem[];
}

type TrendDirection = 'up' | 'down' | 'flat';

function parseVal(v: string): number {
    return parseFloat(v.replace(/[$,%x]/g, '').replace(/,/g, ''));
}

function getTrend(current: string | null, previous: string | null): TrendDirection {
    if (!current || !previous) return 'flat';
    const curr = parseVal(current);
    const prev = parseVal(previous);
    if (isNaN(curr) || isNaN(prev)) return 'flat';
    if (curr > prev) return 'up';
    if (curr < prev) return 'down';
    return 'flat';
}

function TrendIndicator({ direction }: { direction: TrendDirection }) {
    if (direction === 'up') {
        return <ArrowUp className="h-4 w-4 text-[#059669]" />;
    }
    if (direction === 'down') {
        return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
}

interface KPICardProps {
    label: string;
    currentValue: string | null;
    previousValue: string | null;
    subLabel?: string | null;
    sparklineData?: number[];
}

function KPICard({ label, currentValue, previousValue, subLabel, sparklineData }: KPICardProps) {
    const trend = getTrend(currentValue, previousValue);

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-2 flex items-center gap-2">
                <span className="text-xl font-mono tabular-nums text-foreground">
                    {currentValue || '\u2014'}
                </span>
                <TrendIndicator direction={trend} />
            </div>
            {subLabel && (
                <p className="mt-1 text-xs text-muted-foreground">{subLabel}</p>
            )}
            {previousValue && (
                <p className="mt-1 text-xs text-muted-foreground font-mono tabular-nums">
                    Prior: {previousValue}
                </p>
            )}
            {sparklineData && sparklineData.length > 1 && (
                <div className="mt-3 border-t border-border pt-3">
                    <KPISparkline data={sparklineData} />
                </div>
            )}
        </div>
    );
}

/**
 * Extracts sparkline data for a given KPI field from the metrics array.
 * Takes the most recent 6 entries (metrics are ordered DESC), reverses them
 * so the array runs oldest-to-newest, and parses each formatted value to a number.
 */
function extractSparklineData(
    metrics: MetricItem[],
    field: keyof MetricItem
): number[] {
    const recent = metrics.slice(0, 6).reverse();
    const values: number[] = [];

    for (const m of recent) {
        const raw = m[field];
        if (raw === null || raw === undefined) continue;
        if (typeof raw === 'number') {
            values.push(raw);
        } else if (typeof raw === 'string') {
            const parsed = parseVal(raw);
            if (!isNaN(parsed)) {
                values.push(parsed);
            }
        }
    }

    return values;
}

export function PortfolioKPIs({ metrics }: PortfolioKPIsProps) {
    if (metrics.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                    No KPI data recorded yet. Record metrics to track performance indicators.
                </p>
            </div>
        );
    }

    const latest = metrics[0];
    const previous = metrics.length > 1 ? metrics[1] : null;

    return (
        <div className="space-y-6">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
                Key Performance Indicators
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    label="Revenue"
                    currentValue={latest.revenue}
                    previousValue={previous?.revenue ?? null}
                    subLabel={latest.revenueGrowth ? `${latest.revenueGrowth} YoY` : null}
                    sparklineData={extractSparklineData(metrics, 'revenue')}
                />
                <KPICard
                    label="EBITDA"
                    currentValue={latest.ebitda}
                    previousValue={previous?.ebitda ?? null}
                    subLabel={latest.ebitdaMargin ? `${latest.ebitdaMargin} margin` : null}
                    sparklineData={extractSparklineData(metrics, 'ebitda')}
                />
                <KPICard
                    label="Revenue Growth"
                    currentValue={latest.revenueGrowth}
                    previousValue={previous?.revenueGrowth ?? null}
                    sparklineData={extractSparklineData(metrics, 'revenueGrowth')}
                />
                <KPICard
                    label="EBITDA Margin"
                    currentValue={latest.ebitdaMargin}
                    previousValue={previous?.ebitdaMargin ?? null}
                    sparklineData={extractSparklineData(metrics, 'ebitdaMargin')}
                />
                <KPICard
                    label="Employees"
                    currentValue={latest.employeeCount?.toString() ?? null}
                    previousValue={previous?.employeeCount?.toString() ?? null}
                    sparklineData={extractSparklineData(metrics, 'employeeCount')}
                />
                <KPICard
                    label="Customers"
                    currentValue={latest.customerCount?.toString() ?? null}
                    previousValue={previous?.customerCount?.toString() ?? null}
                    sparklineData={extractSparklineData(metrics, 'customerCount')}
                />
                <KPICard
                    label="EV/EBITDA Multiple"
                    currentValue={latest.evEbitda}
                    previousValue={previous?.evEbitda ?? null}
                    sparklineData={extractSparklineData(metrics, 'evEbitda')}
                />
                <KPICard
                    label="Valuation"
                    currentValue={latest.currentValuation}
                    previousValue={previous?.currentValuation ?? null}
                    sparklineData={extractSparklineData(metrics, 'currentValuation')}
                />
            </div>

            {/* Highlights & Concerns for latest period */}
            {(latest.highlights || latest.concerns) && (
                <div className="grid gap-4 md:grid-cols-2">
                    {latest.highlights && (
                        <div className="rounded-lg border border-border bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                Highlights
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                {latest.highlights}
                            </p>
                        </div>
                    )}
                    {latest.concerns && (
                        <div className="rounded-lg border border-border bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                Concerns
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                {latest.concerns}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
