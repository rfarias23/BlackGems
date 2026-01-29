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
import { createDistribution } from '@/lib/actions/distributions';
import Link from 'next/link';

const DISTRIBUTION_TYPES = [
    'Return of Capital',
    'Profit Distribution',
    'Recallable Distribution',
    'Final Distribution',
    'Special Distribution',
];

interface DistributionFormProps {
    funds: { id: string; name: string }[];
}

export function DistributionForm({ funds }: DistributionFormProps) {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | undefined, formData: FormData) => {
            const result = await createDistribution(formData);
            return result;
        },
        undefined
    );

    // Get today's date for default value
    const today = new Date().toISOString().split('T')[0];

    if (funds.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-lg font-medium text-muted-foreground">No funds available</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            You need a fund with active investments to create a distribution.
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
                    <CardTitle>Distribution Details</CardTitle>
                    <CardDescription>
                        Select the fund and specify the amount to distribute to LPs.
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
                            <Label htmlFor="type">Distribution Type *</Label>
                            <Select name="type" defaultValue="Profit Distribution">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISTRIBUTION_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="distributionDate">Distribution Date *</Label>
                            <Input
                                id="distributionDate"
                                name="distributionDate"
                                type="date"
                                defaultValue={today}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalAmount">Total Amount *</Label>
                            <Input
                                id="totalAmount"
                                name="totalAmount"
                                type="text"
                                placeholder="$500,000"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="source">Source / Exit Reference</Label>
                        <Input
                            id="source"
                            name="source"
                            placeholder="e.g., Sale of ABC Manufacturing"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Amount Breakdown</CardTitle>
                    <CardDescription>
                        Optionally break down the distribution by type.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="returnOfCapital">Return of Capital</Label>
                            <Input
                                id="returnOfCapital"
                                name="returnOfCapital"
                                type="text"
                                placeholder="$200,000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="realizedGains">Realized Gains</Label>
                            <Input
                                id="realizedGains"
                                name="realizedGains"
                                type="text"
                                placeholder="$250,000"
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="dividends">Dividends</Label>
                            <Input
                                id="dividends"
                                name="dividends"
                                type="text"
                                placeholder="$30,000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="interest">Interest Income</Label>
                            <Input
                                id="interest"
                                name="interest"
                                type="text"
                                placeholder="$20,000"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Distribution Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Additional notes about this distribution..."
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
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Distribution'}
                </Button>
            </div>
        </form>
    );
}
