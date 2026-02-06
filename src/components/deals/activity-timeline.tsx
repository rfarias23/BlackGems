'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    Phone, Mail, MailOpen, Users, MapPin, FileText, MessageSquare,
    CheckCircle, Calendar, Settings, Trash2, Upload, UserPlus, Edit,
    ArrowRightLeft, Search,
} from 'lucide-react';
import type { TimelineEvent } from '@/lib/shared/activity-types';

// Icons for manual activity types
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    CALL: <Phone className="h-4 w-4" />,
    MEETING: <Users className="h-4 w-4" />,
    EMAIL_SENT: <Mail className="h-4 w-4" />,
    EMAIL_RECEIVED: <MailOpen className="h-4 w-4" />,
    SITE_VISIT: <MapPin className="h-4 w-4" />,
    NOTE: <MessageSquare className="h-4 w-4" />,
    DOCUMENT_SENT: <FileText className="h-4 w-4" />,
    DOCUMENT_RECEIVED: <FileText className="h-4 w-4" />,
    TASK_COMPLETED: <CheckCircle className="h-4 w-4" />,
    COMMENT: <MessageSquare className="h-4 w-4" />,
    OTHER: <Settings className="h-4 w-4" />,
    STAGE_CHANGE: <ArrowRightLeft className="h-4 w-4" />,
    STATUS_CHANGE: <ArrowRightLeft className="h-4 w-4" />,
};

// Labels for activity types
const TYPE_LABELS: Record<string, string> = {
    CALL: 'Phone Call',
    MEETING: 'Meeting',
    EMAIL_SENT: 'Email Sent',
    EMAIL_RECEIVED: 'Email Received',
    SITE_VISIT: 'Site Visit',
    NOTE: 'Note',
    DOCUMENT_SENT: 'Doc Sent',
    DOCUMENT_RECEIVED: 'Doc Received',
    TASK_COMPLETED: 'Task Completed',
    COMMENT: 'Comment',
    OTHER: 'Other',
    STAGE_CHANGE: 'Stage Change',
    STATUS_CHANGE: 'Status Change',
};

function getSystemIcon(type: string): React.ReactNode {
    if (type.includes('Document') || type.includes('document')) return <Upload className="h-4 w-4" />;
    if (type.includes('Contact') || type.includes('contact')) return <UserPlus className="h-4 w-4" />;
    if (type.includes('DELETE')) return <Trash2 className="h-4 w-4" />;
    if (type.includes('UPDATE')) return <Edit className="h-4 w-4" />;
    if (type.includes('CREATE')) return <Settings className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
}

function getTypeLabel(event: TimelineEvent): string {
    if (event.kind === 'activity') {
        return TYPE_LABELS[event.type] || event.type;
    }
    // System events: CREATE_Deal -> "System"
    return 'System';
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

interface ActivityTimelineProps {
    events: TimelineEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
    const [kindFilter, setKindFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        return events.filter((e) => {
            if (kindFilter === 'manual' && e.kind !== 'activity') return false;
            if (kindFilter === 'system' && e.kind !== 'system') return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matches =
                    e.title.toLowerCase().includes(q) ||
                    e.userName?.toLowerCase().includes(q) ||
                    e.userId?.toLowerCase().includes(q) ||
                    e.description?.toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [events, kindFilter, searchQuery]);

    if (events.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No activity recorded yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Log calls, meetings, and notes to build a deal timeline.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                        placeholder="Search by title, user, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]"
                    />
                </div>
                <Select value={kindFilter} onValueChange={setKindFilter}>
                    <SelectTrigger className="w-[160px] bg-[#11141D] border-[#334155] text-[#F8FAFC]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                        <SelectItem value="system">System Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border border-[#334155] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#334155] hover:bg-transparent">
                            <TableHead className="text-[#94A3B8] w-[40px]"></TableHead>
                            <TableHead className="text-[#94A3B8]">Event</TableHead>
                            <TableHead className="text-[#94A3B8]">Type</TableHead>
                            <TableHead className="text-[#94A3B8]">User</TableHead>
                            <TableHead className="text-[#94A3B8]">User ID</TableHead>
                            <TableHead className="text-[#94A3B8]">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow className="border-[#334155]">
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No events match your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((event) => {
                                const isManual = event.kind === 'activity';
                                return (
                                    <TableRow key={event.id} className="border-[#334155] hover:bg-[#1E293B]/50">
                                        <TableCell className="w-[40px] pr-0">
                                            <div className={`flex items-center justify-center h-7 w-7 rounded-full ${
                                                isManual
                                                    ? 'bg-[#3E5CFF]/20 text-[#3E5CFF]'
                                                    : 'bg-[#334155] text-[#94A3B8]'
                                            }`}>
                                                {isManual
                                                    ? (ACTIVITY_ICONS[event.type] || ACTIVITY_ICONS.OTHER)
                                                    : getSystemIcon(event.type)
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className={`text-sm font-medium ${isManual ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                                                    {event.title}
                                                </p>
                                                {event.description && (
                                                    <p className="text-xs text-[#64748B] mt-0.5 truncate max-w-[300px]">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                isManual
                                                    ? 'bg-[#3E5CFF]/15 text-[#3E5CFF]'
                                                    : 'bg-[#334155] text-[#64748B]'
                                            }`}>
                                                {getTypeLabel(event)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-[#94A3B8]">
                                            {event.userName || '-'}
                                        </TableCell>
                                        <TableCell className="text-xs text-[#64748B] font-mono">
                                            {event.userId ? event.userId.slice(0, 8) + '...' : '-'}
                                        </TableCell>
                                        <TableCell className="text-xs text-[#94A3B8] whitespace-nowrap">
                                            {formatDate(event.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <p className="text-xs text-[#64748B] text-right">
                Showing {filtered.length} of {events.length} events
            </p>
        </div>
    );
}
