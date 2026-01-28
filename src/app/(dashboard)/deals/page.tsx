import { Button } from '@/components/ui/button';
import { DealTable } from '@/components/deals/deal-table';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DealsPage() {
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

            <DealTable />
        </div>
    );
}
