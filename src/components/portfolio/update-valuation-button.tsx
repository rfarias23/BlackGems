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

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
} as const;

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
            <DialogContent className={dark.dialog}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Update Valuation</DialogTitle>
                    <DialogDescription className="text-[#94A3B8]">
                        Record a new valuation for {companyName}. This will update the MOIC calculation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="valuation" className={dark.label}>Current Enterprise Value</Label>
                        <Input
                            id="valuation"
                            type="text"
                            value={valuation}
                            onChange={(e) => setValuation(e.target.value)}
                            placeholder="10,000,000"
                            className={dark.input}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes" className={dark.label}>Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Valuation basis, comparable transactions, etc."
                            className={`min-h-[80px] resize-none ${dark.input}`}
                        />
                    </div>
                    {error && (
                        <div className={`rounded-md p-3 text-sm ${dark.error}`}>{error}</div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className={dark.cancelBtn}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending} className={dark.saveBtn}>
                        {isPending ? 'Updating...' : 'Update Valuation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
