import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MetricItem } from '@/lib/actions/portfolio';

function formatDate(date: Date | null): string {
    if (!date) return '\u2014';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

interface ValuationCompanyData {
    entryValuation: string;
    currentValuation: string | null;
    totalValue: string | null;
    moic: string | null;
    equityInvested: string;
    acquisitionDate: Date;
}

interface ValuationRecord {
    id: string;
    date: Date;
    value: string;
    equityValue: string | null;
    methodology: string;
    revenueMultiple: string | null;
    ebitdaMultiple: string | null;
    isOfficial: boolean;
    notes: string | null;
    changePercent: number | null;
}

interface PortfolioValuationHistoryProps {
    company: ValuationCompanyData;
    metrics: MetricItem[];
    valuations?: ValuationRecord[];
}

function parseCurrencyToNumber(value: string | null): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

function formatMethodology(methodology: string): string {
    return methodology
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PortfolioValuationHistory({ company, metrics, valuations }: PortfolioValuationHistoryProps) {
    const entryVal = parseCurrencyToNumber(company.entryValuation);
    const currentVal = parseCurrencyToNumber(company.currentValuation);
    const valueCreated = currentVal - entryVal;

    // Calculate progress bar percentage (capped at 100% for display)
    const progressPct = entryVal > 0 ? Math.min((currentVal / entryVal) * 100, 300) : 0;
    // For display, normalize to 0-100 range: entry is at 33%, current scales to fill
    const barPct = entryVal > 0 && currentVal > 0
        ? Math.min(Math.max((currentVal / (entryVal * 3)) * 100, 10), 100)
        : 0;

    // Filter metrics that have valuation entries
    const valuationMetrics = metrics.filter((m) => m.currentValuation);

    return (
        <div className="space-y-8">
            {/* Valuation Progress Bar */}
            {currentVal > 0 && entryVal > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            Entry
                        </span>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            Current
                        </span>
                    </div>
                    <div className="relative h-3 w-full rounded-full bg-border overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                                width: `${barPct}%`,
                                backgroundColor: '#3E5CFF',
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-mono tabular-nums text-muted-foreground">
                            {company.entryValuation}
                        </span>
                        <span className="text-sm font-mono tabular-nums text-foreground font-medium">
                            {company.currentValuation || '\u2014'}
                        </span>
                    </div>
                    {progressPct > 0 && (
                        <p className="text-center text-xs text-muted-foreground mt-1">
                            {progressPct.toFixed(0)}% of entry valuation
                        </p>
                    )}
                </div>
            )}

            {/* Valuation Summary Cards */}
            <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Valuation Summary
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Entry Valuation
                        </p>
                        <p className="mt-1 text-xl font-mono tabular-nums text-foreground">
                            {company.entryValuation}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(company.acquisitionDate)}
                        </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Current Valuation
                        </p>
                        <p className="mt-1 text-xl font-mono tabular-nums text-foreground">
                            {company.currentValuation || '\u2014'}
                        </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Total Value Created
                        </p>
                        <p className={`mt-1 text-xl font-mono tabular-nums ${valueCreated >= 0 ? 'text-[#059669]' : 'text-red-500'}`}>
                            {valueCreated >= 0 ? '+' : ''}{`$${Math.abs(valueCreated).toLocaleString()}`}
                        </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            MOIC
                        </p>
                        <p className="mt-1 text-xl font-mono tabular-nums text-foreground">
                            {company.moic || '1.00x'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Formal Valuations Table */}
            <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Formal Valuations
                </h3>
                {valuations && valuations.length > 0 ? (
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="sr-only">Formal Valuation Records</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Enterprise Value
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Equity Value
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Methodology
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Rev Multiple
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                EBITDA Multiple
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Change
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {valuations.map((v) => (
                                            <tr
                                                key={v.id}
                                                className="border-b border-border last:border-0"
                                            >
                                                <td className="px-4 py-3 text-foreground">
                                                    {formatDate(v.date)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {v.value}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {v.equityValue || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatMethodology(v.methodology)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {v.revenueMultiple || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {v.ebitdaMultiple || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums">
                                                    {v.changePercent !== null ? (
                                                        <span className={v.changePercent >= 0 ? 'text-[#059669]' : 'text-red-500'}>
                                                            {v.changePercent >= 0 ? '+' : ''}{v.changePercent.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">{'\u2014'}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {v.isOfficial ? (
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-transparent">
                                                            Official
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            Draft
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            No formal valuations recorded yet.
                        </p>
                    </div>
                )}
            </div>

            {/* Valuation Timeline Table (from PortfolioMetric snapshots) */}
            {valuationMetrics.length > 0 ? (
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
                        Valuation Timeline
                    </h3>
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="sr-only">Valuation History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Period Type
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Enterprise Value
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                EV/EBITDA
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                EBITDA
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                                Notes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {valuationMetrics.map((metric) => (
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
                                                    {metric.currentValuation || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {metric.evEbitda || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                                    {metric.ebitda || '\u2014'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                                                    {metric.notes || '\u2014'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        No valuation history entries yet. Record metrics with a valuation to build the timeline.
                    </p>
                </div>
            )}
        </div>
    );
}
