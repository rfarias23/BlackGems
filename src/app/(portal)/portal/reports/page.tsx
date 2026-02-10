import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    TrendingUp,
    Target,
    Building2,
    Landmark,
    BarChart3,
    PieChart,
} from 'lucide-react';
import { getPortalReports } from '@/lib/actions/portal';
import { PortalReportsTabs, TabsContent } from '@/components/portal/portal-reports-tabs';

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default async function PortalReportsPage() {
    const data = await getPortalReports();

    // No investor linked — show onboarding message
    if (!data) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20">
                <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h1 className="text-2xl font-serif font-bold text-slate-900">Reports</h1>
                <p className="text-slate-500 mt-2">
                    Your investor account is being set up. Reports will be available once your account is linked.
                </p>
            </div>
        );
    }

    const { capitalStatement, fundPerformance, portfolioSummary } = data;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Reports</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Your capital account statements, fund performance, and portfolio overview.
                </p>
            </div>

            <PortalReportsTabs>
                {/* ============================================================ */}
                {/* TAB 1: CAPITAL ACCOUNT STATEMENT                             */}
                {/* ============================================================ */}
                <TabsContent value="capital-account" className="space-y-6">
                    {capitalStatement ? (
                        <>
                            {/* Investor info */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-serif font-bold text-slate-900">
                                        {capitalStatement.investor.name}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {capitalStatement.investor.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                    </p>
                                </div>
                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
                                    Ownership: {capitalStatement.commitment.ownershipPct}
                                </Badge>
                            </div>

                            {/* Summary cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Committed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {capitalStatement.commitment.committedAmount}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Called</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {capitalStatement.commitment.calledAmount}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Paid</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {capitalStatement.commitment.paidAmount}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Distributed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">
                                            {capitalStatement.commitment.distributedAmount}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Unfunded</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {capitalStatement.commitment.unfundedAmount}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Est. MOIC</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {capitalStatement.performance.moic}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Capital Calls table */}
                            {capitalStatement.capitalCalls.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-slate-900 mb-3">Capital Calls</h3>
                                    <Card className="bg-white border-slate-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50">
                                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Call #</th>
                                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Date</th>
                                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Amount</th>
                                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Paid</th>
                                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {capitalStatement.capitalCalls.map((call) => (
                                                        <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-3 px-6 text-slate-900">#{call.callNumber}</td>
                                                            <td className="py-3 px-6 text-slate-500">{formatDate(call.callDate)}</td>
                                                            <td className="py-3 px-6 text-right text-slate-900">{call.amount}</td>
                                                            <td className="py-3 px-6 text-right text-emerald-600">{call.paidAmount}</td>
                                                            <td className="py-3 px-6 text-right">
                                                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
                                                                    {call.status.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Distributions table */}
                            {capitalStatement.distributions.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-serif font-bold text-slate-900 mb-3">Distributions</h3>
                                    <Card className="bg-white border-slate-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50">
                                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Dist #</th>
                                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Date</th>
                                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Gross</th>
                                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Net</th>
                                                        <th className="text-left py-3 px-6 font-medium text-slate-500">Type</th>
                                                        <th className="text-right py-3 px-6 font-medium text-slate-500">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {capitalStatement.distributions.map((dist) => (
                                                        <tr key={dist.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-3 px-6 text-slate-900">#{dist.distributionNumber}</td>
                                                            <td className="py-3 px-6 text-slate-500">{formatDate(dist.date)}</td>
                                                            <td className="py-3 px-6 text-right text-slate-900">{dist.grossAmount}</td>
                                                            <td className="py-3 px-6 text-right text-emerald-600">{dist.netAmount}</td>
                                                            <td className="py-3 px-6">
                                                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
                                                                    {dist.type.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 px-6 text-right">
                                                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
                                                                    {dist.status.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {capitalStatement.capitalCalls.length === 0 && capitalStatement.distributions.length === 0 && (
                                <Card className="bg-white border-slate-200">
                                    <CardContent className="py-10 text-center text-slate-400 text-sm">
                                        No capital calls or distributions recorded yet.
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="bg-white border-slate-200">
                            <CardContent className="py-16 text-center">
                                <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No capital account data available.</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Your statement will appear once commitments are recorded.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ============================================================ */}
                {/* TAB 2: FUND PERFORMANCE                                      */}
                {/* ============================================================ */}
                <TabsContent value="fund-performance" className="space-y-6">
                    {fundPerformance ? (
                        <>
                            {/* Fund info */}
                            <Card className="bg-white border-slate-200">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-serif font-bold text-slate-900">
                                                {fundPerformance.fund.name}
                                            </h2>
                                            <p className="text-sm text-slate-500">
                                                Vintage {fundPerformance.fund.vintage} &middot; Target: {fundPerformance.fund.targetSize}
                                            </p>
                                        </div>
                                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
                                            {fundPerformance.fund.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Performance metrics */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Gross MOIC</CardTitle>
                                        <Target className="h-4 w-4 text-slate-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {fundPerformance.performance.grossMoic}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Net MOIC</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {fundPerformance.performance.netMoic}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">DPI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {fundPerformance.performance.dpi}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Distributions / Paid-In</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">RVPI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {fundPerformance.performance.rvpi}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Residual / Paid-In</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">TVPI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">
                                            {fundPerformance.performance.tvpi}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Total Value / Paid-In</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Capital + Portfolio summaries */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="bg-white border-slate-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <DollarSign className="h-4 w-4 text-slate-400" />
                                            Capital Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Total Commitments</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.capital.totalCommitments}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Capital Called</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.capital.totalCalled}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Capital Paid</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.capital.totalPaid}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Distributions</span>
                                            <span className="font-medium text-emerald-600">{fundPerformance.capital.totalDistributed}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Unfunded</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.capital.unfundedCommitments}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Call %</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.capital.callPercentage}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            Portfolio Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Total Companies</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.portfolio.totalCompanies}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Active</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.portfolio.activeCompanies}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Exited</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.portfolio.exitedCompanies}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Total Invested</span>
                                            <span className="font-medium text-slate-900">{fundPerformance.portfolio.totalInvested}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Total Value</span>
                                            <span className="font-medium text-emerald-600">{fundPerformance.portfolio.totalValue}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <Card className="bg-white border-slate-200">
                            <CardContent className="py-16 text-center">
                                <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No fund performance data available.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ============================================================ */}
                {/* TAB 3: PORTFOLIO OVERVIEW                                     */}
                {/* ============================================================ */}
                <TabsContent value="portfolio" className="space-y-6">
                    {portfolioSummary && portfolioSummary.companies.length > 0 ? (
                        <>
                            {/* Summary cards */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Companies</CardTitle>
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {portfolioSummary.summary.totalCompanies}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Total Invested</CardTitle>
                                        <DollarSign className="h-4 w-4 text-slate-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {portfolioSummary.summary.totalInvested}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Total Value</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-slate-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">
                                            {portfolioSummary.summary.totalValue}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Portfolio MOIC</CardTitle>
                                        <Target className="h-4 w-4 text-slate-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {portfolioSummary.summary.portfolioMoic}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white border-slate-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500">Avg Hold</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {portfolioSummary.summary.avgHoldingPeriod}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Companies table */}
                            <div>
                                <h3 className="text-lg font-serif font-bold text-slate-900 mb-3">Portfolio Companies</h3>
                                <Card className="bg-white border-slate-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50">
                                                    <th className="text-left py-3 px-6 font-medium text-slate-500">Company</th>
                                                    <th className="text-left py-3 px-6 font-medium text-slate-500">Industry</th>
                                                    <th className="text-left py-3 px-6 font-medium text-slate-500">Acquired</th>
                                                    <th className="text-right py-3 px-6 font-medium text-slate-500">Hold (mo)</th>
                                                    <th className="text-right py-3 px-6 font-medium text-slate-500">Invested</th>
                                                    <th className="text-right py-3 px-6 font-medium text-slate-500">Value</th>
                                                    <th className="text-right py-3 px-6 font-medium text-slate-500">MOIC</th>
                                                    <th className="text-right py-3 px-6 font-medium text-slate-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {portfolioSummary.companies.map((company) => (
                                                    <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-3 px-6 font-medium text-slate-900">{company.name}</td>
                                                        <td className="py-3 px-6 text-slate-500">{company.industry || '-'}</td>
                                                        <td className="py-3 px-6 text-slate-500">{formatDate(company.acquisitionDate)}</td>
                                                        <td className="py-3 px-6 text-right text-slate-500">{company.holdingPeriodMonths}</td>
                                                        <td className="py-3 px-6 text-right text-slate-900">{company.invested}</td>
                                                        <td className="py-3 px-6 text-right text-emerald-600">{company.currentValue}</td>
                                                        <td className="py-3 px-6 text-right font-medium text-slate-900">{company.moic}</td>
                                                        <td className="py-3 px-6 text-right">
                                                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">
                                                                {company.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                            {/* Breakdowns */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="bg-white border-slate-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <PieChart className="h-4 w-4 text-slate-400" />
                                            By Industry
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {portfolioSummary.byIndustry.map((item) => (
                                                <div key={item.industry} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-900">{item.industry}</span>
                                                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 text-xs">
                                                            {item.count}
                                                        </Badge>
                                                    </div>
                                                    <span className="font-medium text-slate-900">{item.invested}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-slate-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <BarChart3 className="h-4 w-4 text-slate-400" />
                                            By Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {portfolioSummary.byStatus.map((item) => (
                                                <div key={item.status} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-900">{item.status}</span>
                                                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 text-xs">
                                                            {item.count}
                                                        </Badge>
                                                    </div>
                                                    <span className="font-medium text-slate-900">{item.invested}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <Card className="bg-white border-slate-200">
                            <CardContent className="py-16 text-center">
                                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">No portfolio companies yet.</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Portfolio data will appear once investments are recorded.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </PortalReportsTabs>
        </div>
    );
}
