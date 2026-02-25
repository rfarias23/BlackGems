import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { auth } from '@/lib/auth';
import { getUnreadCount } from '@/lib/actions/notifications';
import { getUserFunds } from '@/lib/actions/funds';
import { getActiveFundId } from '@/lib/shared/active-fund';
import { getUserModulePermissions } from '@/lib/shared/fund-access';
import { redirect } from 'next/navigation';
import { AICopilotProvider } from '@/components/ai/ai-copilot-provider';
import { AICopilotPanel, AICopilotContentWrapper } from '@/components/ai/ai-copilot-layout';
import { prisma } from '@/lib/prisma';
import { checkSubscriptionAccess } from '@/lib/shared/subscription-access';
import { TrialBanner } from '@/components/billing/trial-banner';
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

    const permissions = activeFundId
        ? await getUserModulePermissions(session.user.id!, activeFundId ?? funds[0]?.id ?? '')
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
    const fundId = activeFundId ?? funds[0]?.id ?? '';

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
                {/* Sidebar fixed on the left */}
                <div className="fixed inset-y-0 z-50 hidden w-64 md:flex md:flex-col">
                    <Sidebar
                        userRole={session?.user?.role as string | undefined}
                        funds={funds}
                        activeFundId={fundId}
                        permissions={permissions}
                    />
                </div>

                {/* Main content area — padding adjusts when AI panel is open */}
                <AICopilotContentWrapper>
                    {subscriptionAccess.daysRemaining !== undefined && subscriptionAccess.allowed && (
                        <TrialBanner daysRemaining={subscriptionAccess.daysRemaining} />
                    )}
                    <Header user={session?.user} unreadCount={unreadCount} />
                    <main className="flex-1 p-8">
                        {children}
                    </main>
                </AICopilotContentWrapper>

                {/* Subscription block modal — hard gate */}
                {!subscriptionAccess.allowed && (
                    <BlockModal reason={subscriptionAccess.reason ?? 'Subscription required'} />
                )}

                {/* AI Copilot panel — fixed on the right */}
                <AICopilotPanel />
            </AICopilotProvider>
        </div>
    );
}
