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
import { createDealContact } from '@/lib/actions/deals';

const ROLES = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'CO_OWNER', label: 'Co-Owner' },
    { value: 'MANAGEMENT', label: 'Management' },
    { value: 'BROKER', label: 'Broker' },
    { value: 'ATTORNEY', label: 'Attorney' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'ADVISOR', label: 'Advisor' },
    { value: 'OTHER', label: 'Other' },
];

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
} as const;

interface AddContactButtonProps {
    dealId: string;
}

export function AddContactButton({ dealId }: AddContactButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState('');

    const resetForm = () => {
        setRole('');
        setError(null);
    };

    const handleSubmit = (formData: FormData) => {
        setError(null);
        formData.set('role', role);
        startTransition(async () => {
            const result = await createDealContact(dealId, formData);
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
                <Button size="sm" variant="outline" className="border-[#334155] text-[#F8FAFC] hover:bg-[#334155]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[500px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Add Contact</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Name *</Label>
                            <Input
                                name="name"
                                placeholder="John Smith"
                                className={dark.input}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Role *</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className={dark.input}>
                                    <SelectValue placeholder="Select role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Title</Label>
                        <Input
                            name="title"
                            placeholder="CEO, Managing Director, etc."
                            className={dark.input}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={dark.label}>Email</Label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="john@company.com"
                                className={dark.input}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={dark.label}>Phone</Label>
                            <Input
                                name="phone"
                                placeholder="+1 (555) 123-4567"
                                className={dark.input}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Notes</Label>
                        <Textarea
                            name="notes"
                            placeholder="Internal notes about this contact..."
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
                            disabled={!role || isPending}
                            className={dark.saveBtn}
                        >
                            {isPending ? 'Adding...' : 'Add Contact'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
