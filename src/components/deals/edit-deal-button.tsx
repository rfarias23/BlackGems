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
        yearFounded: number | null;
        employeeCount: number | null;
        city: string | null;
        state: string | null;
        country: string;
    };
}

// Hardcoded dark palette — matches user menu dropdown in header.tsx
// Required because Dialog portal renders outside the dashboard layout
// div that sets the dark CSS variables via inline style.
const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    section: 'text-[#F8FAFC] text-sm font-medium border-t border-[#334155] pt-4 mt-2',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
} as const;

export function EditDealButton({ deal }: EditDealButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<string>(deal.stage);

    const handleSubmit = (formData: FormData) => {
        setError(null);
        formData.set('stage', selectedStage);
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
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen) {
                setSelectedStage(deal.stage);
                setError(null);
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Deal
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[525px] max-h-[85vh] overflow-y-auto ${dark.dialog}`}>
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
                            <Label className={dark.label}>Stage</Label>
                            <DealStageSelect
                                value={selectedStage as DealStage}
                                onValueChange={(value) => setSelectedStage(value)}
                                className={dark.input}
                            />
                            <input type="hidden" name="stage" value={selectedStage} />
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
                            rows={3}
                        />
                    </div>

                    {/* Company Details Section */}
                    <div className={dark.section}>Company Details</div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="yearFounded" className={dark.label}>Year Founded</Label>
                            <Input
                                id="yearFounded"
                                name="yearFounded"
                                type="number"
                                defaultValue={deal.yearFounded || ''}
                                placeholder="2005"
                                className={dark.input}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employeeCount" className={dark.label}>Employees</Label>
                            <Input
                                id="employeeCount"
                                name="employeeCount"
                                type="number"
                                defaultValue={deal.employeeCount || ''}
                                placeholder="50"
                                className={dark.input}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city" className={dark.label}>City</Label>
                            <Input
                                id="city"
                                name="city"
                                defaultValue={deal.city || ''}
                                placeholder="Miami"
                                className={dark.input}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state" className={dark.label}>State</Label>
                            <Input
                                id="state"
                                name="state"
                                defaultValue={deal.state || ''}
                                placeholder="FL"
                                className={dark.input}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country" className={dark.label}>Country</Label>
                            <Input
                                id="country"
                                name="country"
                                defaultValue={deal.country || ''}
                                placeholder="USA"
                                className={dark.input}
                            />
                        </div>
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
