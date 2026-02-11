import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Calendar, DollarSign, TrendingUp, Users, Globe, Target } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPortfolioCompany, getPortfolioMetrics } from '@/lib/actions/portfolio';
import { PortfolioStatusActions } from '@/components/portfolio/portfolio-status-actions';
import { UpdateValuationButton } from '@/components/portfolio/update-valuation-button';
import { DeletePortfolioButton } from '@/components/portfolio/delete-portfolio-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function formatDate(date: Date | null): string {
    if (!date) return '-';
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
    const [company, metrics] = await Promise.all([
        getPortfolioCompany(id),
        getPortfolioMetrics(id),
    ]);

    if (!company) {
        notFound();
    }

    return (
        <ErrorBoundary module="portfolio">
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
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
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
                    <UpdateValuationButton companyId={company.id} companyName={company.name} />
                    <PortfolioStatusActions companyId={company.id} currentStatus={company.status} />
                    <DeletePortfolioButton companyId={company.id} companyName={company.name} />
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Equity Invested</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{company.equityInvested}</div>
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
                        <div className="text-2xl font-bold text-emerald-500">
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
                        <div className="text-2xl font-bold">{company.moic || '1.00x'}</div>
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
                        <div className="text-2xl font-bold">{company.holdingPeriodMonths} mo</div>
                        <p className="text-xs text-muted-foreground">
                            Since {formatDate(company.acquisitionDate)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Company Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {company.description && (
                            <div className="text-sm text-muted-foreground">
                                {company.description}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Industry</span>
                            <span className="font-medium">{company.industry || '-'}</span>
                        </div>
                        {company.businessModel && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Business Model</span>
                                <span className="font-medium">{company.businessModel}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Headquarters</span>
                            <span className="font-medium">{company.headquarters || '-'}</span>
                        </div>
                        {company.website && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Website</span>
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    <Globe className="h-3 w-3" />
                                    Visit
                                </a>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Ownership</span>
                            <span className="font-medium">{company.ownershipPct}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Investment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Acquisition Date</span>
                            <span className="font-medium">{formatDate(company.acquisitionDate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Entry Valuation</span>
                            <span className="font-medium">{company.entryValuation}</span>
                        </div>
                        {company.entryRevenue && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Entry Revenue</span>
                                <span className="font-medium">{company.entryRevenue}</span>
                            </div>
                        )}
                        {company.entryEbitda && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Entry EBITDA</span>
                                <span className="font-medium">{company.entryEbitda}</span>
                            </div>
                        )}
                        {company.entryMultiple && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Entry Multiple</span>
                                <span className="font-medium">{company.entryMultiple} EV/EBITDA</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Investment</span>
                            <span className="font-medium">{company.totalInvestment}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Management */}
            {(company.ceoName || company.boardSeats) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {company.ceoName && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">CEO</span>
                                <span className="font-medium">{company.ceoName}</span>
                            </div>
                        )}
                        {company.ceoEmail && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">CEO Email</span>
                                <a href={`mailto:${company.ceoEmail}`} className="font-medium text-primary hover:underline">
                                    {company.ceoEmail}
                                </a>
                            </div>
                        )}
                        {company.boardSeats && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Board Seats</span>
                                <span className="font-medium">{company.boardSeats}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Investment Thesis */}
            {company.investmentThesis && (
                <Card>
                    <CardHeader>
                        <CardTitle>Investment Thesis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {company.investmentThesis}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Latest Metrics */}
            {company.latestMetrics && (
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Metrics</CardTitle>
                        <CardDescription>
                            As of {formatDate(company.latestMetrics.periodDate)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            {company.latestMetrics.revenue && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Revenue</p>
                                    <p className="text-lg font-medium">{company.latestMetrics.revenue}</p>
                                    {company.latestMetrics.revenueGrowth && (
                                        <p className="text-xs text-emerald-500">
                                            {company.latestMetrics.revenueGrowth} YoY
                                        </p>
                                    )}
                                </div>
                            )}
                            {company.latestMetrics.ebitda && (
                                <div>
                                    <p className="text-sm text-muted-foreground">EBITDA</p>
                                    <p className="text-lg font-medium">{company.latestMetrics.ebitda}</p>
                                    {company.latestMetrics.ebitdaMargin && (
                                        <p className="text-xs text-muted-foreground">
                                            {company.latestMetrics.ebitdaMargin} margin
                                        </p>
                                    )}
                                </div>
                            )}
                            {company.latestMetrics.employeeCount && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Employees</p>
                                    <p className="text-lg font-medium">{company.latestMetrics.employeeCount}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Metrics History */}
            {metrics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Performance History</CardTitle>
                        <CardDescription>Historical metrics tracking</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.slice(0, 5).map((metric) => (
                                <div key={metric.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{formatDate(metric.periodDate)}</p>
                                        <p className="text-sm text-muted-foreground">{metric.periodType}</p>
                                    </div>
                                    <div className="text-right">
                                        {metric.revenue && <p className="text-sm">Revenue: {metric.revenue}</p>}
                                        {metric.ebitda && <p className="text-sm">EBITDA: {metric.ebitda}</p>}
                                        {metric.currentValuation && <p className="text-sm text-emerald-500">Valuation: {metric.currentValuation}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
        </ErrorBoundary>
    );
}
