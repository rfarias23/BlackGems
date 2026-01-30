import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    BarChart3,
    Building2,
    DollarSign,
    TrendingUp,
    Users,
    Target,
    Briefcase,
    PieChart,
} from 'lucide-react';
import Link from 'next/link';
import {
    getFundPerformanceReport,
    getPortfolioSummaryReport,
    getDealPipelineReport,
    getInvestorsForReports,
} from '@/lib/actions/reports';
import { LPStatementSelector } from '@/components/reports/lp-statement-selector';

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default async function ReportsPage() {
    const [fundPerformance, portfolioSummary, dealPipeline, investors] = await Promise.all([
        getFundPerformanceReport(),
        getPortfolioSummaryReport(),
        getDealPipelineReport(),
        getInvestorsForReports(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Reports</h2>
                <p className="text-muted-foreground">
                    Fund performance, portfolio analytics, and LP statements.
                </p>
            </div>

            <Tabs defaultValue="performance" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="performance">Fund Performance</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfolio Summary</TabsTrigger>
                    <TabsTrigger value="pipeline">Deal Pipeline</TabsTrigger>
                    <TabsTrigger value="lp-statements">LP Statements</TabsTrigger>
                </TabsList>

                {/* Fund Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                    {fundPerformance ? (
                        <>
                            {/* Fund Info */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{fundPerformance.fund.name}</CardTitle>
                                            <CardDescription>
                                                Vintage {fundPerformance.fund.vintage} | Target: {fundPerformance.fund.targetSize}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline">{fundPerformance.fund.status}</Badge>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Performance Metrics */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Gross MOIC</CardTitle>
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{fundPerformance.performance.grossMoic}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Net MOIC</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{fundPerformance.performance.netMoic}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">DPI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{fundPerformance.performance.dpi}</div>
                                        <p className="text-xs text-muted-foreground">Distributions / Paid-In</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">RVPI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{fundPerformance.performance.rvpi}</div>
                                        <p className="text-xs text-muted-foreground">Residual / Paid-In</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">TVPI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-500">{fundPerformance.performance.tvpi}</div>
                                        <p className="text-xs text-muted-foreground">Total Value / Paid-In</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Capital Summary */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Capital Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Total Commitments</span>
                                            <span className="font-medium">{fundPerformance.capital.totalCommitments}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Capital Called</span>
                                            <span className="font-medium">{fundPerformance.capital.totalCalled}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Capital Paid</span>
                                            <span className="font-medium">{fundPerformance.capital.totalPaid}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Distributions</span>
                                            <span className="font-medium text-emerald-500">{fundPerformance.capital.totalDistributed}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Unfunded</span>
                                            <span className="font-medium">{fundPerformance.capital.unfundedCommitments}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Call %</span>
                                            <span className="font-medium">{fundPerformance.capital.callPercentage}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Portfolio Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Total Companies</span>
                                            <span className="font-medium">{fundPerformance.portfolio.totalCompanies}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Active</span>
                                            <span className="font-medium">{fundPerformance.portfolio.activeCompanies}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Exited</span>
                                            <span className="font-medium">{fundPerformance.portfolio.exitedCompanies}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Total Invested</span>
                                            <span className="font-medium">{fundPerformance.portfolio.totalInvested}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Total Value</span>
                                            <span className="font-medium text-emerald-500">{fundPerformance.portfolio.totalValue}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Deal Pipeline Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Deal Pipeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Deals</p>
                                            <p className="text-2xl font-bold">{fundPerformance.dealPipeline.totalDeals}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Active</p>
                                            <p className="text-2xl font-bold">{fundPerformance.dealPipeline.activeDeals}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Won</p>
                                            <p className="text-2xl font-bold text-emerald-500">{fundPerformance.dealPipeline.wonDeals}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                            <p className="text-2xl font-bold">{fundPerformance.dealPipeline.conversionRate}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-center py-12">
                                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No fund data available</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Portfolio Summary Tab */}
                <TabsContent value="portfolio" className="space-y-4">
                    {portfolioSummary && portfolioSummary.companies.length > 0 ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Companies</CardTitle>
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{portfolioSummary.summary.totalCompanies}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{portfolioSummary.summary.totalInvested}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-500">{portfolioSummary.summary.totalValue}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Portfolio MOIC</CardTitle>
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{portfolioSummary.summary.portfolioMoic}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg Hold</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{portfolioSummary.summary.avgHoldingPeriod}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Companies Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Portfolio Companies</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border hover:bg-transparent">
                                                <TableHead className="text-muted-foreground">Company</TableHead>
                                                <TableHead className="text-muted-foreground">Industry</TableHead>
                                                <TableHead className="text-muted-foreground">Acquired</TableHead>
                                                <TableHead className="text-muted-foreground">Hold (mo)</TableHead>
                                                <TableHead className="text-muted-foreground">Invested</TableHead>
                                                <TableHead className="text-muted-foreground">Value</TableHead>
                                                <TableHead className="text-muted-foreground">MOIC</TableHead>
                                                <TableHead className="text-muted-foreground">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {portfolioSummary.companies.map((company) => (
                                                <TableRow key={company.id} className="border-border">
                                                    <TableCell>
                                                        <Link
                                                            href={`/portfolio/${company.id}`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            {company.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{company.industry || '-'}</TableCell>
                                                    <TableCell className="text-muted-foreground">{formatDate(company.acquisitionDate)}</TableCell>
                                                    <TableCell className="text-muted-foreground">{company.holdingPeriodMonths}</TableCell>
                                                    <TableCell>{company.invested}</TableCell>
                                                    <TableCell className="text-emerald-500">{company.currentValue}</TableCell>
                                                    <TableCell className="font-medium">{company.moic}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{company.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Breakdowns */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <PieChart className="h-4 w-4" />
                                            By Industry
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {portfolioSummary.byIndustry.map((item) => (
                                                <div key={item.industry} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.industry}</span>
                                                        <Badge variant="secondary">{item.count}</Badge>
                                                    </div>
                                                    <span className="font-medium">{item.invested}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4" />
                                            By Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {portfolioSummary.byStatus.map((item) => (
                                                <div key={item.status} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.status}</span>
                                                        <Badge variant="secondary">{item.count}</Badge>
                                                    </div>
                                                    <span className="font-medium">{item.invested}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-center py-12">
                                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No portfolio companies yet</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Deal Pipeline Tab */}
                <TabsContent value="pipeline" className="space-y-4">
                    {dealPipeline && dealPipeline.summary.totalDeals > 0 ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{dealPipeline.summary.totalDeals}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{dealPipeline.summary.activeDeals}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{dealPipeline.summary.avgDealSize}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Conversion</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{dealPipeline.summary.conversionRate}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* By Stage */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Deals by Stage</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {dealPipeline.byStage.map((item) => (
                                            <div key={item.stage} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{item.stage}</span>
                                                    <Badge variant="secondary">{item.count}</Badge>
                                                </div>
                                                <span className="text-sm font-medium">{item.totalValue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Deal Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border hover:bg-transparent">
                                                <TableHead className="text-muted-foreground">Deal</TableHead>
                                                <TableHead className="text-muted-foreground">Stage</TableHead>
                                                <TableHead className="text-muted-foreground">Asking Price</TableHead>
                                                <TableHead className="text-muted-foreground">Last Updated</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dealPipeline.recentActivity.map((deal) => (
                                                <TableRow key={deal.id} className="border-border">
                                                    <TableCell>
                                                        <Link
                                                            href={`/deals/${deal.id}`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            {deal.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{deal.stage}</Badge>
                                                    </TableCell>
                                                    <TableCell>{deal.askingPrice || '-'}</TableCell>
                                                    <TableCell className="text-muted-foreground">{formatDate(deal.lastUpdated)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-center py-12">
                                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No deals in pipeline</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* LP Statements Tab */}
                <TabsContent value="lp-statements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                LP Capital Account Statements
                            </CardTitle>
                            <CardDescription>
                                Generate capital account statements for individual LPs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LPStatementSelector investors={investors} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
