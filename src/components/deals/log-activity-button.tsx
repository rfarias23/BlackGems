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
import { createDealActivity } from '@/lib/actions/activities';

const ACTIVITY_TYPES = [
    { value: 'CALL', label: 'Phone Call' },
    { value: 'MEETING', label: 'Meeting' },
    { value: 'EMAIL_SENT', label: 'Email Sent' },
    { value: 'EMAIL_RECEIVED', label: 'Email Received' },
    { value: 'SITE_VISIT', label: 'Site Visit' },
    { value: 'NOTE', label: 'Note' },
    { value: 'DOCUMENT_SENT', label: 'Document Sent' },
    { value: 'DOCUMENT_RECEIVED', label: 'Document Received' },
    { value: 'TASK_COMPLETED', label: 'Task Completed' },
    { value: 'COMMENT', label: 'Comment' },
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

interface LogActivityButtonProps {
    dealId: string;
}

export function LogActivityButton({ dealId }: LogActivityButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [type, setType] = useState('');

    const resetForm = () => {
        setType('');
        setError(null);
    };

    const handleSubmit = (formData: FormData) => {
        setError(null);
        formData.set('type', type);
        startTransition(async () => {
            const result = await createDealActivity(dealId, formData);
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
                    Log Activity
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[500px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Log Activity</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className={dark.label}>Type *</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className={dark.input}>
                                <SelectValue placeholder="Select activity type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ACTIVITY_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Title *</Label>
                        <Input
                            name="title"
                            placeholder="e.g., Follow-up call with CEO"
                            className={dark.input}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Description</Label>
                        <Textarea
                            name="description"
                            placeholder="Details about the activity..."
                            className={`resize-none ${dark.input}`}
                            rows={3}
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
                            disabled={!type || isPending}
                            className={dark.saveBtn}
                        >
                            {isPending ? 'Logging...' : 'Log Activity'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
