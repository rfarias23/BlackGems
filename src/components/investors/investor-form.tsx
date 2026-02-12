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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createInvestor } from '@/lib/actions/investors';
import Link from 'next/link';

const INVESTOR_TYPES = [
    'Individual',
    'Joint Account',
    'Trust',
    'IRA',
    'Family Office',
    'Foundation',
    'Endowment',
    'Pension Fund',
    'Fund of Funds',
    'Corporate',
    'Sovereign Wealth',
    'Insurance Company',
    'Bank',
    'Other',
];

const INVESTOR_STATUSES = [
    'Prospect',
    'Contacted',
    'Interested',
    'Due Diligence',
    'Committed',
    'Active',
    'Inactive',
    'Declined',
];

export function InvestorForm() {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | undefined, formData: FormData) => {
            const result = await createInvestor(formData);
            return result;
        },
        undefined
    );

    return (
        <form action={formAction} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Investor Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Smith or Acme Family Trust"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Investor Type *</Label>
                            <Select name="type" defaultValue="Individual">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INVESTOR_TYPES.map((type) => (
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
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue="Prospect">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INVESTOR_STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Entity Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="investor@example.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Primary Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Contact Name</Label>
                            <Input
                                id="contactName"
                                name="contactName"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                                id="contactEmail"
                                name="contactEmail"
                                type="email"
                                placeholder="jane@example.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                name="city"
                                placeholder="New York"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                name="state"
                                placeholder="NY"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                name="country"
                                placeholder="USA"
                                defaultValue="USA"
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
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Any relevant notes about this investor..."
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
                    <Link href="/investors">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending} variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    {isPending ? 'Creating...' : 'Create Investor'}
                </Button>
            </div>
        </form>
    );
}
