'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createCommitment, getFundsForCommitment } from '@/lib/actions/commitments';

const COMMITMENT_STATUSES = [
    'PENDING',
    'SIGNED',
    'FUNDED',
    'ACTIVE',
];

interface AddCommitmentButtonProps {
    investorId: string;
}

export function AddCommitmentButton({ investorId }: AddCommitmentButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [funds, setFunds] = useState<{ id: string; name: string; currency: string }[]>([]);

    const [fundId, setFundId] = useState('');
    const [committedAmount, setCommittedAmount] = useState('');
    const [status, setStatus] = useState('PENDING');
    const [notes, setNotes] = useState('');

    const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
    const selectedFund = funds.find(f => f.id === fundId);
    const currencySymbol = selectedFund ? (CURRENCY_SYMBOLS[selectedFund.currency] || '$') : '$';

    useEffect(() => {
        if (open) {
            getFundsForCommitment().then(setFunds);
        }
    }, [open]);

    const handleSubmit = () => {
        setError(null);
        if (!fundId) {
            setError('Please select a fund.');
            return;
        }
        if (!committedAmount) {
            setError('Please enter a committed amount.');
            return;
        }

        const formData = new FormData();
        formData.set('fundId', fundId);
        formData.set('committedAmount', committedAmount);
        formData.set('status', status);
        formData.set('notes', notes);

        startTransition(async () => {
            const result = await createCommitment(investorId, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setOpen(false);
                setFundId('');
                setCommittedAmount('');
                setStatus('PENDING');
                setNotes('');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-[#334155] text-[#F8FAFC] hover:bg-[#334155]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Commitment
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Add Fund Commitment</DialogTitle>
                    <DialogDescription className="text-[#94A3B8]">
                        Record a capital commitment to a fund for this investor.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {error && (
                        <div className="rounded-md p-3 text-sm bg-[#DC2626]/15 text-[#DC2626]">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm text-[#94A3B8]">Fund *</label>
                        <Select value={fundId} onValueChange={setFundId}>
                            <SelectTrigger className="bg-[#11141D] border-[#334155] text-[#F8FAFC]">
                                <SelectValue placeholder="Select a fund" />
                            </SelectTrigger>
                            <SelectContent>
                                {funds.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-[#94A3B8]">Committed Amount *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-mono">
                                {currencySymbol}
                            </span>
                            <Input
                                value={committedAmount}
                                onChange={(e) => setCommittedAmount(e.target.value)}
                                placeholder="1,000,000"
                                className="bg-[#11141D] border-[#334155] text-[#F8FAFC] focus-visible:ring-[#3E5CFF] pl-7 font-mono tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-[#94A3B8]">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="bg-[#11141D] border-[#334155] text-[#F8FAFC]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMITMENT_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-[#94A3B8]">Notes</label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes..."
                            className="bg-[#11141D] border-[#334155] text-[#F8FAFC] focus-visible:ring-[#3E5CFF]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90"
                    >
                        {isPending ? 'Adding...' : 'Add Commitment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
