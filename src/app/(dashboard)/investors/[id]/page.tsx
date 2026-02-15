import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InvestorStatusBadge, InvestorStatus } from '@/components/investors/investor-status-badge';
import { InvestorOverview } from '@/components/investors/investor-overview';
import { AddCommitmentButton } from '@/components/investors/add-commitment-button';
import { CommitmentList } from '@/components/investors/commitment-list';
import { InvestorCompliance } from '@/components/investors/investor-compliance';
import { DocumentUploadButton } from '@/components/documents/document-upload-button';
import { DocumentList } from '@/components/documents/document-list';
import { ArrowLeft, DollarSign, Building2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInvestor, getInvestorCommunications } from '@/lib/actions/investors';
import { getInvestorDocuments } from '@/lib/actions/documents';
import { DeleteInvestorButton } from '@/components/investors/delete-investor-button';
import { InvestorCommunications } from '@/components/investors/investor-communications';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { auth } from '@/lib/auth';

export default async function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [investor, session, documents, communications] = await Promise.all([
        getInvestor(id),
        auth(),
        getInvestorDocuments(id),
        getInvestorCommunications(id),
    ]);

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
        <ErrorBoundary module="Investor Detail">
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
                    <TabsTrigger value="communications">Communications</TabsTrigger>
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
                    <InvestorCompliance investor={investor} userRole={userRole} />
                </TabsContent>

                <TabsContent value="communications" className="space-y-4">
                    <InvestorCommunications
                        investorId={investor.id}
                        investorName={investor.name}
                        investorEmail={investor.contactEmail || investor.email}
                        communications={communications}
                    />
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>Subscription agreements, tax forms, and compliance documents</CardDescription>
                            </div>
                            {canEdit && <DocumentUploadButton investorId={investor.id} />}
                        </CardHeader>
                        <CardContent>
                            {documents.length > 0 ? (
                                <DocumentList documents={documents} canManage={canEdit} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No documents uploaded yet.</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Upload subscription agreements, tax forms, and compliance documents.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        </ErrorBoundary>
    );
}
