'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
    Phone, Mail, MailOpen, Users, MapPin, FileText, MessageSquare,
    CheckCircle, Calendar, Settings, Trash2, Upload, UserPlus, Edit,
    ArrowRightLeft,
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

// Icons for system audit events
function getSystemIcon(type: string): React.ReactNode {
    if (type.includes('Document') || type.includes('document')) return <Upload className="h-4 w-4" />;
    if (type.includes('Contact') || type.includes('contact')) return <UserPlus className="h-4 w-4" />;
    if (type.includes('DELETE')) return <Trash2 className="h-4 w-4" />;
    if (type.includes('UPDATE')) return <Edit className="h-4 w-4" />;
    if (type.includes('CREATE')) return <Settings className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
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
        <div className="space-y-1">
            {events.map((event, index) => {
                const isManual = event.kind === 'activity';

                return (
                    <div key={event.id} className="flex gap-4 group">
                        {/* Timeline line + dot */}
                        <div className="flex flex-col items-center">
                            <div className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${
                                isManual
                                    ? 'bg-[#3E5CFF]/20 text-[#3E5CFF]'
                                    : 'bg-[#334155] text-[#94A3B8]'
                            }`}>
                                {isManual
                                    ? (ACTIVITY_ICONS[event.type] || ACTIVITY_ICONS.OTHER)
                                    : getSystemIcon(event.type)
                                }
                            </div>
                            {index < events.length - 1 && (
                                <div className="w-px flex-1 bg-border min-h-[24px]" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="pb-4 flex-1 min-w-0 -mt-0.5">
                            <p className={`text-sm font-medium leading-tight ${
                                isManual ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                                {event.title}
                            </p>
                            {event.description && (
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{formatDate(event.createdAt)}</span>
                                {event.userName && (
                                    <>
                                        <span>&middot;</span>
                                        <span>{event.userName}</span>
                                    </>
                                )}
                                {!isManual && (
                                    <>
                                        <span>&middot;</span>
                                        <span className="text-[#64748B] italic">auto</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
