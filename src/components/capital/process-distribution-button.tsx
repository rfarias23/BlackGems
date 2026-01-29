'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DollarSign } from 'lucide-react';
import { processDistributionItem } from '@/lib/actions/distributions';

interface ProcessDistributionButtonProps {
    itemId: string;
    investorName: string;
}

export function ProcessDistributionButton({ itemId, investorName }: ProcessDistributionButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleProcess = () => {
        setError(null);
        startTransition(async () => {
            const result = await processDistributionItem(itemId);
            if (result.error) {
                setError(result.error);
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <DollarSign className="mr-1 h-3 w-3" />
                    Mark Paid
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                    <AlertDialogDescription>
                        Mark the distribution to {investorName} as paid? This action will update
                        their commitment records.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && (
                    <div className="text-sm text-destructive">{error}</div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleProcess} disabled={isPending}>
                        {isPending ? 'Processing...' : 'Confirm Payment'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
