import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataPagination } from '@/components/ui/data-pagination';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getCapitalCalls } from '@/lib/actions/capital-calls';
import { getDistributions } from '@/lib/actions/distributions';
import { CapitalCallsTable } from '@/components/capital/capital-calls-table';
import { DistributionsTable } from '@/components/capital/distributions-table';

interface CapitalPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function CapitalPage({ searchParams }: CapitalPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;

    const [callsResult, distResult] = await Promise.all([
        getCapitalCalls({ page }),
        getDistributions({ page }),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Capital Management</h2>
                    <p className="text-muted-foreground">
                        Manage capital calls and distributions for your fund.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="calls" className="space-y-4">
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
        </div>
    );
}
