import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CapitalCallForm } from '@/components/capital/capital-call-form';
import { getFundsForCapitalCall } from '@/lib/actions/capital-calls';

export default async function NewCapitalCallPage() {
    const funds = await getFundsForCapitalCall();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/capital">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">New Capital Call</h2>
                    <p className="text-muted-foreground">
                        Create a capital call to request funds from LPs.
                    </p>
                </div>
            </div>

            <CapitalCallForm funds={funds} />
        </div>
    );
}
