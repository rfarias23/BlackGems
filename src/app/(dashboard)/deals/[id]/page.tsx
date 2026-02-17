import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DealStageBadge, DealStage } from '@/components/deals/deal-stage-badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeal, getDealPortfolioLink, getDealRawData, getDealAnalytics, getDealScores, getDealSources } from '@/lib/actions/deals';
import { getDealDocuments } from '@/lib/actions/documents';
import { getDealTimeline } from '@/lib/actions/activities';
import { getDealNotes } from '@/lib/actions/notes';
import { getDealTasks, getFundMembers } from '@/lib/actions/tasks';
import { DeleteDealButton } from '@/components/deals/delete-deal-button';
import { DealOverview } from '@/components/deals/deal-overview';
import { DocumentUploadButton } from '@/components/documents/document-upload-button';
import { DocumentList } from '@/components/documents/document-list';
import { AddContactButton } from '@/components/deals/add-contact-button';
import { ContactList } from '@/components/deals/contact-list';
import { LogActivityButton } from '@/components/deals/log-activity-button';
import { ActivityTimeline } from '@/components/deals/activity-timeline';
import { NoteList } from '@/components/deals/note-list';
import { DDTracker } from '@/components/deals/dd-tracker';
import { AddDDItemButton } from '@/components/deals/add-dd-item-button';
import { getDealDueDiligence, getDDStats } from '@/lib/actions/due-diligence';
import { DealAnalyticsTab } from '@/components/deals/deal-analytics';
import { DealTasks } from '@/components/deals/deal-tasks';
import { AddTaskButton } from '@/components/deals/add-task-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DealScoring } from '@/components/deals/deal-scoring';
import { DealSourceSelect } from '@/components/deals/deal-source-select';
import { auth } from '@/lib/auth';
import { getActiveFundWithCurrency } from '@/lib/shared/fund-access';
import type { CurrencyCode } from '@/lib/shared/formatters';

// Roles that can edit deals
const EDIT_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST'];

// Safely execute a server action, returning fallback on error
async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        console.error(`[DealDetail] ${label} failed:`, error);
        return fallback;
    }
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [deal, session] = await Promise.all([getDeal(id), auth()]);

    if (!deal) {
        notFound();
    }

    const [documents, timeline, notes, ddItems, ddStats, portfolioLink, rawDeal, analytics, tasks, members, scores, dealSources] = await Promise.all([
        safe(() => getDealDocuments(id), [], 'getDealDocuments'),
        safe(() => getDealTimeline(id), [], 'getDealTimeline'),
        safe(() => getDealNotes(id), [], 'getDealNotes'),
        safe(() => getDealDueDiligence(id), [], 'getDealDueDiligence'),
        safe(() => getDDStats(id), null, 'getDDStats'),
        safe(() => getDealPortfolioLink(id), null, 'getDealPortfolioLink'),
        safe(() => getDealRawData(id), null, 'getDealRawData'),
        safe(() => getDealAnalytics(id), null, 'getDealAnalytics'),
        safe(() => getDealTasks(id), [], 'getDealTasks'),
        safe(() => getFundMembers(id), [], 'getFundMembers'),
        safe(() => getDealScores(id), null, 'getDealScores'),
        safe(() => getDealSources(), [], 'getDealSources'),
    ]);

    const { currency } = session?.user?.id
        ? await getActiveFundWithCurrency(session.user.id)
        : { currency: 'USD' as CurrencyCode };

    const userRole = (session?.user as { role?: string })?.role || 'LP_VIEWER';
    const canEdit = EDIT_ROLES.includes(userRole);

    return (
        <ErrorBoundary module="Deal Detail">
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
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="tasks">
                        Tasks
                        {tasks.length > 0 && (
                            <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                                {tasks.filter(t => t.status !== 'COMPLETED').length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="due-diligence">
                        Due Diligence
                        {ddStats && ddStats.totalItems > 0 && (
                            <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                                {Math.round(ddStats.overallProgress)}%
                            </span>
                        )}
                    </TabsTrigger>
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
                        portfolioLink={portfolioLink}
                        rawDeal={rawDeal}
                        currency={currency}
                    />
                    <DealScoring
                        dealId={deal.id}
                        initialScores={{
                            attractivenessScore: scores?.attractivenessScore ?? null,
                            fitScore: scores?.fitScore ?? null,
                            riskScore: scores?.riskScore ?? null,
                        }}
                        canEdit={canEdit}
                    />
                    <DealSourceSelect
                        dealId={deal.id}
                        currentSourceId={rawDeal?.sourceId ?? null}
                        currentSourceName={rawDeal?.source?.name ?? null}
                        currentSourceType={rawDeal?.source?.type ?? null}
                        sourceContact={rawDeal?.sourceContact ?? null}
                        sourceNotes={rawDeal?.sourceNotes ?? null}
                        sources={dealSources}
                        canEdit={canEdit}
                    />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    {analytics ? (
                        <DealAnalyticsTab analytics={analytics} />
                    ) : (
                        <p className="text-sm text-muted-foreground">Analytics data unavailable.</p>
                    )}
                </TabsContent>

                <TabsContent value="tasks">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Tasks</h3>
                        {canEdit && <AddTaskButton dealId={deal.id} members={members} />}
                    </div>
                    <DealTasks tasks={tasks} canManage={canEdit} />
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

                <TabsContent value="due-diligence">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Due Diligence Tracker</h3>
                        {canEdit && <AddDDItemButton dealId={deal.id} />}
                    </div>
                    <DDTracker
                        items={ddItems}
                        stats={ddStats || { totalItems: 0, completedItems: 0, redFlagCount: 0, overallProgress: 0, byCategory: [] }}
                        dealId={deal.id}
                        canManage={canEdit}
                    />
                </TabsContent>

                <TabsContent value="activity">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Activity</h3>
                        {canEdit && <LogActivityButton dealId={deal.id} />}
                    </div>
                    <ActivityTimeline events={timeline} />
                </TabsContent>

                <TabsContent value="notes">
                    <div className="mb-4">
                        <h3 className="text-lg font-medium">Notes</h3>
                        <p className="text-sm text-[#64748B]">Internal team notes not shared with external parties.</p>
                    </div>
                    <NoteList notes={notes} dealId={deal.id} canEdit={canEdit} />
                </TabsContent>
            </Tabs>
        </div>
        </ErrorBoundary>
    );
}
