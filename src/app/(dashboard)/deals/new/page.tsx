import { DealForm } from '@/components/deals/deal-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { getDealSources } from '@/lib/actions/deals';

export default async function NewDealPage() {
    const sources = await getDealSources();

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/deals">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Add New Deal</h2>
            </div>

            <ErrorBoundary module="Deals">
            <Card>
                <CardHeader>
                    <CardTitle>Deal Information</CardTitle>
                    <CardDescription>
                        Enter the initial details for the potential acquisition target.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DealForm sources={sources} />
                </CardContent>
            </Card>
            </ErrorBoundary>
        </div>
    );
}
