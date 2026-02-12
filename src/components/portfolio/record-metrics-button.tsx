'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3 } from 'lucide-react';
import { recordPortfolioMetrics } from '@/lib/actions/portfolio';

const PERIOD_TYPES = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'ANNUAL', label: 'Annual' },
];

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
    sectionHeader: 'text-xs uppercase tracking-wider text-[#94A3B8] font-medium pt-2',
} as const;

interface RecordMetricsButtonProps {
    companyId: string;
}

export function RecordMetricsButton({ companyId }: RecordMetricsButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [periodType, setPeriodType] = useState('QUARTERLY');

    const resetForm = () => {
        setPeriodType('QUARTERLY');
        setError(null);
    };

    const handleSubmit = (formData: FormData) => {
        setError(null);
        formData.set('companyId', companyId);
        formData.set('periodType', periodType);
        startTransition(async () => {
            const result = await recordPortfolioMetrics(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setOpen(false);
                resetForm();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Record Metrics
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[600px] max-h-[85vh] overflow-y-auto ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Record Metrics</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    {/* Period */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Period Date *</Label>
                            <Input
                                name="periodDate"
                                type="date"
                                className={dark.input}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Period Type</Label>
                            <Select value={periodType} onValueChange={setPeriodType}>
                                <SelectTrigger className={dark.input}>
                                    <SelectValue placeholder="Select period..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIOD_TYPES.map((pt) => (
                                        <SelectItem key={pt.value} value={pt.value}>
                                            {pt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Revenue & Profitability */}
                    <p className={dark.sectionHeader}>Revenue & Profitability</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Revenue</Label>
                            <Input
                                name="revenue"
                                type="text"
                                placeholder="$1,000,000"
                                className={dark.input}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>EBITDA</Label>
                            <Input
                                name="ebitda"
                                type="text"
                                placeholder="$250,000"
                                className={dark.input}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Net Income</Label>
                            <Input
                                name="netIncome"
                                type="text"
                                placeholder="$150,000"
                                className={dark.input}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Gross Profit</Label>
                            <Input
                                name="grossProfit"
                                type="text"
                                placeholder="$600,000"
                                className={dark.input}
                            />
                        </div>
                    </div>

                    {/* Operational */}
                    <p className={dark.sectionHeader}>Operational</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Employee Count</Label>
                            <Input
                                name="employeeCount"
                                type="number"
                                placeholder="25"
                                className={dark.input}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Customer Count</Label>
                            <Input
                                name="customerCount"
                                type="number"
                                placeholder="150"
                                className={dark.input}
                            />
                        </div>
                    </div>

                    {/* Valuation */}
                    <p className={dark.sectionHeader}>Valuation</p>
                    <div className="space-y-2">
                        <Label className={dark.label}>Current Valuation / Enterprise Value</Label>
                        <Input
                            name="currentValuation"
                            type="text"
                            placeholder="$5,000,000"
                            className={dark.input}
                        />
                    </div>

                    {/* Notes */}
                    <p className={dark.sectionHeader}>Commentary</p>
                    <div className="space-y-2">
                        <Label className={dark.label}>Highlights</Label>
                        <Textarea
                            name="highlights"
                            placeholder="Key wins, milestones achieved..."
                            className={`resize-none ${dark.input}`}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={dark.label}>Concerns</Label>
                        <Textarea
                            name="concerns"
                            placeholder="Risks, issues to monitor..."
                            className={`resize-none ${dark.input}`}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={dark.label}>Notes</Label>
                        <Textarea
                            name="notes"
                            placeholder="Additional context..."
                            className={`resize-none ${dark.input}`}
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className={`rounded-md p-3 text-sm ${dark.error}`}>
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                            className={dark.cancelBtn}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className={dark.saveBtn}
                        >
                            {isPending ? 'Recording...' : 'Record Metrics'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
