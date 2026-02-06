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
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Edit Deal</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Company Name</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={deal.name}
                            placeholder="Acme Corp"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stage">Stage</Label>
                            <DealStageSelect
                                value={deal.stage as DealStage}
                                onValueChange={(value) => {
                                    // Hidden input updated via the select
                                    const input = document.getElementById('stage-input') as HTMLInputElement;
                                    if (input) input.value = value;
                                }}
                            />
                            <input type="hidden" id="stage-input" name="stage" defaultValue={deal.stage} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sector">Sector</Label>
                            <Input
                                id="sector"
                                name="sector"
                                defaultValue={deal.industry || ''}
                                placeholder="Manufacturing"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="askPrice">Asking Price</Label>
                        <Input
                            id="askPrice"
                            name="askPrice"
                            defaultValue={deal.askingPrice || ''}
                            placeholder="$5,000,000"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description / Investment Thesis</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={deal.description || ''}
                            placeholder="Tell us about the deal..."
                            className="resize-none"
                            rows={4}
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
