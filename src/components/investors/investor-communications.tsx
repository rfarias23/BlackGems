'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, Clock } from 'lucide-react';
import { sendInvestorCommunication, type CommunicationLogEntry } from '@/lib/actions/investors';

interface InvestorCommunicationsProps {
    investorId: string;
    investorName: string;
    investorEmail: string | null;
    communications: CommunicationLogEntry[];
}

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function InvestorCommunications({
    investorId,
    investorName,
    investorEmail,
    communications,
}: InvestorCommunicationsProps) {
    const [isPending, startTransition] = useTransition();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSend = () => {
        if (!subject.trim() || !message.trim()) {
            setError('Subject and message are required');
            return;
        }

        setError(null);
        setSuccess(false);
        startTransition(async () => {
            const result = await sendInvestorCommunication(investorId, {
                subject: subject.trim(),
                message: message.trim(),
            });

            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setSubject('');
                setMessage('');
                setTimeout(() => setSuccess(false), 4000);
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Send Communication */}
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
                    {error && (
                        <p className="text-sm text-red-500 mb-4">{error}</p>
                    )}
                    {success && (
                        <p className="text-sm text-emerald-500 mb-4">Communication sent successfully.</p>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Quarterly update, capital call notice..."
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
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
                            onClick={handleSend}
                            disabled={isPending || !investorEmail}
                            className="bg-[#3E5CFF] hover:bg-[#3E5CFF]/90 text-white"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            {isPending ? 'Sending...' : 'Send Email'}
                        </Button>
                    </div>
                </CardContent>
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
                            <p className="text-muted-foreground">No communications sent yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Send an update above to start the communication log.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {communications.map((comm) => (
                                <div
                                    key={comm.id}
                                    className="flex items-start gap-3 py-3 border-b border-border last:border-0"
                                >
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">
                                            {comm.subject || 'Communication'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Sent to {comm.recipient || 'investor'} by {comm.userName || 'Unknown'} — {formatDate(comm.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
