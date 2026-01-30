import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Calendar, DollarSign, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCapitalCall } from '@/lib/actions/capital-calls';
import { CapitalCallStatusActions } from '@/components/capital/capital-call-status-actions';
import { RecordPaymentButton } from '@/components/capital/record-payment-button';
import { DeleteCapitalCallButton } from '@/components/capital/delete-capital-call-button';

function formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
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

function getItemStatusColor(status: string) {
    switch (status) {
        case 'Pending':
            return 'bg-slate-500/20 text-slate-400';
        case 'Notified':
            return 'bg-blue-500/20 text-blue-400';
        case 'Partial':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'Paid':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'Overdue':
            return 'bg-orange-500/20 text-orange-400';
        case 'Defaulted':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-slate-500/20 text-slate-400';
    }
}

export default async function CapitalCallDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const call = await getCapitalCall(id);

    if (!call) {
        notFound();
    }

    const totalPaid = call.items.reduce(
        (sum, item) => sum + parseFloat(item.paidAmount.replace(/[$,]/g, '')),
        0
    );
    const totalCalled = call.items.reduce(
        (sum, item) => sum + parseFloat(item.callAmount.replace(/[$,]/g, '')),
        0
    );
    const paidCount = call.items.filter((item) => item.status === 'Paid').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild className="mt-1">
                        <Link href="/capital">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Capital Call #{call.callNumber}
                        </h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{call.fundName}</span>
                            <span>-</span>
                            <Badge className={getStatusColor(call.status)}>
                                {call.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CapitalCallStatusActions callId={call.id} currentStatus={call.status} />
                    {call.status === 'Draft' && (
                        <DeleteCapitalCallButton callId={call.id} callNumber={call.callNumber} />
                    )}
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Called</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{call.totalAmount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            ${totalPaid.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            ${(totalCalled - totalPaid).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Investors Paid</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {paidCount} / {call.items.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Call Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Call Date</span>
                            <span className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(call.callDate)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Due Date</span>
                            <span className="font-medium">{formatDate(call.dueDate)}</span>
                        </div>
                        {call.noticeDate && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Notice Sent</span>
                                <span className="font-medium">{formatDate(call.noticeDate)}</span>
                            </div>
                        )}
                        {call.completedDate && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Completed</span>
                                <span className="font-medium text-emerald-500">{formatDate(call.completedDate)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Allocation Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {call.forInvestment && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">For Investment</span>
                                <span className="font-medium">{call.forInvestment}</span>
                            </div>
                        )}
                        {call.forFees && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Management Fees</span>
                                <span className="font-medium">{call.forFees}</span>
                            </div>
                        )}
                        {call.forExpenses && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Fund Expenses</span>
                                <span className="font-medium">{call.forExpenses}</span>
                            </div>
                        )}
                        {call.dealReference && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Deal Reference</span>
                                <span className="font-medium">{call.dealReference}</span>
                            </div>
                        )}
                        {!call.forInvestment && !call.forFees && !call.forExpenses && (
                            <div className="text-sm text-muted-foreground italic">
                                No breakdown specified.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Purpose */}
            {call.purpose && (
                <Card>
                    <CardHeader>
                        <CardTitle>Purpose</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {call.purpose}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Investor Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Investor Contributions</CardTitle>
                    <CardDescription>Pro-rata capital calls for each LP</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground">Investor</TableHead>
                                <TableHead className="text-muted-foreground">Called</TableHead>
                                <TableHead className="text-muted-foreground">Paid</TableHead>
                                <TableHead className="text-muted-foreground">Outstanding</TableHead>
                                <TableHead className="text-muted-foreground">Status</TableHead>
                                <TableHead className="text-muted-foreground">Paid Date</TableHead>
                                <TableHead className="text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {call.items.map((item) => {
                                const called = parseFloat(item.callAmount.replace(/[$,]/g, ''));
                                const paid = parseFloat(item.paidAmount.replace(/[$,]/g, ''));
                                const outstanding = called - paid;
                                return (
                                    <TableRow key={item.id} className="border-border">
                                        <TableCell>
                                            <Link
                                                href={`/investors/${item.investorId}`}
                                                className="font-medium text-foreground hover:text-primary hover:underline"
                                            >
                                                {item.investorName}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="font-medium">{item.callAmount}</TableCell>
                                        <TableCell className="text-emerald-500">{item.paidAmount}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            ${outstanding.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getItemStatusColor(item.status)}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.paidDate ? formatDate(item.paidDate) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {item.status !== 'Paid' && (
                                                <RecordPaymentButton
                                                    itemId={item.id}
                                                    investorName={item.investorName}
                                                    callAmount={called}
                                                    paidAmount={paid}
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
