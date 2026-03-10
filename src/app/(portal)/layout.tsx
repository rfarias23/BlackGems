import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalHeader } from '@/components/portal/portal-header';

// All portal pages require authentication (cookies/headers), so static generation is impossible.
export const dynamic = 'force-dynamic';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    // Resolve org branding from subdomain
    const headerList = await headers();
    const orgSlug = headerList.get('x-org-slug');

    let orgName: string | null = null;
    if (orgSlug) {
        const org = await prisma.organization.findUnique({
            where: { slug: orgSlug },
            select: { name: true },
        });
        if (!org) redirect('https://www.blackgem.ai');
        orgName = org.name;
    }

    // Resolve investor name for the sidebar
    let investorName: string | null = null;
    if (session.user.investorId) {
        const investor = await prisma.investor.findUnique({
            where: { id: session.user.investorId },
            select: { name: true },
        });
        investorName = investor?.name ?? null;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
            {/* Sidebar */}
            <div className="fixed inset-y-0 z-50 hidden w-64 md:flex md:flex-col">
                <PortalSidebar
                    investorName={investorName}
                    userName={session.user.name}
                    orgName={orgName}
                />
            </div>

            {/* Main content */}
            <div className="md:pl-64 flex flex-col min-h-screen">
                <PortalHeader userName={session.user.name} />
                <main className="flex-1 p-8">
                    {children}
                </main>
                <footer className="border-t border-slate-200 py-6 bg-white">
                    <div className="px-8 text-center text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} NIRO Group LLC. All rights reserved.
                    </div>
                </footer>
            </div>
        </div>
    );
}
