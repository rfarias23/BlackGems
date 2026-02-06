import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DealStageBadge, DealStage } from '@/components/deals/deal-stage-badge';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeal } from '@/lib/actions/deals';
import { getDealDocuments } from '@/lib/actions/documents';
import { DeleteDealButton } from '@/components/deals/delete-deal-button';
import { DealOverview } from '@/components/deals/deal-overview';
import { DocumentUploadButton } from '@/components/documents/document-upload-button';
import { DocumentList } from '@/components/documents/document-list';
import { AddContactButton } from '@/components/deals/add-contact-button';
import { ContactList } from '@/components/deals/contact-list';
import { auth } from '@/lib/auth';

// Format date helper
function formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

// Roles that can edit deals
const EDIT_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST'];

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [deal, session] = await Promise.all([getDeal(id), auth()]);
    const documents = deal ? await getDealDocuments(id) : [];

    if (!deal) {
        notFound();
    }

    const userRole = (session?.user as { role?: string })?.role || 'LP_VIEWER';
    const canEdit = EDIT_ROLES.includes(userRole);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild className="mt-1">
                        <Link href="/deals">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{deal.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{deal.industry || 'No sector'}</span>
                            <span>-</span>
                            <DealStageBadge stage={deal.stage as DealStage} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <DeleteDealButton dealId={deal.id} dealName={deal.name} />
                    )}
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <DealOverview
                        deal={{
                            id: deal.id,
                            name: deal.name,
                            stage: deal.stage,
                            industry: deal.industry,
                            askingPrice: deal.askingPrice,
                            revenue: deal.revenue,
                            ebitda: deal.ebitda,
                            ebitdaMargin: deal.ebitdaMargin,
                            description: deal.description,
                            investmentThesis: deal.investmentThesis,
                            keyRisks: deal.keyRisks,
                            valueCreationPlan: deal.valueCreationPlan,
                            yearFounded: deal.yearFounded,
                            employeeCount: deal.employeeCount,
                            city: deal.city,
                            state: deal.state,
                            country: deal.country,
                            firstContactDate: deal.firstContactDate,
                            ndaSignedDate: deal.ndaSignedDate,
                            cimReceivedDate: deal.cimReceivedDate,
                            managementMeetingDate: deal.managementMeetingDate,
                            loiSubmittedDate: deal.loiSubmittedDate,
                            expectedCloseDate: deal.expectedCloseDate,
                        }}
                        userRole={userRole}
                    />
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Data Room</h3>
                        {canEdit && <DocumentUploadButton dealId={deal.id} />}
                    </div>
                    <DocumentList documents={documents} canManage={canEdit} />
                </TabsContent>

                <TabsContent value="contacts">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Deal Team & External</h3>
                        {canEdit && <AddContactButton dealId={deal.id} />}
                    </div>
                    <ContactList contacts={deal.contacts} canManage={canEdit} />
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deal.activities.length > 0 ? (
                                <div className="space-y-8">
                                    {deal.activities.map((activity) => (
                                        <div key={activity.id} className="flex gap-4">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{activity.title}</p>
                                                {activity.description && (
                                                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                                                )}
                                                <div className="flex items-center pt-2 text-xs text-muted-foreground">
                                                    <Calendar className="mr-1 h-3 w-3" />
                                                    {formatDate(activity.createdAt)}
                                                    {activity.user.name && (
                                                        <span className="ml-2">by {activity.user.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No activity recorded yet.</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Activities will be logged as you interact with this deal.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Private Notes</CardTitle>
                            <CardDescription>Internal team notes not shared with external parties.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {deal.internalNotes ? (
                                <div className="prose prose-sm max-w-none text-muted-foreground">
                                    {deal.internalNotes}
                                </div>
                            ) : (
                                <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground italic">
                                    No notes yet. Start typing to add a note...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {deal.nextSteps && (
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none text-muted-foreground">
                                    {deal.nextSteps}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
