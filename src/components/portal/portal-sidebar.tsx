'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Wallet,
    FileText,
    BarChart3,
    User,
    LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navigation = [
    { name: 'Overview', href: '/portal', icon: LayoutDashboard, exact: true },
    { name: 'Capital Account', href: '/portal/capital', icon: Wallet },
    { name: 'Documents', href: '/portal/documents', icon: FileText },
    { name: 'Reports', href: '/portal/reports', icon: BarChart3 },
];

interface PortalSidebarProps {
    investorName?: string | null;
    userName?: string | null;
}

export function PortalSidebar({ investorName }: PortalSidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-slate-200">
                <Link href="/portal" className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                        BlackGem
                    </span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Portal
                    </span>
                </Link>
            </div>

            {/* Investor name */}
            {investorName && (
                <div className="px-6 py-4 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Investor</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{investorName}</p>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname?.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                                isActive
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="border-t border-slate-200 p-3 space-y-1">
                <Link
                    href="/portal/profile"
                    className={cn(
                        'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                        pathname?.startsWith('/portal/profile')
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                >
                    <User className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        pathname?.startsWith('/portal/profile') ? 'text-white' : 'text-slate-400'
                    )} />
                    Profile
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
