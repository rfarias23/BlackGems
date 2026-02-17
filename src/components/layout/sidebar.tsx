'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Building2,
    Banknote,
    FileText,
    Settings,
    Shield,
} from 'lucide-react';
import { FundSwitcher } from '@/components/layout/fund-switcher';
import { CreateFundDialog } from '@/components/layout/create-fund-dialog';
import type { FundSummary } from '@/lib/actions/funds';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Deals', href: '/deals', icon: Briefcase },
    { name: 'Investors', href: '/investors', icon: Users },
    { name: 'Portfolio', href: '/portfolio', icon: Building2 },
    { name: 'Capital', href: '/capital', icon: Banknote },
    { name: 'Reports', href: '/reports', icon: FileText },
];

interface SidebarProps {
    userRole?: string;
    funds: FundSummary[];
    activeFundId: string;
}

export function Sidebar({ userRole, funds, activeFundId }: SidebarProps) {
    const pathname = usePathname();
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'FUND_ADMIN';

    return (
        <div className="flex h-full w-64 flex-col bg-card border-r border-border text-card-foreground">
            <div className="flex h-16 items-center px-6 border-b border-border">
                <Link href="/dashboard" className="flex items-center gap-2">
                    {/* Logo placeholder - using text as per Brand System (wordmark) */}
                    <span className="font-serif text-2xl font-semibold tracking-tight">
                        BlackGem
                    </span>
                </Link>
            </div>
            <FundSwitcher funds={funds} activeFundId={activeFundId} userRole={userRole} />
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}

                {/* Admin section - visible only to SUPER_ADMIN and FUND_ADMIN */}
                {isAdmin && (
                    <div className="pt-4">
                        <div className="text-xs font-medium text-muted-foreground px-3 pb-2 uppercase tracking-wider">
                            Administration
                        </div>
                        <Link
                            href="/admin/users"
                            className={cn(
                                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                                pathname?.startsWith('/admin')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <Shield
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    pathname?.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                )}
                                aria-hidden="true"
                            />
                            Team
                        </Link>
                    </div>
                )}
            </nav>
            <div className="border-t border-border p-3">
                <Link
                    href="/settings"
                    className={cn(
                        'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground',
                        pathname?.startsWith('/settings') && 'bg-primary/10 text-primary'
                    )}
                >
                    <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                    Settings
                </Link>
            </div>
            <CreateFundDialog />
        </div>
    );
}
