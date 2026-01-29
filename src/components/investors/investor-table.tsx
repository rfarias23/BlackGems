'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { InvestorStatusBadge, InvestorStatus } from './investor-status-badge';
import Link from 'next/link';
import { Search } from 'lucide-react';

export interface InvestorTableItem {
    id: string;
    name: string;
    type: string;
    status: InvestorStatus;
    email: string | null;
    contactName: string | null;
    totalCommitted: string;
    date: string;
}

interface InvestorTableProps {
    investors: InvestorTableItem[];
}

export function InvestorTable({ investors }: InvestorTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredInvestors = investors.filter((investor) => {
        const matchesSearch =
            investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (investor.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesStatus = statusFilter === 'all' || investor.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search investors..."
                            className="pl-8 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-card">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Prospect">Prospect</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Interested">Interested</SelectItem>
                            <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                            <SelectItem value="Committed">Committed</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Declined">Declined</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Investor Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Total Committed</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvestors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No investors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvestors.map((investor) => (
                                <TableRow key={investor.id}>
                                    <TableCell className="font-medium text-foreground">
                                        <Link href={`/investors/${investor.id}`} className="hover:underline hover:text-primary">
                                            {investor.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{investor.type}</TableCell>
                                    <TableCell>
                                        <InvestorStatusBadge status={investor.status} />
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="text-sm">{investor.contactName || '-'}</div>
                                            <div className="text-xs text-muted-foreground">{investor.email || ''}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{investor.totalCommitted}</TableCell>
                                    <TableCell>{investor.date}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/investors/${investor.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground">
                Showing {filteredInvestors.length} of {investors.length} investors
            </div>
        </div>
    );
}
