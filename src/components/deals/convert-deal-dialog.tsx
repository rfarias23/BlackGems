'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft, Briefcase, Building2 } from 'lucide-react';
import { convertDealToPortfolio } from '@/lib/actions/deals';

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
    muted: 'text-[#94A3B8]',
    card: 'bg-[#11141D] border-[#334155] rounded-lg p-4',
} as const;

interface ConvertDealDialogProps {
    dealId: string;
    companyName: string;
    askingPrice: number | null;
    revenue: number | null;
    ebitda: number | null;
    industry: string | null;
    actualCloseDate: Date | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatNum(val: number | null): string {
    if (val === null) return '';
    return val.toLocaleString();
}

export function ConvertDealDialog({
    dealId,
    companyName,
    askingPrice,
    revenue,
    ebitda,
    industry,
    actualCloseDate,
    open,
    onOpenChange,
}: ConvertDealDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Pre-populated fields (user can edit)
    const [entryValuation, setEntryValuation] = useState(formatNum(askingPrice));
    const [equityInvested, setEquityInvested] = useState('');
    const [ownershipPct, setOwnershipPct] = useState('');
    const [debtFinancing, setDebtFinancing] = useState('');
    const [acquisitionDate, setAcquisitionDate] = useState(
        actualCloseDate
            ? new Date(actualCloseDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );

    const handleSubmit = () => {
        setError(null);
        const formData = new FormData();
        formData.set('entryValuation', entryValuation);
        formData.set('equityInvested', equityInvested);
        formData.set('ownershipPct', ownershipPct);
        formData.set('debtFinancing', debtFinancing);
        formData.set('acquisitionDate', acquisitionDate);

        startTransition(async () => {
            const result = await convertDealToPortfolio(dealId, formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.portfolioId) {
                onOpenChange(false);
                router.push(`/portfolio/${result.portfolioId}`);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[560px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC] flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-[#3E5CFF]" />
                        Convert Deal to Portfolio Company
                    </DialogTitle>
                    <DialogDescription className={dark.muted}>
                        Create a portfolio company from the closed deal. Data from the deal will be carried over.
                    </DialogDescription>
                </DialogHeader>

                {/* Deal Summary */}
                <div className={dark.card}>
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-[#3E5CFF]" />
                        <span className="text-sm font-medium text-[#F8FAFC]">{companyName}</span>
                        {industry && (
                            <span className="text-xs text-[#94A3B8] ml-auto">{industry}</span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                            <span className={dark.muted}>Revenue</span>
                            <div className="text-[#F8FAFC] font-mono mt-0.5">
                                {revenue ? `$${revenue.toLocaleString()}` : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <span className={dark.muted}>EBITDA</span>
                            <div className="text-[#F8FAFC] font-mono mt-0.5">
                                {ebitda ? `$${ebitda.toLocaleString()}` : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <span className={dark.muted}>Asking Price</span>
                            <div className="text-[#F8FAFC] font-mono mt-0.5">
                                {askingPrice ? `$${askingPrice.toLocaleString()}` : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion Form */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#F8FAFC]">
                        <Briefcase className="h-4 w-4 text-[#3E5CFF]" />
                        Closing Terms
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Entry Valuation *</Label>
                            <Input
                                value={entryValuation}
                                onChange={(e) => setEntryValuation(e.target.value)}
                                placeholder="$5,000,000"
                                className={dark.input}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Acquisition Date *</Label>
                            <Input
                                type="date"
                                value={acquisitionDate}
                                onChange={(e) => setAcquisitionDate(e.target.value)}
                                className={dark.input}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Equity Invested *</Label>
                            <Input
                                value={equityInvested}
                                onChange={(e) => setEquityInvested(e.target.value)}
                                placeholder="$3,500,000"
                                className={dark.input}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Ownership % *</Label>
                            <Input
                                value={ownershipPct}
                                onChange={(e) => setOwnershipPct(e.target.value)}
                                placeholder="85%"
                                className={dark.input}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Debt Financing (optional)</Label>
                        <Input
                            value={debtFinancing}
                            onChange={(e) => setDebtFinancing(e.target.value)}
                            placeholder="$1,500,000"
                            className={dark.input}
                        />
                    </div>
                </div>

                {error && (
                    <div className={`rounded-md p-3 text-sm ${dark.error}`}>
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className={dark.cancelBtn}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!equityInvested || !ownershipPct || !entryValuation || !acquisitionDate || isPending}
                        className={dark.saveBtn}
                    >
                        {isPending ? 'Converting...' : 'Create Portfolio Company'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
