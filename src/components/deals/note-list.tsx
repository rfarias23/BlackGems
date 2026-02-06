'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, MessageSquare } from 'lucide-react';
import { createDealNote, deleteDealNote } from '@/lib/actions/notes';

const dark = {
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
    deleteBtn: 'text-[#64748B] hover:text-[#DC2626] hover:bg-[#DC2626]/10',
} as const;

interface NoteItem {
    id: string;
    content: string;
    userId: string;
    userName: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface NoteListProps {
    notes: NoteItem[];
    dealId: string;
    canEdit: boolean;
}

function getInitials(name: string | null): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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

function timeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
}

export function NoteList({ notes, dealId, canEdit }: NoteListProps) {
    const [content, setContent] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!content.trim()) return;
        setError(null);
        const formData = new FormData();
        formData.set('content', content);
        startTransition(async () => {
            const result = await createDealNote(dealId, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setContent('');
            }
        });
    };

    const handleDelete = (noteId: string) => {
        setDeletingId(noteId);
        startTransition(async () => {
            const result = await deleteDealNote(noteId, dealId);
            if (result?.error) {
                setError(result.error);
            }
            setDeletingId(null);
            setConfirmDeleteId(null);
        });
    };

    return (
        <div className="space-y-4">
            {/* Add Note Form */}
            {canEdit && (
                <div className="rounded-lg border border-[#334155] bg-[#1E293B] p-4 space-y-3">
                    <Textarea
                        placeholder="Write a note..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className={`resize-none min-h-[100px] ${dark.input}`}
                        rows={3}
                    />
                    {error && (
                        <div className="rounded-md p-2 text-sm bg-[#DC2626]/15 text-[#DC2626]">
                            {error}
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        {content.trim() && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setContent('')}
                                disabled={isPending}
                                className={dark.cancelBtn}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!content.trim() || isPending}
                            className={dark.saveBtn}
                        >
                            {isPending && !deletingId ? 'Posting...' : 'Post Note'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Notes Thread */}
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-[#334155] mb-4" />
                    <p className="text-[#94A3B8]">No notes yet.</p>
                    {canEdit && (
                        <p className="text-sm text-[#64748B] mt-1">
                            Write a note above to get started.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            className="rounded-lg border border-[#334155] bg-[#1E293B] p-4 group"
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#3E5CFF]/20 text-[#3E5CFF] flex items-center justify-center text-xs font-medium">
                                    {getInitials(note.userName)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-[#F8FAFC]">
                                            {note.userName || 'Unknown User'}
                                        </span>
                                        <span className="text-xs text-[#64748B]">
                                            {timeAgo(note.createdAt)}
                                        </span>
                                        <span className="text-xs text-[#475569] font-mono">
                                            {note.userId.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="text-sm text-[#CBD5E1] whitespace-pre-wrap break-words">
                                        {note.content}
                                    </div>
                                </div>

                                {/* Delete */}
                                {canEdit && (
                                    <div className="flex-shrink-0">
                                        {confirmDeleteId === note.id ? (
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(note.id)}
                                                    disabled={deletingId === note.id}
                                                    className="h-7 px-2 text-xs text-[#DC2626] hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                                                >
                                                    {deletingId === note.id ? '...' : 'Delete'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="h-7 px-2 text-xs text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]"
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setConfirmDeleteId(note.id)}
                                                className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${dark.deleteBtn}`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
