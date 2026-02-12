'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Bell,
    CheckCheck,
    ArrowRightLeft,
    DollarSign,
    FileText,
    MessageSquare,
    BarChart3,
    AlertCircle,
    ClipboardCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    type NotificationItem,
} from '@/lib/actions/notifications';

const TYPE_ICONS: Record<string, React.ElementType> = {
    DEAL_STAGE_CHANGE: ArrowRightLeft,
    CAPITAL_CALL_DUE: DollarSign,
    DISTRIBUTION_MADE: DollarSign,
    DOCUMENT_SHARED: FileText,
    COMMENT_ADDED: MessageSquare,
    REPORT_PUBLISHED: BarChart3,
    TASK_ASSIGNED: ClipboardCheck,
    TASK_DUE: AlertCircle,
    TASK_OVERDUE: AlertCircle,
    SYSTEM: Bell,
};

function timeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface NotificationDropdownProps {
    initialCount?: number;
}

export function NotificationDropdown({ initialCount = 0 }: NotificationDropdownProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(initialCount);
    const [isOpen, setIsOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const fetchNotifications = useCallback(() => {
        startTransition(async () => {
            const [items, count] = await Promise.all([
                getNotifications(15),
                getUnreadCount(),
            ]);
            setNotifications(items);
            setUnreadCount(count);
            setLoaded(true);
        });
    }, []);

    // Fetch on open
    useEffect(() => {
        if (isOpen && !loaded) {
            fetchNotifications();
        }
    }, [isOpen, loaded, fetchNotifications]);

    // Refresh count periodically (every 60s)
    useEffect(() => {
        const interval = setInterval(async () => {
            const count = await getUnreadCount();
            setUnreadCount(count);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = (id: string) => {
        startTransition(async () => {
            await markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        });
    };

    const handleMarkAllRead = () => {
        startTransition(async () => {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        });
    };

    const handleClick = (notification: NotificationItem) => {
        if (!notification.isRead) {
            handleMarkRead(notification.id);
        }
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (v) setLoaded(false); }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[#3E5CFF] text-[10px] font-medium text-white flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-80 bg-[#1E293B] border-[#334155] text-[#F8FAFC] p-0"
                align="end"
                forceMount
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
                    <span className="text-sm font-medium text-[#F8FAFC]">Notifications</span>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={isPending}
                            className="text-xs text-[#3E5CFF] hover:text-[#3E5CFF]/80 flex items-center gap-1"
                        >
                            <CheckCheck className="h-3 w-3" />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Notification list */}
                <div className="max-h-[400px] overflow-y-auto">
                    {!loaded && isPending ? (
                        <div className="py-8 text-center text-sm text-[#94A3B8]">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-8 text-center">
                            <Bell className="h-8 w-8 text-[#334155] mx-auto mb-2" />
                            <p className="text-sm text-[#94A3B8]">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const Icon = TYPE_ICONS[notification.type] || Bell;
                            return (
                                <button
                                    key={notification.id}
                                    onClick={() => handleClick(notification)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#334155]/50 transition-colors border-b border-[#334155]/50 last:border-0 ${
                                        !notification.isRead ? 'bg-[#334155]/30' : ''
                                    }`}
                                >
                                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                        !notification.isRead
                                            ? 'bg-[#3E5CFF]/20 text-[#3E5CFF]'
                                            : 'bg-[#334155]/50 text-[#94A3B8]'
                                    }`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm truncate ${
                                                !notification.isRead ? 'font-medium text-[#F8FAFC]' : 'text-[#94A3B8]'
                                            }`}>
                                                {notification.title}
                                            </p>
                                            {!notification.isRead && (
                                                <span className="h-2 w-2 rounded-full bg-[#3E5CFF] shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-[#475569] mt-1">
                                            {timeAgo(notification.createdAt)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t border-[#334155] px-4 py-2 text-center">
                        <button
                            onClick={() => { setIsOpen(false); router.push('/notifications'); }}
                            className="text-xs text-[#3E5CFF] hover:text-[#3E5CFF]/80"
                        >
                            View all notifications
                        </button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
