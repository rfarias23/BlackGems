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
import { Plus } from 'lucide-react';
import { createDDItem } from '@/lib/actions/due-diligence';

const DD_CATEGORIES = [
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'ACCOUNTING', label: 'Accounting' },
    { value: 'TAX', label: 'Tax' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'COMMERCIAL', label: 'Commercial' },
    { value: 'OPERATIONAL', label: 'Operational' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'ENVIRONMENTAL', label: 'Environmental' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'REAL_ESTATE', label: 'Real Estate' },
    { value: 'IP', label: 'Intellectual Property' },
    { value: 'REGULATORY', label: 'Regulatory' },
    { value: 'QUALITY', label: 'Quality' },
    { value: 'OTHER', label: 'Other' },
];

const DD_STATUSES = [
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'PENDING_INFO', label: 'Pending Info' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'NA', label: 'N/A' },
];

const PRIORITIES = [
    { value: '1', label: '1 — Critical' },
    { value: '2', label: '2 — High' },
    { value: '3', label: '3 — Medium' },
    { value: '4', label: '4 — Low' },
    { value: '5', label: '5 — Optional' },
];

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
} as const;

interface AddDDItemButtonProps {
    dealId: string;
}

export function AddDDItemButton({ dealId }: AddDDItemButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('NOT_STARTED');
    const [priority, setPriority] = useState('3');

    const resetForm = () => {
        setCategory('');
        setStatus('NOT_STARTED');
        setPriority('3');
        setError(null);
    };

    const handleSubmit = (formData: FormData) => {
        setError(null);
        formData.set('category', category);
        formData.set('status', status);
        formData.set('priority', priority);
        startTransition(async () => {
            const result = await createDDItem(dealId, formData);
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
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[500px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Add DD Item</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Category *</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className={dark.input}>
                                    <SelectValue placeholder="Select category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {DD_CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className={dark.input}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map((p) => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Item Description *</Label>
                        <Input
                            name="item"
                            placeholder="e.g., Review audited financial statements"
                            className={dark.input}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className={dark.input}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DD_STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Assigned To</Label>
                            <Input
                                name="assignedTo"
                                placeholder="Name or initials"
                                className={dark.input}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Notes</Label>
                        <Textarea
                            name="notes"
                            placeholder="Internal notes for this DD item..."
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
                            disabled={!category || isPending}
                            className={dark.saveBtn}
                        >
                            {isPending ? 'Adding...' : 'Add Item'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
