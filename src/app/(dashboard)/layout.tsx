import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { auth } from '@/lib/auth';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div
            className="min-h-screen bg-[#11141D] text-[#F9FAFB] font-sans antialiased"
            style={
                {
                    '--background': '#11141D',
                    '--foreground': '#F8FAFC',
                    '--card': '#1E293B',
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
            {/* Sidebar fixed on the left */}
            <div className="fixed inset-y-0 z-50 hidden w-64 md:flex md:flex-col">
                <Sidebar userRole={session?.user?.role as string | undefined} />
            </div>

            {/* Main content area */}
            <div className="md:pl-64 flex flex-col min-h-screen">
                <Header user={session?.user} />
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
