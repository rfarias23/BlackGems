import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Activity, Users, TrendingUp, Briefcase, ArrowUpRight } from 'lucide-react';
import { DownloadReportButton } from '@/components/dashboard/download-report-button';
import { getDashboardData } from '@/lib/actions/reports';
import { getDashboardChartData } from '@/lib/actions/chart-data';
import { DashboardCharts } from '@/components/charts/dashboard-charts';

// Map audit actions to human-readable descriptions
function describeActivity(action: string, entityType: string): string {
    const actionMap: Record<string, string> = {
        CREATE: 'Created',
        UPDATE: 'Updated',
        DELETE: 'Deleted',
        VIEW: 'Viewed',
        EXPORT: 'Exported',
        LOGIN: 'Logged in',
        LOGOUT: 'Logged out',
    };
    const verb = actionMap[action] || action;
    const entity = entityType.replace(/_/g, ' ').toLowerCase();
    return `${verb} ${entity}`;
}

function timeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function DashboardPage() {
    const [data, chartData] = await Promise.all([
        getDashboardData(),
        getDashboardChartData(),
    ]);

    if (!data) {
        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">No fund configured yet. Go to Settings to set up your fund.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Build metrics for PDF export (matches DashboardMetrics interface)
    const pdfMetrics = {
        fundName: data.fundName,
        totalAUM: data.totalAUM,
        aumChange: `${data.capitalCallPct} called`,
        activeDeals: data.activeDeals,
        dealsChange: `${data.totalDeals} total`,
        investors: data.investorCount,
        investorsStatus: `${data.activeInvestors} active`,
        irrNet: data.grossMoic,
        irrChange: `TVPI: ${data.tvpi}`,
        deals: data.recentDeals.map(d => ({
            name: d.name,
            stage: d.stage,
            status: d.askingPrice || 'N/A',
        })),
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
                    <p className="text-muted-foreground">{data.fundName}</p>
                </div>
                <DownloadReportButton metrics={pdfMetrics} />
            </div>

            {/* Top Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total AUM
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{data.totalAUM}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.capitalCallPct} capital called
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Deals
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{data.activeDeals}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.totalDeals} total in pipeline
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Investors
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{data.investorCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.activeInvestors} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Gross MOIC
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{data.grossMoic}</div>
                        <p className="text-xs text-muted-foreground">
                            TVPI: {data.tvpi}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row: Commitments + Portfolio + Conversion */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Commitments
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{data.totalCommitments}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.capitalCalled} called
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Portfolio Companies
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{data.portfolioCompanies}</div>
                        <p className="text-xs text-muted-foreground">
                            Net MOIC: {data.netMoic}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Deal Conversion
                        </CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{data.activeDeals}/{data.totalDeals}</div>
                        <p className="text-xs text-muted-foreground">
                            active deals in pipeline
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            {chartData && (
                <DashboardCharts
                    moicByCompany={chartData.moicByCompany}
                    sectorAllocation={chartData.sectorAllocation}
                    capitalTimeline={chartData.capitalTimeline}
                    fundIrr={chartData.fundIrr}
                />
            )}

            {/* Bottom Row: Recent Activity + Deal Pipeline */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="text-primary">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.recentActivity.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
                        ) : (
                            <div className="space-y-4">
                                {data.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-primary truncate">
                                                {describeActivity(activity.action, activity.entityType)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.userName || 'System'} · {timeAgo(activity.createdAt)}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="shrink-0 text-xs">
                                            {activity.entityType.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-primary">Deal Pipeline</CardTitle>
                        <Link href="/deals" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            View all →
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {data.recentDeals.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No deals in pipeline.</p>
                        ) : (
                            <div className="space-y-4">
                                {data.recentDeals.map((deal) => (
                                    <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center group">
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <p className="text-sm font-medium leading-none text-primary group-hover:text-emerald-400 transition-colors truncate">
                                                {deal.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{deal.stage}</p>
                                        </div>
                                        <div className="text-sm text-muted-foreground shrink-0">
                                            {deal.askingPrice || '—'}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
