'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Download, Trash2, AlertTriangle } from 'lucide-react';
import { deleteDocument } from '@/lib/actions/documents';
import type { DocumentItem } from '@/lib/actions/documents';

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    deleteBtn: 'bg-[#DC2626] text-white hover:bg-[#DC2626]/90',
} as const;

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
    CIM: 'bg-blue-500/20 text-blue-400',
    NDA: 'bg-purple-500/20 text-purple-400',
    FINANCIAL_STATEMENTS: 'bg-emerald-500/20 text-emerald-400',
    LOI: 'bg-amber-500/20 text-amber-400',
    TERM_SHEET: 'bg-orange-500/20 text-orange-400',
    DUE_DILIGENCE: 'bg-cyan-500/20 text-cyan-400',
    PURCHASE_AGREEMENT: 'bg-pink-500/20 text-pink-400',
    CLOSING_DOCS: 'bg-green-500/20 text-green-400',
    LEGAL: 'bg-red-500/20 text-red-400',
    OTHER: 'bg-slate-500/20 text-slate-400',
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

function FileIcon() {
    return <FileText className="h-8 w-8 text-[#3E5CFF]" />;
}

interface DocumentListProps {
    documents: DocumentItem[];
    canManage: boolean;
}

export function DocumentList({ documents, canManage }: DocumentListProps) {
    const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!deleteTarget) return;
        startTransition(async () => {
            const result = await deleteDocument(deleteTarget.id);
            if (result.success) {
                setDeleteTarget(null);
                window.location.reload();
            }
        });
    };

    if (documents.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No documents uploaded yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Upload CIMs, financial statements, and other deal materials.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                            >
                                {/* File icon */}
                                <div className="flex-shrink-0">
                                    <FileIcon />
                                </div>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {doc.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER}`}>
                                            {doc.categoryLabel}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(doc.fileSize)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(doc.createdAt)}
                                        </span>
                                        {doc.uploaderName && (
                                            <span className="text-xs text-muted-foreground">
                                                by {doc.uploaderName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        asChild
                                    >
                                        <a href={`/api/documents/${doc.id}`} download>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    {canManage && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-[#DC2626]"
                                            onClick={() => setDeleteTarget(doc)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}>
                <DialogContent className={`sm:max-w-[400px] ${dark.dialog}`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
                            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                            Delete Document
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#94A3B8]">
                        Are you sure you want to delete <strong className="text-[#F8FAFC]">{deleteTarget?.name}</strong>?
                        This action will be logged in the audit trail.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isPending}
                            className={dark.cancelBtn}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isPending}
                            className={dark.deleteBtn}
                        >
                            {isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
