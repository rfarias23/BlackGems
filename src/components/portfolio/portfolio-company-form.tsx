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
import { createPortfolioCompany } from '@/lib/actions/portfolio';
import Link from 'next/link';

const INDUSTRIES = [
    'Manufacturing',
    'Business Services',
    'Healthcare',
    'Technology',
    'Consumer',
    'Industrial',
    'Financial Services',
    'Real Estate',
    'Transportation',
    'Energy',
    'Other',
];

interface PortfolioCompanyFormProps {
    funds: { id: string; name: string }[];
}

export function PortfolioCompanyForm({ funds }: PortfolioCompanyFormProps) {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | undefined, formData: FormData) => {
            const result = await createPortfolioCompany(formData);
            return result;
        },
        undefined
    );

    // Default acquisition date to today
    const today = new Date().toISOString().split('T')[0];

    if (funds.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-lg font-medium text-muted-foreground">No funds available</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            You need a fund to add portfolio companies.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/portfolio">Go Back</Link>
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
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>
                        Basic details about the acquired company.
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
                            <Label htmlFor="name">Company Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="ABC Manufacturing"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select name="industry">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDUSTRIES.map((industry) => (
                                        <SelectItem key={industry} value={industry}>
                                            {industry}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headquarters">Headquarters</Label>
                            <Input
                                id="headquarters"
                                name="headquarters"
                                placeholder="Austin, TX"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            name="website"
                            type="url"
                            placeholder="https://example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Brief description of the company..."
                            className="min-h-[80px]"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Investment Details</CardTitle>
                    <CardDescription>
                        Financial details of the acquisition.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="acquisitionDate">Acquisition Date *</Label>
                            <Input
                                id="acquisitionDate"
                                name="acquisitionDate"
                                type="date"
                                defaultValue={today}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownershipPct">Ownership % *</Label>
                            <Input
                                id="ownershipPct"
                                name="ownershipPct"
                                placeholder="85"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="entryValuation">Entry Valuation (EV) *</Label>
                            <Input
                                id="entryValuation"
                                name="entryValuation"
                                placeholder="$10,000,000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="equityInvested">Equity Invested *</Label>
                            <Input
                                id="equityInvested"
                                name="equityInvested"
                                placeholder="$4,000,000"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="debtFinancing">Debt Financing</Label>
                            <Input
                                id="debtFinancing"
                                name="debtFinancing"
                                placeholder="$6,000,000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="entryEbitda">Entry EBITDA</Label>
                            <Input
                                id="entryEbitda"
                                name="entryEbitda"
                                placeholder="$2,000,000"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="entryRevenue">Entry Revenue</Label>
                        <Input
                            id="entryRevenue"
                            name="entryRevenue"
                            placeholder="$15,000,000"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Management</CardTitle>
                    <CardDescription>
                        Key management contacts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ceoName">CEO Name</Label>
                            <Input
                                id="ceoName"
                                name="ceoName"
                                placeholder="John Smith"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ceoEmail">CEO Email</Label>
                            <Input
                                id="ceoEmail"
                                name="ceoEmail"
                                type="email"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Investment Thesis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="investmentThesis">Investment Thesis</Label>
                        <Textarea
                            id="investmentThesis"
                            name="investmentThesis"
                            placeholder="Describe the investment thesis, value creation plan, and key drivers..."
                            className="min-h-[120px]"
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
                    <Link href="/portfolio">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending} variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    {isPending ? 'Creating...' : 'Add Company'}
                </Button>
            </div>
        </form>
    );
}
