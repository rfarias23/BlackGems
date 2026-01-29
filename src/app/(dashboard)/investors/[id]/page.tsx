import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { InvestorStatusBadge, InvestorStatus } from '@/components/investors/investor-status-badge';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Shield, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInvestor } from '@/lib/actions/investors';
import { DeleteInvestorButton } from '@/components/investors/delete-investor-button';

function formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

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
    const investor = await getInvestor(id);

    if (!investor) {
        notFound();
    }

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
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
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

                    {/* Contact & Details */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {investor.contactName && (
                                    <div>
                                        <div className="text-sm font-medium">{investor.contactName}</div>
                                        {investor.contactTitle && (
                                            <div className="text-xs text-muted-foreground">{investor.contactTitle}</div>
                                        )}
                                    </div>
                                )}
                                {investor.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{investor.email}</span>
                                    </div>
                                )}
                                {investor.contactEmail && investor.contactEmail !== investor.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{investor.contactEmail} (contact)</span>
                                    </div>
                                )}
                                {investor.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{investor.phone}</span>
                                    </div>
                                )}
                                {(investor.city || investor.state || investor.country) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {[investor.city, investor.state, investor.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {!investor.email && !investor.phone && !investor.contactName && (
                                    <div className="text-sm text-muted-foreground italic">
                                        No contact information provided.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Entity Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Legal Name</span>
                                    <span className="font-medium">{investor.legalName || investor.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{investor.type}</span>
                                </div>
                                {investor.jurisdiction && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Jurisdiction</span>
                                        <span className="font-medium">{investor.jurisdiction}</span>
                                    </div>
                                )}
                                {investor.investmentCapacity && investor.investmentCapacity !== '$0' && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Investment Capacity</span>
                                        <span className="font-medium">{investor.investmentCapacity}</span>
                                    </div>
                                )}
                                {investor.source && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Source</span>
                                        <span className="font-medium">{investor.source}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Added</span>
                                    <span className="font-medium">{formatDate(investor.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Notes */}
                    {investor.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {investor.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="commitments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fund Commitments</CardTitle>
                            <CardDescription>Capital commitments across all funds</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {investor.commitments.length > 0 ? (
                                <div className="space-y-4">
                                    {investor.commitments.map((commitment) => (
                                        <div key={commitment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{commitment.fundName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Called: {commitment.calledAmount} / Paid: {commitment.paidAmount}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{commitment.committedAmount}</div>
                                                <Badge variant="outline" className="mt-1">{commitment.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
