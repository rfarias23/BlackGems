'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Mail,
    Send,
    Clock,
    Phone,
    Users,
    Video,
    MessageSquare,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownLeft,
    CalendarClock,
    Plus,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { sendBulkCommunication, logCommunication } from '@/lib/actions/communications';
import { getAvailableTemplates, type TemplateType } from '@/lib/email-templates';
import type { CommunicationItem } from '@/lib/actions/communications';

// ============================================================================
// TYPES
// ============================================================================

interface InvestorCommunicationsProps {
    investorId: string;
    investorName: string;
    investorEmail: string | null;
    communications: CommunicationItem[];
    fundId: string;
}

type LogType = 'CALL' | 'MEETING' | 'VIDEO_CALL' | 'TEXT' | 'OTHER';
type LogDirection = 'INBOUND' | 'OUTBOUND';

// ============================================================================
// CONSTANTS
// ============================================================================

const templates = getAvailableTemplates();

const TYPE_BADGE_STYLES: Record<string, string> = {
    EMAIL: 'bg-blue-500/20 text-blue-400',
    CALL: 'bg-emerald-500/20 text-emerald-400',
    MEETING: 'bg-purple-500/20 text-purple-400',
    VIDEO_CALL: 'bg-cyan-500/20 text-cyan-400',
    TEXT: 'bg-yellow-500/20 text-yellow-400',
    OTHER: 'bg-slate-500/20 text-slate-400',
};

const TYPE_LABELS: Record<string, string> = {
    EMAIL: 'Email',
    CALL: 'Call',
    MEETING: 'Meeting',
    VIDEO_CALL: 'Video Call',
    TEXT: 'Text',
    OTHER: 'Other',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    EMAIL: Mail,
    CALL: Phone,
    MEETING: Users,
    VIDEO_CALL: Video,
    TEXT: MessageSquare,
    OTHER: MoreHorizontal,
};

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InvestorCommunications({
    investorId,
    investorName,
    investorEmail,
    communications,
    fundId,
}: InvestorCommunicationsProps) {
    // Email composer state
    const [isPending, startTransition] = useTransition();
    const [templateType, setTemplateType] = useState<TemplateType>('custom');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailSuccess, setEmailSuccess] = useState(false);

    // Log communication state
    const [isLogPending, startLogTransition] = useTransition();
    const [showLogForm, setShowLogForm] = useState(false);
    const [logType, setLogType] = useState<LogType>('CALL');
    const [logDirection, setLogDirection] = useState<LogDirection>('OUTBOUND');
    const [logSubject, setLogSubject] = useState('');
    const [logContent, setLogContent] = useState('');
    const [logContactName, setLogContactName] = useState('');
    const [logFollowUpDate, setLogFollowUpDate] = useState('');
    const [logNotes, setLogNotes] = useState('');
    const [logError, setLogError] = useState<string | null>(null);
    const [logSuccess, setLogSuccess] = useState(false);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleTemplateChange = (value: string) => {
        const selected = value as TemplateType;
        setTemplateType(selected);

        const template = templates.find((t) => t.type === selected);
        if (template && selected !== 'custom') {
            setSubject(template.label);
        } else {
            setSubject('');
        }
    };

    const handleSendEmail = () => {
        if (!subject.trim() || !message.trim()) {
            setEmailError('Subject and message are required');
            return;
        }

        if (!fundId) {
            setEmailError('Investor must have an active commitment to send communications');
            return;
        }

        setEmailError(null);
        setEmailSuccess(false);
        startTransition(async () => {
            const result = await sendBulkCommunication(fundId, {
                recipientIds: [investorId],
                templateType,
                subject: subject.trim(),
                body: message.trim(),
            });

            if (result.error) {
                setEmailError(result.error);
            } else {
                setEmailSuccess(true);
                setSubject('');
                setMessage('');
                setTemplateType('custom');
                setTimeout(() => setEmailSuccess(false), 4000);
            }
        });
    };

    const handleLogCommunication = () => {
        setLogError(null);
        setLogSuccess(false);
        startLogTransition(async () => {
            const result = await logCommunication(investorId, {
                type: logType,
                direction: logDirection,
                subject: logSubject.trim() || undefined,
                content: logContent.trim() || undefined,
                contactName: logContactName.trim() || undefined,
                followUpDate: logFollowUpDate || undefined,
                notes: logNotes.trim() || undefined,
            });

            if (result.error) {
                setLogError(result.error);
            } else {
                setLogSuccess(true);
                setLogSubject('');
                setLogContent('');
                setLogContactName('');
                setLogFollowUpDate('');
                setLogNotes('');
                setShowLogForm(false);
                setTimeout(() => setLogSuccess(false), 4000);
            }
        });
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="space-y-4">
            {/* Send Email Communication */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send Communication
                    </CardTitle>
                    <CardDescription>
                        {investorEmail
                            ? `Send an email to ${investorName} at ${investorEmail}`
                            : `No email address on file for ${investorName}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {emailError && (
                        <p className="text-sm text-red-500 mb-4">{emailError}</p>
                    )}
                    {emailSuccess && (
                        <p className="text-sm text-emerald-500 mb-4">Communication sent successfully.</p>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="template"
                                className="text-xs uppercase tracking-wider text-muted-foreground"
                            >
                                Template
                            </Label>
                            <Select value={templateType} onValueChange={handleTemplateChange}>
                                <SelectTrigger id="template" className="bg-background">
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => (
                                        <SelectItem key={t.type} value={t.type}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {templateType !== 'custom' && (
                                <p className="text-xs text-muted-foreground">
                                    {templates.find((t) => t.type === templateType)?.description}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="subject"
                                className="text-xs uppercase tracking-wider text-muted-foreground"
                            >
                                Subject
                            </Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Quarterly update, capital call notice..."
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="message"
                                className="text-xs uppercase tracking-wider text-muted-foreground"
                            >
                                Message
                            </Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Compose your message..."
                                rows={6}
                                className="bg-background resize-none"
                            />
                        </div>
                        <Button
                            onClick={handleSendEmail}
                            disabled={isPending || !investorEmail || !fundId}
                            className="bg-[#3E5CFF] hover:bg-[#3E5CFF]/90 text-white"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            {isPending ? 'Sending...' : 'Send Email'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Log Communication */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Log Communication
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLogForm(!showLogForm)}
                            className="text-muted-foreground"
                        >
                            {showLogForm ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <CardDescription>
                        Record calls, meetings, and other interactions
                    </CardDescription>
                </CardHeader>
                {showLogForm && (
                    <CardContent>
                        {logError && (
                            <p className="text-sm text-red-500 mb-4">{logError}</p>
                        )}
                        {logSuccess && (
                            <p className="text-sm text-emerald-500 mb-4">Communication logged successfully.</p>
                        )}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Type
                                    </Label>
                                    <Select
                                        value={logType}
                                        onValueChange={(v) => setLogType(v as LogType)}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CALL">Call</SelectItem>
                                            <SelectItem value="MEETING">Meeting</SelectItem>
                                            <SelectItem value="VIDEO_CALL">Video Call</SelectItem>
                                            <SelectItem value="TEXT">Text</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Direction
                                    </Label>
                                    <Select
                                        value={logDirection}
                                        onValueChange={(v) => setLogDirection(v as LogDirection)}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OUTBOUND">Outbound</SelectItem>
                                            <SelectItem value="INBOUND">Inbound</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Subject
                                </Label>
                                <Input
                                    value={logSubject}
                                    onChange={(e) => setLogSubject(e.target.value)}
                                    placeholder="Brief description of the interaction"
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Content
                                </Label>
                                <Textarea
                                    value={logContent}
                                    onChange={(e) => setLogContent(e.target.value)}
                                    placeholder="Summary of the conversation..."
                                    rows={3}
                                    className="bg-background resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Contact Name
                                    </Label>
                                    <Input
                                        value={logContactName}
                                        onChange={(e) => setLogContactName(e.target.value)}
                                        placeholder="Who you spoke with"
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                        Follow-up Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={logFollowUpDate}
                                        onChange={(e) => setLogFollowUpDate(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Notes
                                </Label>
                                <Textarea
                                    value={logNotes}
                                    onChange={(e) => setLogNotes(e.target.value)}
                                    placeholder="Additional notes..."
                                    rows={2}
                                    className="bg-background resize-none"
                                />
                            </div>
                            <Button
                                onClick={handleLogCommunication}
                                disabled={isLogPending}
                                className="bg-[#3E5CFF] hover:bg-[#3E5CFF]/90 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {isLogPending ? 'Saving...' : 'Log Communication'}
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Communication History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Communication History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {communications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No communications recorded yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Send an email or log an interaction above to start the communication history.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {communications.map((comm) => {
                                const TypeIcon = TYPE_ICONS[comm.type] || Mail;
                                const badgeStyle = TYPE_BADGE_STYLES[comm.type] || TYPE_BADGE_STYLES.OTHER;
                                const typeLabel = TYPE_LABELS[comm.type] || comm.type;
                                const hasPendingFollowUp =
                                    comm.followUpDate && !comm.followUpDone;

                                return (
                                    <div
                                        key={comm.id}
                                        className="flex items-start gap-3 py-3 border-b border-border last:border-0"
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {comm.direction === 'OUTBOUND' ? (
                                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <TypeIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}
                                                >
                                                    {typeLabel}
                                                </span>
                                                {hasPendingFollowUp && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                                                        <CalendarClock className="h-3 w-3" />
                                                        Follow-up {formatShortDate(comm.followUpDate!)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium truncate">
                                                {comm.subject || 'Communication'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {comm.direction === 'OUTBOUND' ? 'Sent' : 'Received'}
                                                {comm.contactName ? ` \u2014 ${comm.contactName}` : ''}
                                                {comm.sentBy ? ` by ${comm.sentBy}` : ''}
                                                {' \u2014 '}
                                                {formatDate(comm.date)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
