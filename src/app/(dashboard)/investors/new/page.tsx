import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { InvestorForm } from '@/components/investors/investor-form';

export default function NewInvestorPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/investors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">New Investor</h2>
                    <p className="text-muted-foreground">
                        Add a new Limited Partner to the fund.
                    </p>
                </div>
            </div>

            <InvestorForm />
        </div>
    );
}
