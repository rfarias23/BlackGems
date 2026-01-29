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
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign } from 'lucide-react';
import { recordCallItemPayment } from '@/lib/actions/capital-calls';

interface RecordPaymentButtonProps {
    itemId: string;
    investorName: string;
    callAmount: number;
    paidAmount: number;
}

export function RecordPaymentButton({
    itemId,
    investorName,
    callAmount,
    paidAmount,
}: RecordPaymentButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [amount, setAmount] = useState(String(callAmount - paidAmount));
    const [markAsPaid, setMarkAsPaid] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const outstanding = callAmount - paidAmount;

    const handleSubmit = () => {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (paymentAmount > outstanding) {
            setError('Payment cannot exceed outstanding amount');
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await recordCallItemPayment(itemId, paymentAmount, markAsPaid);
            if (result.error) {
                setError(result.error);
            } else {
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <DollarSign className="mr-1 h-3 w-3" />
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Record a capital call payment from {investorName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Called Amount</span>
                            <div className="font-medium">${callAmount.toLocaleString()}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Already Paid</span>
                            <div className="font-medium text-emerald-500">${paidAmount.toLocaleString()}</div>
                        </div>
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Outstanding</span>
                            <div className="font-medium text-lg">${outstanding.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="markAsPaid"
                            checked={markAsPaid}
                            onCheckedChange={(checked) => setMarkAsPaid(checked === true)}
                        />
                        <Label htmlFor="markAsPaid" className="text-sm">
                            Mark as fully paid (even if partial payment)
                        </Label>
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
                        {isPending ? 'Recording...' : 'Record Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
