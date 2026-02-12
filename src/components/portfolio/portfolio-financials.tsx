import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PortfolioCompanyDetail, MetricItem } from '@/lib/actions/portfolio';

function formatDate(date: Date | null): string {
    if (!date) return '\u2014';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

interface PortfolioFinancialsProps {
    latestMetrics: PortfolioCompanyDetail['latestMetrics'];
    metrics: MetricItem[];
}

function MetricCard({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-mono tabular-nums text-foreground">
                {value || '\u2014'}
            </p>
        </div>
    );
}

export function PortfolioFinancials({ latestMetrics, metrics }: PortfolioFinancialsProps) {
    const latest = metrics[0];

    if (!latest && !latestMetrics) {
        return (
            <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                    No financial data recorded yet. Record metrics to see financials.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Current Period Summary */}
            <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Current Period Summary
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Revenue"
                        value={latest?.revenue ?? latestMetrics?.revenue ?? null}
                    />
                    <MetricCard
                        label="EBITDA"
                        value={latest?.ebitda ?? latestMetrics?.ebitda ?? null}
                    />
                    <MetricCard
                        label="Net Income"
                        value={latest?.netIncome ?? null}
                    />
                    <MetricCard
                        label="Gross Profit"
                        value={latest?.grossProfit ?? null}
                    />
                </div>
            </div>

            {/* Margins */}
            {(latest?.ebitdaMargin || latest?.grossMargin || latestMetrics?.ebitdaMargin) && (
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                        Margins
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            label="EBITDA Margin"
                            value={latest?.ebitdaMargin ?? latestMetrics?.ebitdaMargin ?? null}
                        />
                        <MetricCard
                            label="Gross Margin"
                            value={latest?.grossMargin ?? null}
                        />
                    </div>
                </div>
            )}

            {/* Cash & Debt */}
            {(latest?.operatingCashFlow || latest?.freeCashFlow || latest?.cashBalance || latest?.totalDebt || latest?.netDebt) && (
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                        Cash & Debt
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <MetricCard
                            label="Operating Cash Flow"
                            value={latest?.operatingCashFlow ?? null}
                        />
                        <MetricCard
                            label="Free Cash Flow"
                            value={latest?.freeCashFlow ?? null}
                        />
                        <MetricCard
                            label="Cash Balance"
                            value={latest?.cashBalance ?? null}
                        />
                        <MetricCard
                            label="Total Debt"
                            value={latest?.totalDebt ?? null}
                        />
                        <MetricCard
                            label="Net Debt"
                            value={latest?.netDebt ?? null}
                        />
                    </div>
                </div>
            )}

            {/* Historical Financial Table */}
            {metrics.length > 0 && (
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                        Historical Financials
                    </h3>
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="sr-only">Historical Financial Data</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Period
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Type
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Revenue
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                EBITDA
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Net Income
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Valuation
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.map((metric) => (
                                            <tr
                                                key={metric.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="px-4 py-3 text-foreground">
                                                    {formatDate(metric.periodDate)}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {metric.periodType}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {metric.revenue || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {metric.ebitda || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {metric.netIncome || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {metric.currentValuation || '\u2014'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
