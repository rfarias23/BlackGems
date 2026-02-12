import { Button } from '@/components/ui/button';
import { DealTable, DealTableItem } from '@/components/deals/deal-table';
import { DealStage } from '@/components/deals/deal-stage-badge';
import { DataPagination } from '@/components/ui/data-pagination';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getDeals } from '@/lib/actions/deals';

interface DealsPageProps {
    searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const result = await getDeals({ page, search: params.search });

    const tableDeals: DealTableItem[] = result.data.map((deal) => ({
        id: deal.id,
        name: deal.name,
        stage: deal.stage as DealStage,
        sector: deal.industry,
        askPrice: deal.askingPrice || 'TBD',
        date: deal.createdAt.toISOString().split('T')[0],
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Deal Pipeline</h2>
                    <p className="text-muted-foreground">
                        Manage your acquisition targets and track deal flow.
                    </p>
                </div>
                <Button asChild variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    <Link href="/deals/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Deal
                    </Link>
                </Button>
            </div>

            <DealTable deals={tableDeals} />
            <DataPagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                pageSize={result.pageSize}
            />
        </div>
    );
}
