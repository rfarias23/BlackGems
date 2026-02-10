'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { updateCommitment, deleteCommitment } from '@/lib/actions/commitments';

const ALL_STATUSES = [
    'PENDING', 'SIGNED', 'FUNDED', 'ACTIVE', 'DEFAULTED', 'TRANSFERRED', 'REDEEMED',
];

function getStatusBadgeColor(status: string) {
    switch (status) {
        case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400';
        case 'FUNDED': return 'bg-blue-500/20 text-blue-400';
        case 'SIGNED': return 'bg-purple-500/20 text-purple-400';
        case 'PENDING': return 'bg-slate-500/20 text-slate-400';
        case 'DEFAULTED': return 'bg-red-500/20 text-red-400';
        case 'TRANSFERRED': return 'bg-orange-500/20 text-orange-400';
        case 'REDEEMED': return 'bg-yellow-500/20 text-yellow-400';
        default: return 'bg-slate-500/20 text-slate-400';
    }
}

interface Commitment {
    id: string;
    fundName: string;
    committedAmount: string;
    calledAmount: string;
    paidAmount: string;
    status: string;
}

interface CommitmentListProps {
    commitments: Commitment[];
    canEdit: boolean;
}

function CommitmentRow({ commitment, canEdit }: { commitment: Commitment; canEdit: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [showDelete, setShowDelete] = useState(false);

    const [editCommitted, setEditCommitted] = useState('');
    const [editCalled, setEditCalled] = useState('');
    const [editPaid, setEditPaid] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [error, setError] = useState<string | null>(null);

    const startEdit = () => {
        setEditCommitted(commitment.committedAmount.replace(/[$,]/g, ''));
        setEditCalled(commitment.calledAmount.replace(/[$,]/g, ''));
        setEditPaid(commitment.paidAmount.replace(/[$,]/g, ''));
        setEditStatus(commitment.status);
        setError(null);
        setIsEditing(true);
    };

    const handleSave = () => {
        setError(null);
        const formData = new FormData();
        formData.set('committedAmount', editCommitted);
        formData.set('calledAmount', editCalled);
        formData.set('paidAmount', editPaid);
        formData.set('status', editStatus);

        startTransition(async () => {
            const result = await updateCommitment(commitment.id, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setIsEditing(false);
            }
        });
    };

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteCommitment(commitment.id);
            if (result?.error) {
                setError(result.error);
            }
            setShowDelete(false);
        });
    };

    if (isEditing) {
        return (
            <div className="p-4 border rounded-lg space-y-3">
                {error && (
                    <div className="rounded-md p-2 text-xs bg-[#DC2626]/15 text-[#DC2626]">
                        {error}
                    </div>
                )}
                <div className="font-medium">{commitment.fundName}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">Committed</label>
                        <Input
                            value={editCommitted}
                            onChange={(e) => setEditCommitted(e.target.value)}
                            className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">Called</label>
                        <Input
                            value={editCalled}
                            onChange={(e) => setEditCalled(e.target.value)}
                            className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">Paid</label>
                        <Input
                            value={editPaid}
                            onChange={(e) => setEditPaid(e.target.value)}
                            className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">Status</label>
                        <Select value={editStatus} onValueChange={setEditStatus}>
                            <SelectTrigger className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        disabled={isPending}
                    >
                        <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90"
                    >
                        <Check className="h-4 w-4 mr-1" /> {isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between p-4 border rounded-lg group">
                <div>
                    <div className="font-medium">{commitment.fundName}</div>
                    <div className="text-sm text-muted-foreground">
                        Called: {commitment.calledAmount} / Paid: {commitment.paidAmount}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-lg font-bold">{commitment.committedAmount}</div>
                        <Badge className={getStatusBadgeColor(commitment.status)}>
                            {commitment.status}
                        </Badge>
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEdit}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-300"
                                onClick={() => setShowDelete(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F8FAFC]">Delete Commitment</DialogTitle>
                        <DialogDescription className="text-[#94A3B8]">
                            Are you sure you want to delete the commitment to <strong>{commitment.fundName}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDelete(false)}
                            className="border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            {isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function CommitmentList({ commitments, canEdit }: CommitmentListProps) {
    return (
        <div className="space-y-4">
            {commitments.map((commitment) => (
                <CommitmentRow key={commitment.id} commitment={commitment} canEdit={canEdit} />
            ))}
        </div>
    );
}
