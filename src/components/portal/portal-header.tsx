'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PortalHeaderProps {
    userName?: string | null;
}

function getInitials(name: string | null | undefined): string {
    if (!name) return 'LP';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function PortalHeader({ userName }: PortalHeaderProps) {
    return (
        <header className="flex h-16 items-center justify-end border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{userName || 'Investor'}</span>
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-900 text-white text-xs">
                        {getInitials(userName)}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
