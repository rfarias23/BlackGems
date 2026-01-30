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
import { PortfolioCompanyListItem } from '@/lib/actions/portfolio';
import { Building2 } from 'lucide-react';

interface PortfolioTableProps {
    companies: PortfolioCompanyListItem[];
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Holding':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'Preparing Exit':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'Under LOI':
            return 'bg-blue-500/20 text-blue-400';
        case 'Partial Exit':
            return 'bg-purple-500/20 text-purple-400';
        case 'Exited':
            return 'bg-slate-500/20 text-slate-400';
        case 'Written Off':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-slate-500/20 text-slate-400';
    }
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
    }).format(new Date(date));
}

export function PortfolioTable({ companies }: PortfolioTableProps) {
    if (companies.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No portfolio companies yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Add your first portfolio company to start tracking performance.
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
                            <TableHead className="text-muted-foreground">Company</TableHead>
                            <TableHead className="text-muted-foreground">Industry</TableHead>
                            <TableHead className="text-muted-foreground">Acquired</TableHead>
                            <TableHead className="text-muted-foreground">Invested</TableHead>
                            <TableHead className="text-muted-foreground">Entry Val.</TableHead>
                            <TableHead className="text-muted-foreground">Current Val.</TableHead>
                            <TableHead className="text-muted-foreground">MOIC</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.map((company) => (
                            <TableRow key={company.id} className="border-border">
                                <TableCell>
                                    <Link
                                        href={`/portfolio/${company.id}`}
                                        className="font-medium text-foreground hover:text-primary hover:underline"
                                    >
                                        {company.name}
                                    </Link>
                                    <div className="text-xs text-muted-foreground">
                                        {company.fundName}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {company.industry || '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(company.acquisitionDate)}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {company.equityInvested}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {company.entryValuation}
                                </TableCell>
                                <TableCell className="text-emerald-500 font-medium">
                                    {company.currentValuation || '-'}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {company.moic || '1.00x'}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(company.status)}>
                                        {company.status}
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
