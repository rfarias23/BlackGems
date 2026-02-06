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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DealStageSelect } from './deal-stage-select';
import { DealStage } from './deal-stage-badge';
import { Edit } from 'lucide-react';
import { updateDeal } from '@/lib/actions/deals';

interface EditDealButtonProps {
    deal: {
        id: string;
        name: string;
        stage: string;
        industry: string | null;
        askingPrice: string | null;
        description: string | null;
    };
}

// Hardcoded dark palette — matches user menu dropdown in header.tsx
// Required because Dialog portal renders outside the dashboard layout
// div that sets the dark CSS variables via inline style.
const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
} as const;

export function EditDealButton({ deal }: EditDealButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            const result = await updateDeal(deal.id, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Deal
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[525px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC]">Edit Deal</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className={dark.label}>Company Name</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={deal.name}
                            placeholder="Acme Corp"
                            className={dark.input}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stage" className={dark.label}>Stage</Label>
                            <DealStageSelect
                                value={deal.stage as DealStage}
                                onValueChange={(value) => {
                                    const input = document.getElementById('stage-input') as HTMLInputElement;
                                    if (input) input.value = value;
                                }}
                                className={dark.input}
                            />
                            <input type="hidden" id="stage-input" name="stage" defaultValue={deal.stage} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sector" className={dark.label}>Sector</Label>
                            <Input
                                id="sector"
                                name="sector"
                                defaultValue={deal.industry || ''}
                                placeholder="Manufacturing"
                                className={dark.input}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="askPrice" className={dark.label}>Asking Price</Label>
                        <Input
                            id="askPrice"
                            name="askPrice"
                            defaultValue={deal.askingPrice || ''}
                            placeholder="$5,000,000"
                            className={dark.input}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className={dark.label}>Description / Investment Thesis</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={deal.description || ''}
                            placeholder="Tell us about the deal..."
                            className={`resize-none ${dark.input}`}
                            rows={4}
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
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
