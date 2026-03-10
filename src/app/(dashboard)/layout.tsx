import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { auth } from '@/lib/auth';
import { getUnreadCount } from '@/lib/actions/notifications';
import { getUserFunds } from '@/lib/actions/funds';
import { getActiveFundId, setActiveFundId } from '@/lib/shared/active-fund';
import { getUserModulePermissions } from '@/lib/shared/fund-access';
import { redirect } from 'next/navigation';
import { AICopilotProvider } from '@/components/ai/ai-copilot-provider';
import { AICopilotPanel, AICopilotContentWrapper } from '@/components/ai/ai-copilot-layout';
import { MobileEmmaShell } from '@/components/ai/mobile-emma-shell';
import { TabletSidebarDrawer } from '@/components/layout/tablet-sidebar-drawer';
import { prisma } from '@/lib/prisma';
import { checkSubscriptionAccess } from '@/lib/shared/subscription-access';
import { BlockModal } from '@/components/billing/block-modal';

// All dashboard pages require authentication (cookies/headers), so static generation is impossible.
export const dynamic = 'force-dynamic';

const LP_ROLES = ['LP_PRIMARY', 'LP_VIEWER'] as const;

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Defense-in-depth: LP users must use the portal, not the dashboard
    if (!session?.user?.id) {
        redirect('/login');
    }
    const userRole = (session.user as { role?: string }).role;
    if (userRole && LP_ROLES.includes(userRole as typeof LP_ROLES[number])) {
        redirect('/portal');
    }

    const [unreadCount, funds, activeFundId] = await Promise.all([
        getUnreadCount(),
        getUserFunds(session.user.id!),
        getActiveFundId(),
    ]);

    // Resolve fund ID: cookie → first fund from membership → empty
    const resolvedFundId = activeFundId ?? funds[0]?.id ?? '';

    // Persist resolved fund to cookie so downstream server actions don't re-resolve.
    // In RSC render phase the write may be silently skipped (Next.js 15);
    // the cookie is then set on the user's next Server Action invocation.
    if (!activeFundId && resolvedFundId) {
        try {
            await setActiveFundId(resolvedFundId);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes('Cookies can only be modified')) {
                console.error('DashboardLayout: unexpected error persisting active fund cookie', error);
            }
        }
    }

    const permissions = resolvedFundId
        ? await getUserModulePermissions(session.user.id!, resolvedFundId)
        : [];

    // Check subscription access
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true },
    });

    let subscriptionAccess: { allowed: boolean; reason?: string; daysRemaining?: number } = { allowed: true };

    if (user?.organizationId) {
        const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: {
                subscriptionStatus: true,
                trialEndsAt: true,
                stripeSubscriptionId: true,
            },
        });

        if (org) {
            subscriptionAccess = checkSubscriptionAccess({
                subscriptionStatus: org.subscriptionStatus,
                trialEndsAt: org.trialEndsAt,
                stripeSubscriptionId: org.stripeSubscriptionId,
            });
        }
    }

    const aiEnabled = !!process.env.ANTHROPIC_API_KEY;
    const fundId = resolvedFundId;

    return (
        <div
            className="min-h-screen bg-[#11141D] text-[#F9FAFB] font-sans antialiased"
            style={
                {
                    '--background': '#11141D',
                    '--foreground': '#F8FAFC',
                    '--card': '#11141D',
                    '--card-foreground': '#F8FAFC',
                    '--popover': '#1E293B',
                    '--popover-foreground': '#F8FAFC',
                    '--primary': '#F8FAFC',
                    '--primary-foreground': '#11141D',
                    '--secondary': '#334155',
                    '--secondary-foreground': '#F8FAFC',
                    '--muted': '#1E293B',
                    '--muted-foreground': '#94A3B8',
                    '--accent': '#3E5CFF',
                    '--accent-foreground': '#F8FAFC',
                    '--destructive': '#DC2626',
                    '--destructive-foreground': '#FFFFFF',
                    '--border': '#334155',
                    '--input': '#334155',
                    '--ring': '#F8FAFC',
                    colorScheme: 'dark',
                } as React.CSSProperties
            }
        >
            <AICopilotProvider isEnabled={aiEnabled} fundId={fundId}>
                {/* Mobile: Full-screen Emma (< 768px) — only when AI is enabled */}
                {aiEnabled && (
                <div className="flex md:hidden h-dvh">
                    <MobileEmmaShell />
                </div>
                )}

                {/* Cockpit: tablet (md–xl) uses drawer sidebar, desktop (xl+) uses fixed sidebar */}
                <div className="hidden md:block">
                    {/* Sidebar fixed on the left */}
                    <div className="fixed inset-y-0 z-50 hidden w-64 xl:flex xl:flex-col">
                        <Sidebar
                            userRole={session?.user?.role as string | undefined}
                            funds={funds}
                            activeFundId={fundId}
                            permissions={permissions}
                            trialDaysRemaining={subscriptionAccess.allowed ? subscriptionAccess.daysRemaining : undefined}
                        />
                    </div>

                    {/* Tablet sidebar drawer (md–xl) */}
                    <TabletSidebarDrawer
                        userRole={session?.user?.role as string | undefined}
                        funds={funds}
                        activeFundId={fundId}
                        permissions={permissions}
                        trialDaysRemaining={subscriptionAccess.allowed ? subscriptionAccess.daysRemaining : undefined}
                    />

                    {/* Main content area — padding adjusts when AI panel is open */}
                    <AICopilotContentWrapper>
                        <Header user={session?.user} unreadCount={unreadCount} />
                        <main className="flex-1 overflow-y-auto p-8">
                            {children}
                        </main>
                    </AICopilotContentWrapper>

                    {/* AI Copilot panel — fixed on the right */}
                    <AICopilotPanel />
                </div>

                {/* Subscription block modal — all breakpoints */}
                {!subscriptionAccess.allowed && (
                    <BlockModal reason={subscriptionAccess.reason ?? 'Subscription required'} />
                )}
            </AICopilotProvider>
        </div>
    );
}
