'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Phone, Users, Trash2, AlertTriangle } from 'lucide-react';
import { deleteDealContact } from '@/lib/actions/deals';

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    deleteBtn: 'bg-[#DC2626] text-white hover:bg-[#DC2626]/90',
} as const;

const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Owner',
    CO_OWNER: 'Co-Owner',
    MANAGEMENT: 'Management',
    BROKER: 'Broker',
    ATTORNEY: 'Attorney',
    ACCOUNTANT: 'Accountant',
    ADVISOR: 'Advisor',
    OTHER: 'Other',
};

const ROLE_COLORS: Record<string, string> = {
    OWNER: 'bg-blue-500/20 text-blue-400',
    CO_OWNER: 'bg-indigo-500/20 text-indigo-400',
    MANAGEMENT: 'bg-emerald-500/20 text-emerald-400',
    BROKER: 'bg-amber-500/20 text-amber-400',
    ATTORNEY: 'bg-red-500/20 text-red-400',
    ACCOUNTANT: 'bg-cyan-500/20 text-cyan-400',
    ADVISOR: 'bg-purple-500/20 text-purple-400',
    OTHER: 'bg-slate-500/20 text-slate-400',
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

interface Contact {
    id: string;
    name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    isPrimary: boolean;
}

interface ContactListProps {
    contacts: Contact[];
    canManage: boolean;
}

export function ContactList({ contacts, canManage }: ContactListProps) {
    const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!deleteTarget) return;
        startTransition(async () => {
            const result = await deleteDealContact(deleteTarget.id);
            if (result.success) {
                setDeleteTarget(null);
            }
        });
    };

    if (contacts.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No contacts added yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Add owners, brokers, and other key contacts.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                {contacts.map((contact) => (
                    <Card key={contact.id} className="relative group">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-200 flex-shrink-0">
                                {getInitials(contact.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base truncate">{contact.name}</CardTitle>
                                    {contact.isPrimary && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#3E5CFF]/20 text-[#3E5CFF]">
                                            Primary
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                    {contact.title && <span>{contact.title}</span>}
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[contact.role] || ROLE_COLORS.OTHER}`}>
                                        {ROLE_LABELS[contact.role] || contact.role}
                                    </span>
                                </CardDescription>
                            </div>
                            {canManage && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3"
                                    onClick={() => setDeleteTarget(contact)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm">
                            {contact.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{contact.email}</span>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{contact.phone}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}>
                <DialogContent className={`sm:max-w-[400px] ${dark.dialog}`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
                            <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                            Remove Contact
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#94A3B8]">
                        Are you sure you want to remove <strong className="text-[#F8FAFC]">{deleteTarget?.name}</strong> from this deal?
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
                            {isPending ? 'Removing...' : 'Remove'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
