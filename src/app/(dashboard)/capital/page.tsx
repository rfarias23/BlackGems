import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataPagination } from '@/components/ui/data-pagination';
import { Plus, DollarSign, Clock, CheckCircle, Banknote } from 'lucide-react';
import Link from 'next/link';
import { getCapitalCalls, getCapitalCallSummary } from '@/lib/actions/capital-calls';
import { getDistributions, getDistributionSummary } from '@/lib/actions/distributions';
import { CapitalCallsTable } from '@/components/capital/capital-calls-table';
import { DistributionsTable } from '@/components/capital/distributions-table';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
}

interface CapitalPageProps {
    searchParams: Promise<{ page?: string; tab?: string }>;
}

export default async function CapitalPage({ searchParams }: CapitalPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const activeTab = params.tab || 'calls';

    const [callsResult, distResult, callSummary, distSummary] = await Promise.all([
        getCapitalCalls({ page }),
        getDistributions({ page }),
        getCapitalCallSummary(),
        getDistributionSummary(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">Capital Management</h2>
                    <p className="text-muted-foreground">
                        Manage capital calls and distributions for your fund.
                    </p>
                </div>
            </div>

            <ErrorBoundary module="Capital">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Called</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums">
                            {formatCompact(callSummary.totalCalled)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {callSummary.activeCount} active call{callSummary.activeCount !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capital Received</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums text-[#059669]">
                            {formatCompact(callSummary.totalPaid)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatCompact(callSummary.totalOutstanding)} outstanding
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums">
                            {formatCompact(distSummary.totalDistributed)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {distSummary.completedCount} completed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Activity</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tabular-nums">
                            {callSummary.draftCount + distSummary.draftCount + distSummary.processingCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {callSummary.draftCount} draft call{callSummary.draftCount !== 1 ? 's' : ''}, {distSummary.draftCount + distSummary.processingCount} dist. pending
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue={activeTab} className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="calls">Capital Calls ({callsResult.total})</TabsTrigger>
                        <TabsTrigger value="distributions">Distributions ({distResult.total})</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="calls" className="space-y-4">
                    <div className="flex justify-end">
                        <Button asChild variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                            <Link href="/capital/calls/new">
                                <Plus className="mr-2 h-4 w-4" />
                                New Capital Call
                            </Link>
                        </Button>
                    </div>
                    <CapitalCallsTable calls={callsResult.data} />
                    <DataPagination
                        page={callsResult.page}
                        totalPages={callsResult.totalPages}
                        total={callsResult.total}
                        pageSize={callsResult.pageSize}
                    />
                </TabsContent>

                <TabsContent value="distributions" className="space-y-4">
                    <div className="flex justify-end">
                        <Button asChild variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                            <Link href="/capital/distributions/new">
                                <Plus className="mr-2 h-4 w-4" />
                                New Distribution
                            </Link>
                        </Button>
                    </div>
                    <DistributionsTable distributions={distResult.data} />
                    <DataPagination
                        page={distResult.page}
                        totalPages={distResult.totalPages}
                        total={distResult.total}
                        pageSize={distResult.pageSize}
                    />
                </TabsContent>
            </Tabs>
            </ErrorBoundary>
        </div>
    );
}
