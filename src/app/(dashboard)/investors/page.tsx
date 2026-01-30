import { Button } from '@/components/ui/button';
import { InvestorTable, InvestorTableItem } from '@/components/investors/investor-table';
import { InvestorStatus } from '@/components/investors/investor-status-badge';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getInvestors } from '@/lib/actions/investors';

export default async function InvestorsPage() {
    const investors = await getInvestors();

    const tableInvestors: InvestorTableItem[] = investors.map((investor) => ({
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
                <Button asChild>
                    <Link href="/investors/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Investor
                    </Link>
                </Button>
            </div>

            <InvestorTable investors={tableInvestors} />
        </div>
    );
}
