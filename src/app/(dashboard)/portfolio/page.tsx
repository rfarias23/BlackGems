import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, TrendingUp, DollarSign, Target } from 'lucide-react';
import Link from 'next/link';
import { getPortfolioCompanies, getPortfolioSummary } from '@/lib/actions/portfolio';
import { PortfolioTable } from '@/components/portfolio/portfolio-table';

export default async function PortfolioPage() {
    const [companies, summary] = await Promise.all([
        getPortfolioCompanies(),
        getPortfolioSummary(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Portfolio</h2>
                    <p className="text-muted-foreground">
                        Track and manage your portfolio companies.
                    </p>
                </div>
                <Button asChild variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    <Link href="/portfolio/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Company
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Portfolio Companies</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalCompanies}</div>
                            <p className="text-xs text-muted-foreground">
                                {summary.activeCompanies} active, {summary.exitedCompanies} exited
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalInvested}</div>
                            <p className="text-xs text-muted-foreground">
                                Equity capital deployed
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">{summary.totalValue}</div>
                            <p className="text-xs text-muted-foreground">
                                {summary.realizedValue} realized, {summary.unrealizedValue} unrealized
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Portfolio MOIC</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.portfolioMoic}</div>
                            <p className="text-xs text-muted-foreground">
                                Multiple on invested capital
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <PortfolioTable companies={companies} />
        </div>
    );
}
