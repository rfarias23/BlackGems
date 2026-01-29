'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { DistributionListItem } from '@/lib/actions/distributions';
import { Banknote } from 'lucide-react';

interface DistributionsTableProps {
    distributions: DistributionListItem[];
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Draft':
            return 'bg-slate-500/20 text-slate-400';
        case 'Approved':
            return 'bg-blue-500/20 text-blue-400';
        case 'Processing':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'Completed':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'Cancelled':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-slate-500/20 text-slate-400';
    }
}

function getTypeColor(type: string) {
    switch (type) {
        case 'Return of Capital':
            return 'bg-blue-500/20 text-blue-400';
        case 'Profit Distribution':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'Recallable Distribution':
            return 'bg-orange-500/20 text-orange-400';
        case 'Final Distribution':
            return 'bg-purple-500/20 text-purple-400';
        case 'Special Distribution':
            return 'bg-pink-500/20 text-pink-400';
        default:
            return 'bg-slate-500/20 text-slate-400';
    }
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export function DistributionsTable({ distributions }: DistributionsTableProps) {
    if (distributions.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No distributions yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create a distribution when you have returns to distribute to LPs.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground">Dist #</TableHead>
                            <TableHead className="text-muted-foreground">Fund</TableHead>
                            <TableHead className="text-muted-foreground">Date</TableHead>
                            <TableHead className="text-muted-foreground">Type</TableHead>
                            <TableHead className="text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-muted-foreground">Paid</TableHead>
                            <TableHead className="text-muted-foreground">Investors</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {distributions.map((dist) => (
                            <TableRow key={dist.id} className="border-border">
                                <TableCell>
                                    <Link
                                        href={`/capital/distributions/${dist.id}`}
                                        className="font-medium text-foreground hover:text-primary hover:underline"
                                    >
                                        #{dist.distributionNumber}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {dist.fundName}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(dist.distributionDate)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getTypeColor(dist.type)}>
                                        {dist.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {dist.totalAmount}
                                </TableCell>
                                <TableCell className="text-emerald-500">
                                    {dist.paidAmount}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {dist.itemCount}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(dist.status)}>
                                        {dist.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
