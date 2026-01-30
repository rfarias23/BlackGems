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
import { CapitalCallListItem } from '@/lib/actions/capital-calls';
import { DollarSign } from 'lucide-react';

interface CapitalCallsTableProps {
    calls: CapitalCallListItem[];
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Draft':
            return 'bg-slate-500/20 text-slate-400';
        case 'Approved':
            return 'bg-blue-500/20 text-blue-400';
        case 'Sent':
            return 'bg-purple-500/20 text-purple-400';
        case 'Partially Funded':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'Fully Funded':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'Cancelled':
            return 'bg-red-500/20 text-red-400';
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

export function CapitalCallsTable({ calls }: CapitalCallsTableProps) {
    if (calls.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No capital calls yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create your first capital call to request funds from LPs.
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
                            <TableHead className="text-muted-foreground">Call #</TableHead>
                            <TableHead className="text-muted-foreground">Fund</TableHead>
                            <TableHead className="text-muted-foreground">Call Date</TableHead>
                            <TableHead className="text-muted-foreground">Due Date</TableHead>
                            <TableHead className="text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-muted-foreground">Paid</TableHead>
                            <TableHead className="text-muted-foreground">Investors</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {calls.map((call) => (
                            <TableRow key={call.id} className="border-border">
                                <TableCell>
                                    <Link
                                        href={`/capital/calls/${call.id}`}
                                        className="font-medium text-foreground hover:text-primary hover:underline"
                                    >
                                        #{call.callNumber}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {call.fundName}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(call.callDate)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(call.dueDate)}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {call.totalAmount}
                                </TableCell>
                                <TableCell className="text-emerald-500">
                                    {call.paidAmount}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {call.itemCount}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(call.status)}>
                                        {call.status}
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
