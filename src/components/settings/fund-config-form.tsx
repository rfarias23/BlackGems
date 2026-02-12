'use client';

import { useActionState, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateFundConfig, updateFundStatus, FundConfig } from '@/lib/actions/settings';
import { Building2, DollarSign, Percent } from 'lucide-react';

interface FundConfigFormProps {
    fund: FundConfig;
}

const fundTypeDisplay: Record<string, string> = {
    TRADITIONAL_SEARCH_FUND: 'Traditional Search Fund',
    SELF_FUNDED_SEARCH: 'Self-Funded Search',
    ACCELERATOR_FUND: 'Accelerator Fund',
    ACQUISITION_FUND: 'Acquisition Fund',
    PE_FUND: 'PE Fund',
    HOLDING_COMPANY: 'Holding Company',
};

const fundStatusOptions = [
    'Raising',
    'Searching',
    'Under LOI',
    'Acquired',
    'Operating',
    'Preparing Exit',
    'Exited',
    'Dissolved',
    'Closed',
];

const statusColors: Record<string, string> = {
    RAISING: 'bg-blue-500/20 text-blue-400',
    SEARCHING: 'bg-purple-500/20 text-purple-400',
    UNDER_LOI: 'bg-yellow-500/20 text-yellow-400',
    ACQUIRED: 'bg-emerald-500/20 text-emerald-400',
    OPERATING: 'bg-emerald-500/20 text-emerald-400',
    PREPARING_EXIT: 'bg-orange-500/20 text-orange-400',
    EXITED: 'bg-slate-500/20 text-slate-400',
    DISSOLVED: 'bg-red-500/20 text-red-400',
    CLOSED: 'bg-slate-500/20 text-slate-400',
};

export function FundConfigForm({ fund }: FundConfigFormProps) {
    const [statusPending, startStatusTransition] = useTransition();
    const [statusError, setStatusError] = useState<string | null>(null);

    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) => {
            const result = await updateFundConfig(formData);
            return result;
        },
        undefined
    );

    const handleStatusChange = (newStatus: string) => {
        setStatusError(null);
        startStatusTransition(async () => {
            const result = await updateFundStatus(fund.id, newStatus);
            if (result.error) {
                setStatusError(result.error);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Fund Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Fund Status
                        </span>
                        <Badge className={statusColors[fund.status] || 'bg-slate-500/20 text-slate-400'}>
                            {fund.status}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Current lifecycle status of the fund.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Label>Change Status</Label>
                            <Select onValueChange={handleStatusChange} disabled={statusPending}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fundStatusOptions.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label>Fund Type</Label>
                            <div className="mt-1 h-10 flex items-center">
                                <Badge variant="outline">
                                    {fundTypeDisplay[fund.type] || fund.type}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Label>Vintage</Label>
                            <div className="mt-1 h-10 flex items-center text-sm font-medium">
                                {fund.vintage}
                            </div>
                        </div>
                    </div>
                    {statusError && (
                        <div className="mt-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {statusError}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fund Details Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Fund Details
                    </CardTitle>
                    <CardDescription>
                        Update fund name, description, and capital structure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="fundId" value={fund.id} />

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Fund Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={fund.name}
                                    placeholder="Fund name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="legalName">Legal Name</Label>
                                <Input
                                    id="legalName"
                                    name="legalName"
                                    defaultValue={fund.legalName || ''}
                                    placeholder="Legal entity name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={fund.description || ''}
                                placeholder="Fund investment strategy and focus..."
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="targetSize">Target Size *</Label>
                                <Input
                                    id="targetSize"
                                    name="targetSize"
                                    defaultValue={fund.targetSize}
                                    placeholder="$50,000,000"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hardCap">Hard Cap</Label>
                                <Input
                                    id="hardCap"
                                    name="hardCap"
                                    defaultValue={fund.hardCap || ''}
                                    placeholder="$75,000,000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minimumCommitment">Minimum Commitment</Label>
                                <Input
                                    id="minimumCommitment"
                                    name="minimumCommitment"
                                    defaultValue={fund.minimumCommitment || ''}
                                    placeholder="$250,000"
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
                                <Percent className="h-4 w-4" />
                                Fee Structure
                            </h4>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="managementFee">Management Fee *</Label>
                                    <Input
                                        id="managementFee"
                                        name="managementFee"
                                        defaultValue={fund.managementFee}
                                        placeholder="2.00%"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="carriedInterest">Carried Interest *</Label>
                                    <Input
                                        id="carriedInterest"
                                        name="carriedInterest"
                                        defaultValue={fund.carriedInterest}
                                        placeholder="20.00%"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hurdleRate">Hurdle Rate</Label>
                                    <Input
                                        id="hurdleRate"
                                        name="hurdleRate"
                                        defaultValue={fund.hurdleRate || ''}
                                        placeholder="8.00%"
                                    />
                                </div>
                            </div>
                        </div>

                        {state?.error && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                {state.error}
                            </div>
                        )}

                        {state?.success && (
                            <div className="rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-500">
                                Fund configuration updated successfully.
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending} variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                                {isPending ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
