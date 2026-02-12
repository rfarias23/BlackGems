'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createCapitalCall } from '@/lib/actions/capital-calls';
import Link from 'next/link';

interface CapitalCallFormProps {
    funds: { id: string; name: string }[];
}

export function CapitalCallForm({ funds }: CapitalCallFormProps) {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | undefined, formData: FormData) => {
            const result = await createCapitalCall(formData);
            return result;
        },
        undefined
    );

    // Get today's date for default values
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
    const defaultDueDate = dueDate.toISOString().split('T')[0];

    if (funds.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-lg font-medium text-muted-foreground">No funds available</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            You need an active fund with committed investors to create a capital call.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/capital">Go Back</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <form action={formAction} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Call Details</CardTitle>
                    <CardDescription>
                        Select the fund and specify the amount to call from LPs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fundId">Fund *</Label>
                            <Select name="fundId" defaultValue={funds[0]?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select fund" />
                                </SelectTrigger>
                                <SelectContent>
                                    {funds.map((fund) => (
                                        <SelectItem key={fund.id} value={fund.id}>
                                            {fund.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalAmount">Total Amount *</Label>
                            <Input
                                id="totalAmount"
                                name="totalAmount"
                                type="text"
                                placeholder="$1,000,000"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="callDate">Call Date *</Label>
                            <Input
                                id="callDate"
                                name="callDate"
                                type="date"
                                defaultValue={today}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date *</Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                defaultValue={defaultDueDate}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Allocation Breakdown</CardTitle>
                    <CardDescription>
                        Optionally specify how the capital will be used.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="forInvestment">For Investment</Label>
                            <Input
                                id="forInvestment"
                                name="forInvestment"
                                type="text"
                                placeholder="$750,000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="forFees">Management Fees</Label>
                            <Input
                                id="forFees"
                                name="forFees"
                                type="text"
                                placeholder="$200,000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="forExpenses">Fund Expenses</Label>
                            <Input
                                id="forExpenses"
                                name="forExpenses"
                                type="text"
                                placeholder="$50,000"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dealReference">Deal Reference</Label>
                        <Input
                            id="dealReference"
                            name="dealReference"
                            placeholder="e.g., ABC Manufacturing Acquisition"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Purpose</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="purpose">Capital Call Purpose</Label>
                        <Textarea
                            id="purpose"
                            name="purpose"
                            placeholder="Describe the purpose of this capital call..."
                            className="min-h-[100px]"
                        />
                    </div>
                </CardContent>
            </Card>

            {state?.error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {state.error}
                </div>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                    <Link href="/capital">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending} variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    {isPending ? 'Creating...' : 'Create Capital Call'}
                </Button>
            </div>
        </form>
    );
}
