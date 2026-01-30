import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getCapitalCalls } from '@/lib/actions/capital-calls';
import { getDistributions } from '@/lib/actions/distributions';
import { CapitalCallsTable } from '@/components/capital/capital-calls-table';
import { DistributionsTable } from '@/components/capital/distributions-table';

export default async function CapitalPage() {
    const [calls, distributions] = await Promise.all([
        getCapitalCalls(),
        getDistributions(),
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
                        <TabsTrigger value="calls">Capital Calls ({calls.length})</TabsTrigger>
                        <TabsTrigger value="distributions">Distributions ({distributions.length})</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="calls" className="space-y-4">
                    <div className="flex justify-end">
                        <Button asChild>
                            <Link href="/capital/calls/new">
                                <Plus className="mr-2 h-4 w-4" />
                                New Capital Call
                            </Link>
                        </Button>
                    </div>
                    <CapitalCallsTable calls={calls} />
                </TabsContent>

                <TabsContent value="distributions" className="space-y-4">
                    <div className="flex justify-end">
                        <Button asChild>
                            <Link href="/capital/distributions/new">
                                <Plus className="mr-2 h-4 w-4" />
                                New Distribution
                            </Link>
                        </Button>
                    </div>
                    <DistributionsTable distributions={distributions} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
