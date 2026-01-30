'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp } from 'lucide-react';
import { updatePortfolioValuation } from '@/lib/actions/portfolio';

interface UpdateValuationButtonProps {
    companyId: string;
    companyName: string;
}

export function UpdateValuationButton({ companyId, companyName }: UpdateValuationButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [valuation, setValuation] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        const amount = parseFloat(valuation.replace(/[$,]/g, ''));
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid valuation');
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await updatePortfolioValuation(companyId, amount, notes || undefined);
            if (result.error) {
                setError(result.error);
            } else {
                setOpen(false);
                setValuation('');
                setNotes('');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Update Valuation
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Valuation</DialogTitle>
                    <DialogDescription>
                        Record a new valuation for {companyName}. This will update the MOIC calculation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="valuation">Current Enterprise Value</Label>
                        <Input
                            id="valuation"
                            type="text"
                            value={valuation}
                            onChange={(e) => setValuation(e.target.value)}
                            placeholder="$10,000,000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Valuation basis, comparable transactions, etc."
                            className="min-h-[80px]"
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-destructive">{error}</div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? 'Updating...' : 'Update Valuation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
