import { Button } from '@/components/ui/button';
import { InvestorTable, InvestorTableItem } from '@/components/investors/investor-table';
import { InvestorStatus } from '@/components/investors/investor-status-badge';
import { DataPagination } from '@/components/ui/data-pagination';
import { ExportInvestorsButton } from '@/components/investors/export-investors-button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getInvestors, getInvestorsForExport } from '@/lib/actions/investors';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface InvestorsPageProps {
    searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function InvestorsPage({ searchParams }: InvestorsPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const [result, exportData] = await Promise.all([
        getInvestors({ page, search: params.search }),
        getInvestorsForExport(),
    ]);

    const tableInvestors: InvestorTableItem[] = result.data.map((investor) => ({
        id: investor.id,
        name: investor.name,
        type: investor.type,
        status: investor.status as InvestorStatus,
        email: investor.email,
        contactName: investor.contactName,
        totalCommitted: investor.totalCommitted,
        date: investor.createdAt.toISOString().split('T')[0],
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Investors</h2>
                    <p className="text-muted-foreground">
                        Manage your Limited Partners and track commitments.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportInvestorsButton data={exportData} />
                    <Button asChild variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                        <Link href="/investors/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Investor
                        </Link>
                    </Button>
                </div>
            </div>

            <ErrorBoundary module="Investors">
            <InvestorTable investors={tableInvestors} />
            <DataPagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                pageSize={result.pageSize}
            />
            </ErrorBoundary>
        </div>
    );
}
