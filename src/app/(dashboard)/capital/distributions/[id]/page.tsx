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
import { ArrowLeft, Calendar, DollarSign, Users, Banknote } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDistribution, getDistributionPDFData } from '@/lib/actions/distributions';
import { DistributionStatusActions } from '@/components/capital/distribution-status-actions';
import { ProcessDistributionButton } from '@/components/capital/process-distribution-button';
import { DeleteDistributionButton } from '@/components/capital/delete-distribution-button';
import { DownloadDistributionNoticeButton } from '@/components/capital/download-distribution-notice-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { formatMoney, parseMoney, type CurrencyCode } from '@/lib/shared/formatters';
import { auth } from '@/lib/auth';
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access';

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

function getItemStatusColor(status: string) {
    switch (status) {
        case 'Pending':
            return 'bg-slate-500/20 text-slate-400';
        case 'Processing':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'Paid':
            return 'bg-emerald-500/20 text-emerald-400';
        case 'Failed':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-slate-500/20 text-slate-400';
    }
}

export default async function DistributionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [distribution, pdfData, session] = await Promise.all([
        getDistribution(id),
        getDistributionPDFData(id),
        auth(),
    ]);

    if (!distribution) {
        notFound();
    }

    const { currency } = session?.user?.id
        ? await getActiveFundWithCurrency(session.user.id)
        : { currency: 'USD' as CurrencyCode };

    const totalPaid = distribution.items
        .filter((item) => item.status === 'Paid')
        .reduce((sum, item) => sum + parseMoney(item.netAmount), 0);
    const totalNet = distribution.items.reduce(
        (sum, item) => sum + parseMoney(item.netAmount),
        0
    );
    const paidCount = distribution.items.filter((item) => item.status === 'Paid').length;

    return (
        <ErrorBoundary module="Distribution Detail">
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
                            Distribution #{distribution.distributionNumber}
                        </h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{distribution.fundName}</span>
                            <span>-</span>
                            <Badge className={getTypeColor(distribution.type)}>
                                {distribution.type}
                            </Badge>
                            <Badge className={getStatusColor(distribution.status)}>
                                {distribution.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pdfData && <DownloadDistributionNoticeButton data={pdfData} />}
                    <DistributionStatusActions
                        distributionId={distribution.id}
                        currentStatus={distribution.status}
                    />
                    {distribution.status === 'Draft' && (
                        <DeleteDistributionButton
                            distributionId={distribution.id}
                            distributionNumber={distribution.distributionNumber}
                        />
                    )}
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Distribution</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{distribution.totalAmount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {formatMoney(totalPaid, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">
                            {formatMoney(totalNet - totalPaid, currency)}
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
                            {paidCount} / {distribution.items.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribution Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Distribution Date</span>
                            <span className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(distribution.distributionDate)}
                            </span>
                        </div>
                        {distribution.approvedDate && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Approved Date</span>
                                <span className="font-medium">{formatDate(distribution.approvedDate)}</span>
                            </div>
                        )}
                        {distribution.paidDate && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Completed Date</span>
                                <span className="font-medium text-emerald-500">{formatDate(distribution.paidDate)}</span>
                            </div>
                        )}
                        {distribution.source && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Source</span>
                                <span className="font-medium">{distribution.source}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Amount Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {distribution.returnOfCapital && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Return of Capital</span>
                                <span className="font-medium">{distribution.returnOfCapital}</span>
                            </div>
                        )}
                        {distribution.realizedGains && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Realized Gains</span>
                                <span className="font-medium">{distribution.realizedGains}</span>
                            </div>
                        )}
                        {distribution.dividends && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Dividends</span>
                                <span className="font-medium">{distribution.dividends}</span>
                            </div>
                        )}
                        {distribution.interest && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Interest</span>
                                <span className="font-medium">{distribution.interest}</span>
                            </div>
                        )}
                        {!distribution.returnOfCapital && !distribution.realizedGains && !distribution.dividends && !distribution.interest && (
                            <div className="text-sm text-muted-foreground italic">
                                No breakdown specified.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            {distribution.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {distribution.notes}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Investor Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Investor Distributions</CardTitle>
                    <CardDescription>Pro-rata distributions for each LP</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground">Investor</TableHead>
                                <TableHead className="text-muted-foreground">Gross</TableHead>
                                <TableHead className="text-muted-foreground">Withholding</TableHead>
                                <TableHead className="text-muted-foreground">Net</TableHead>
                                <TableHead className="text-muted-foreground">Status</TableHead>
                                <TableHead className="text-muted-foreground">Paid Date</TableHead>
                                <TableHead className="text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {distribution.items.map((item) => (
                                <TableRow key={item.id} className="border-border">
                                    <TableCell>
                                        <Link
                                            href={`/investors/${item.investorId}`}
                                            className="font-medium text-foreground hover:text-primary hover:underline"
                                        >
                                            {item.investorName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.grossAmount}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.withholdingTax}</TableCell>
                                    <TableCell className="text-emerald-500 font-medium">{item.netAmount}</TableCell>
                                    <TableCell>
                                        <Badge className={getItemStatusColor(item.status)}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.paidDate ? formatDate(item.paidDate) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {item.status !== 'Paid' && distribution.status !== 'Draft' && (
                                            <ProcessDistributionButton
                                                itemId={item.id}
                                                investorName={item.investorName}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        </ErrorBoundary>
    );
}
