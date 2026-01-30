import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PortfolioCompanyForm } from '@/components/portfolio/portfolio-company-form';
import { getFundsForPortfolio } from '@/lib/actions/portfolio';

export default async function NewPortfolioCompanyPage() {
    const funds = await getFundsForPortfolio();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/portfolio">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Add Portfolio Company</h2>
                    <p className="text-muted-foreground">
                        Record a new acquisition in your portfolio.
                    </p>
                </div>
            </div>

            <PortfolioCompanyForm funds={funds} />
        </div>
    );
}
