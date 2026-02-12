'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Download, FileText, Users } from 'lucide-react';
import { getLPCapitalStatement, LPCapitalStatement } from '@/lib/actions/reports';
import { generateCapitalStatementPDF, CapitalStatementData } from '@/lib/pdf/capital-statement';

interface LPStatementSelectorProps {
    investors: { id: string; name: string; type: string }[];
    fundName?: string;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

const typeDisplay: Record<string, string> = {
    INDIVIDUAL: 'Individual',
    JOINT: 'Joint',
    TRUST: 'Trust',
    IRA: 'IRA',
    FAMILY_OFFICE: 'Family Office',
    FOUNDATION: 'Foundation',
    ENDOWMENT: 'Endowment',
    PENSION: 'Pension',
    FUND_OF_FUNDS: 'Fund of Funds',
    CORPORATE: 'Corporate',
    OTHER: 'Other',
};

export function LPStatementSelector({ investors, fundName = 'BlackGem Fund I' }: LPStatementSelectorProps) {
    const [selectedInvestor, setSelectedInvestor] = useState<string>('');
    const [statement, setStatement] = useState<LPCapitalStatement | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleGenerateStatement = () => {
        if (!selectedInvestor) return;

        startTransition(async () => {
            const result = await getLPCapitalStatement(selectedInvestor);
            setStatement(result);
        });
    };

    if (investors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No investors with commitments found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Select Investor</label>
                    <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose an investor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {investors.map((investor) => (
                                <SelectItem key={investor.id} value={investor.id}>
                                    {investor.name} ({typeDisplay[investor.type] || investor.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={handleGenerateStatement}
                    disabled={!selectedInvestor || isPending}
                >
                    <FileText className="mr-2 h-4 w-4" />
                    {isPending ? 'Generating...' : 'Generate Statement'}
                </Button>
            </div>

            {statement && (
                <div className="space-y-4 border-t pt-6">
                    {/* Investor Info */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">{statement.investor.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {typeDisplay[statement.investor.type] || statement.investor.type}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const pdfData: CapitalStatementData = {
                                        fundName,
                                        investor: statement.investor,
                                        commitment: statement.commitment,
                                        performance: statement.performance,
                                        capitalCalls: statement.capitalCalls,
                                        distributions: statement.distributions,
                                    };
                                    generateCapitalStatementPDF(pdfData);
                                }}
                                className="text-white border-[#334155] hover:bg-[#334155]"
                            >
                                <Download className="mr-2 h-3.5 w-3.5" />
                                Export PDF
                            </Button>
                            <Badge variant="outline">
                                Ownership: {statement.commitment.ownershipPct}
                            </Badge>
                        </div>
                    </div>

                    {/* Capital Account Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Capital Account Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Committed</p>
                                    <p className="text-xl font-bold">{statement.commitment.committedAmount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Called</p>
                                    <p className="text-xl font-bold">{statement.commitment.calledAmount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Paid</p>
                                    <p className="text-xl font-bold">{statement.commitment.paidAmount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Distributed</p>
                                    <p className="text-xl font-bold text-emerald-500">{statement.commitment.distributedAmount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Unfunded</p>
                                    <p className="text-xl font-bold text-muted-foreground">{statement.commitment.unfundedAmount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Est. MOIC</p>
                                    <p className="text-xl font-bold">{statement.performance.moic}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Capital Calls */}
                    {statement.capitalCalls.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Capital Calls</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">Call #</TableHead>
                                            <TableHead className="text-muted-foreground">Date</TableHead>
                                            <TableHead className="text-muted-foreground">Called</TableHead>
                                            <TableHead className="text-muted-foreground">Paid</TableHead>
                                            <TableHead className="text-muted-foreground">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {statement.capitalCalls.map((call) => (
                                            <TableRow key={call.id} className="border-border">
                                                <TableCell>#{call.callNumber}</TableCell>
                                                <TableCell>{formatDate(call.callDate)}</TableCell>
                                                <TableCell>{call.amount}</TableCell>
                                                <TableCell className="text-emerald-500">{call.paidAmount}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{call.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Distributions */}
                    {statement.distributions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Distributions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-muted-foreground">Dist #</TableHead>
                                            <TableHead className="text-muted-foreground">Date</TableHead>
                                            <TableHead className="text-muted-foreground">Gross</TableHead>
                                            <TableHead className="text-muted-foreground">Net</TableHead>
                                            <TableHead className="text-muted-foreground">Type</TableHead>
                                            <TableHead className="text-muted-foreground">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {statement.distributions.map((dist) => (
                                            <TableRow key={dist.id} className="border-border">
                                                <TableCell>#{dist.distributionNumber}</TableCell>
                                                <TableCell>{formatDate(dist.date)}</TableCell>
                                                <TableCell>{dist.grossAmount}</TableCell>
                                                <TableCell className="text-emerald-500">{dist.netAmount}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{dist.type.replace(/_/g, ' ')}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{dist.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {statement.capitalCalls.length === 0 && statement.distributions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No capital calls or distributions recorded for this investor.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
