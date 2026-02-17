import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Target } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPortfolioCompany, getPortfolioMetrics } from '@/lib/actions/portfolio';
import { getValuationHistory } from '@/lib/actions/portfolio-monitoring';
import { PortfolioStatusActions } from '@/components/portfolio/portfolio-status-actions';
import { UpdateValuationButton } from '@/components/portfolio/update-valuation-button';
import { DeletePortfolioButton } from '@/components/portfolio/delete-portfolio-button';
import { RecordMetricsButton } from '@/components/portfolio/record-metrics-button';
import { PortfolioOverview } from '@/components/portfolio/portfolio-overview';
import { PortfolioFinancials } from '@/components/portfolio/portfolio-financials';
import { PortfolioKPIs } from '@/components/portfolio/portfolio-kpis';
import { PortfolioValuationHistory } from '@/components/portfolio/portfolio-valuation-history';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { auth } from '@/lib/auth';
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access';
import type { CurrencyCode } from '@/lib/shared/formatters';

function formatDate(date: Date | null): string {
    if (!date) return '\u2014';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Holding':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'Preparing Exit':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'Under LOI':
            return 'bg-blue-500/20 text-blue-400';
        case 'Partial Exit':
            return 'bg-purple-500/20 text-purple-400';
        case 'Exited':
            return 'bg-slate-500/20 text-slate-400';
        case 'Written Off':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-slate-500/20 text-slate-400';
    }
}

export default async function PortfolioCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [company, metrics, valuationResult, session] = await Promise.all([
        getPortfolioCompany(id),
        getPortfolioMetrics(id),
        getValuationHistory(id),
        auth(),
    ]);

    if (!company) {
        notFound();
    }

    const { currency } = session?.user?.id
        ? await getActiveFundWithCurrency(session.user.id)
        : { currency: 'USD' as CurrencyCode };

    return (
        <ErrorBoundary module="Portfolio Detail">
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild className="mt-1">
                        <Link href="/portfolio">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight font-serif text-foreground">
                            {company.name}
                        </h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{company.industry || 'No industry'}</span>
                            <span>-</span>
                            <span>{company.fundName}</span>
                            <Badge className={getStatusColor(company.status)}>
                                {company.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <RecordMetricsButton companyId={company.id} />
                    <UpdateValuationButton companyId={company.id} companyName={company.name} />
                    <PortfolioStatusActions companyId={company.id} currentStatus={company.status} />
                    <DeletePortfolioButton companyId={company.id} companyName={company.name} />
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Key Metrics — always visible above tabs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Equity Invested</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums">{company.equityInvested}</div>
                        {company.debtFinancing && (
                            <p className="text-xs text-muted-foreground">
                                + {company.debtFinancing} debt
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums text-[#059669]">
                            {company.totalValue || company.equityInvested}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {company.unrealizedValue} unrealized
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MOIC</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums">{company.moic || '1.00x'}</div>
                        <p className="text-xs text-muted-foreground">
                            Multiple on invested capital
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Holding Period</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums">{company.holdingPeriodMonths} mo</div>
                        <p className="text-xs text-muted-foreground">
                            Since {formatDate(company.acquisitionDate)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                    <TabsTrigger value="kpis">KPIs</TabsTrigger>
                    <TabsTrigger value="valuation">Valuation</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <PortfolioOverview company={company} />
                </TabsContent>

                <TabsContent value="financials">
                    <PortfolioFinancials
                        latestMetrics={company.latestMetrics}
                        metrics={metrics}
                    />
                </TabsContent>

                <TabsContent value="kpis">
                    <PortfolioKPIs metrics={metrics} />
                </TabsContent>

                <TabsContent value="valuation">
                    <PortfolioValuationHistory
                        company={{
                            entryValuation: company.entryValuation,
                            currentValuation: company.latestMetrics?.currentValuation ?? company.totalValue ?? null,
                            totalValue: company.totalValue,
                            moic: company.moic,
                            equityInvested: company.equityInvested,
                            acquisitionDate: company.acquisitionDate,
                        }}
                        metrics={metrics}
                        valuations={'data' in valuationResult ? valuationResult.data : undefined}
                        currency={currency}
                    />
                </TabsContent>
            </Tabs>
        </div>
        </ErrorBoundary>
    );
}
