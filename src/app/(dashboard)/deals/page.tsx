import { Button } from '@/components/ui/button';
import { DealTable, DealTableItem } from '@/components/deals/deal-table';
import { DealStage } from '@/components/deals/deal-stage-badge';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getDeals } from '@/lib/actions/deals';

export default async function DealsPage() {
    const deals = await getDeals();

    // Transform server data to table format
    const tableDeals: DealTableItem[] = deals.map((deal) => ({
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
                <Button asChild>
                    <Link href="/deals/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Deal
                    </Link>
                </Button>
            </div>

            <DealTable deals={tableDeals} />
        </div>
    );
}
