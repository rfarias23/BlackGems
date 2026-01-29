import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DistributionForm } from '@/components/capital/distribution-form';
import { getFundsForDistribution } from '@/lib/actions/distributions';

export default async function NewDistributionPage() {
    const funds = await getFundsForDistribution();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/capital">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">New Distribution</h2>
                    <p className="text-muted-foreground">
                        Create a distribution to return capital to LPs.
                    </p>
                </div>
            </div>

            <DistributionForm funds={funds} />
        </div>
    );
}
