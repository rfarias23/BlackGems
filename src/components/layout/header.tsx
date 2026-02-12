'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { NotificationDropdown } from './notification-dropdown';

interface HeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    unreadCount?: number;
}

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function Header({ user, unreadCount = 0 }: HeaderProps) {

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 text-card-foreground">
            <div className="flex items-center gap-4">
                {/* Placeholder for future breadcrumbs or page title */}
            </div>
            <div className="flex items-center gap-4">
                <NotificationDropdown initialCount={unreadCount} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-[#334155]">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                                <AvatarFallback className="bg-transparent border border-[#334155] text-white">
                                    {getInitials(user?.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 bg-[#1E293B] text-[#F8FAFC] border-[#334155]"
                        align="end"
                        forceMount
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-[#F8FAFC]">{user?.name || 'User'}</p>
                                <p className="text-xs leading-none text-[#94A3B8]">
                                    {user?.email || ''}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[#334155]" />
                        <DropdownMenuItem asChild className="focus:bg-[#334155] focus:text-[#F8FAFC]">
                            <Link href="/settings" className="flex items-center cursor-pointer text-[#F8FAFC]">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="focus:bg-[#334155] focus:text-[#F8FAFC]">
                            <Link href="/settings" className="flex items-center cursor-pointer text-[#F8FAFC]">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#334155]" />
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="text-[#F8FAFC] focus:bg-[#334155] focus:text-[#F8FAFC] cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
