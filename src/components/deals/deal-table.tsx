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
import { DealStageBadge, DealStage } from './deal-stage-badge';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';

export interface DealTableItem {
    id: string;
    name: string;
    stage: DealStage;
    sector: string | null;
    askPrice: string | null;
    date: string;
}

interface DealTableProps {
    deals: DealTableItem[];
}

export function DealTable({ deals }: DealTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState<string>('all');

    const filteredDeals = deals.filter((deal) => {
        const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
        return matchesSearch && matchesStage;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search deals..."
                            className="pl-8 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground mr-2 md:hidden" />
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                        <SelectTrigger className="w-[180px] bg-card">
                            <SelectValue placeholder="Filter by Stage" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            <SelectItem value="Identified">Identified</SelectItem>
                            <SelectItem value="Initial Review">Initial Review</SelectItem>
                            <SelectItem value="NDA Signed">NDA Signed</SelectItem>
                            <SelectItem value="IOI Submitted">IOI Submitted</SelectItem>
                            <SelectItem value="LOI Negotiation">LOI Negotiation</SelectItem>
                            <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                            <SelectItem value="Closing">Closing</SelectItem>
                            <SelectItem value="Closed Won">Closed Won</SelectItem>
                            <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Sector</TableHead>
                            <TableHead>Ask Price</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDeals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No deals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDeals.map((deal) => (
                                <TableRow key={deal.id}>
                                    <TableCell className="font-medium text-foreground">
                                        <Link href={`/deals/${deal.id}`} className="hover:underline hover:text-primary">
                                            {deal.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <DealStageBadge stage={deal.stage} />
                                    </TableCell>
                                    <TableCell>{deal.sector}</TableCell>
                                    <TableCell>{deal.askPrice}</TableCell>
                                    <TableCell>{deal.date}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/deals/${deal.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground">
                Showing {filteredDeals.length} of {deals.length} deals
            </div>
        </div>
    );
}
