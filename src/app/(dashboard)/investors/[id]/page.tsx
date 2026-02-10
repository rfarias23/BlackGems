import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { InvestorStatusBadge, InvestorStatus } from '@/components/investors/investor-status-badge';
import { InvestorOverview } from '@/components/investors/investor-overview';
import { AddCommitmentButton } from '@/components/investors/add-commitment-button';
import { CommitmentList } from '@/components/investors/commitment-list';
import { ArrowLeft, Shield, DollarSign, Building2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInvestor } from '@/lib/actions/investors';
import { DeleteInvestorButton } from '@/components/investors/delete-investor-button';
import { auth } from '@/lib/auth';

function getKYCBadgeColor(status: string) {
    switch (status) {
        case 'APPROVED': return 'bg-emerald-500/20 text-emerald-400';
        case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400';
        case 'REJECTED': return 'bg-red-500/20 text-red-400';
        case 'EXPIRED': return 'bg-orange-500/20 text-orange-400';
        default: return 'bg-slate-500/20 text-slate-400';
    }
}

function getAMLBadgeColor(status: string) {
    switch (status) {
        case 'CLEARED': return 'bg-emerald-500/20 text-emerald-400';
        case 'FLAGGED': return 'bg-orange-500/20 text-orange-400';
        case 'REJECTED': return 'bg-red-500/20 text-red-400';
        default: return 'bg-slate-500/20 text-slate-400';
    }
}

export default async function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [investor, session] = await Promise.all([getInvestor(id), auth()]);

    if (!investor) {
        notFound();
    }

    const userRole = (session?.user as { role?: string })?.role || 'LP_VIEWER';
    const canEdit = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST'].includes(userRole);

    const totalCommitted = investor.commitments.reduce(
        (sum, c) => sum + parseFloat(c.committedAmount.replace(/[$,]/g, '')),
        0
    );
    const totalCalled = investor.commitments.reduce(
        (sum, c) => sum + parseFloat(c.calledAmount.replace(/[$,]/g, '')),
        0
    );
    const totalPaid = investor.commitments.reduce(
        (sum, c) => sum + parseFloat(c.paidAmount.replace(/[$,]/g, '')),
        0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild className="mt-1">
                        <Link href="/investors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{investor.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{investor.type}</span>
                            <span>-</span>
                            <InvestorStatusBadge status={investor.status as InvestorStatus} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DeleteInvestorButton investorId={investor.id} investorName={investor.name} />
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="commitments">Commitments</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Committed</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalCommitted.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Called</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalCalled.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-500">${totalPaid.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Unfunded</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-muted-foreground">
                                    ${(totalCommitted - totalCalled).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Inline-editable overview */}
                    <InvestorOverview investor={investor} userRole={userRole} />
                </TabsContent>

                <TabsContent value="commitments" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Fund Commitments</CardTitle>
                                <CardDescription>Capital commitments across all funds</CardDescription>
                            </div>
                            {canEdit && <AddCommitmentButton investorId={investor.id} />}
                        </CardHeader>
                        <CardContent>
                            {investor.commitments.length > 0 ? (
                                <CommitmentList commitments={investor.commitments} canEdit={canEdit} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No commitments yet.</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Add a commitment when this investor subscribes to a fund.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    KYC Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge className={getKYCBadgeColor(investor.kycStatus)}>
                                            {investor.kycStatus}
                                        </Badge>
                                    </div>
                                    {investor.accreditedStatus && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Accreditation</span>
                                            <span className="text-sm font-medium">
                                                {investor.accreditedStatus.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    AML Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge className={getAMLBadgeColor(investor.amlStatus)}>
                                        {investor.amlStatus}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No documents uploaded yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Upload subscription agreements, tax forms, and compliance documents.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
