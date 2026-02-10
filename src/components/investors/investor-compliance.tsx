'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Shield, Edit, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { updateInvestor } from '@/lib/actions/investors';

const EDIT_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST'];

const KYC_STATUSES = ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'EXPIRED'];
const AML_STATUSES = ['PENDING', 'CLEARED', 'FLAGGED', 'REJECTED'];
const ACCREDITED_STATUSES = [
    { value: '', label: 'None' },
    { value: 'ACCREDITED_INDIVIDUAL', label: 'Accredited Individual' },
    { value: 'QUALIFIED_PURCHASER', label: 'Qualified Purchaser' },
    { value: 'QUALIFIED_CLIENT', label: 'Qualified Client' },
    { value: 'INSTITUTIONAL', label: 'Institutional' },
    { value: 'NOT_ACCREDITED', label: 'Not Accredited' },
    { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
];

function getKYCBadgeColor(status: string) {
    switch (status) {
        case 'APPROVED': return 'bg-emerald-500/20 text-emerald-400';
        case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400';
        case 'REJECTED': return 'bg-red-500/20 text-red-400';
        case 'EXPIRED': return 'bg-orange-500/20 text-orange-400';
        default: return 'bg-slate-500/20 text-slate-400';
    }
}

function getAMLBadgeColor(status: string) {
    switch (status) {
        case 'CLEARED': return 'bg-emerald-500/20 text-emerald-400';
        case 'FLAGGED': return 'bg-orange-500/20 text-orange-400';
        case 'REJECTED': return 'bg-red-500/20 text-red-400';
        default: return 'bg-slate-500/20 text-slate-400';
    }
}

function toInputDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

interface InvestorComplianceProps {
    investor: {
        id: string;
        kycStatus: string;
        kycCompletedAt: Date | null;
        amlStatus: string;
        amlCompletedAt: Date | null;
        accreditedStatus: string | null;
    };
    userRole: string;
}

export function InvestorCompliance({ investor, userRole }: InvestorComplianceProps) {
    const canEdit = EDIT_ROLES.includes(userRole);
    const [isEditing, setIsEditing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [editKycStatus, setEditKycStatus] = useState(investor.kycStatus);
    const [editKycCompletedAt, setEditKycCompletedAt] = useState(toInputDate(investor.kycCompletedAt));
    const [editAmlStatus, setEditAmlStatus] = useState(investor.amlStatus);
    const [editAmlCompletedAt, setEditAmlCompletedAt] = useState(toInputDate(investor.amlCompletedAt));
    const [editAccreditedStatus, setEditAccreditedStatus] = useState(investor.accreditedStatus || '');

    const resetState = () => {
        setEditKycStatus(investor.kycStatus);
        setEditKycCompletedAt(toInputDate(investor.kycCompletedAt));
        setEditAmlStatus(investor.amlStatus);
        setEditAmlCompletedAt(toInputDate(investor.amlCompletedAt));
        setEditAccreditedStatus(investor.accreditedStatus || '');
    };

    const handleEditClick = () => setShowConfirm(true);

    const handleConfirmEdit = () => {
        setShowConfirm(false);
        setIsEditing(true);
        setError(null);
        resetState();
    };

    const handleDiscard = () => {
        setIsEditing(false);
        setError(null);
        resetState();
    };

    const handleSave = () => {
        setError(null);
        const formData = new FormData();
        formData.set('kycStatus', editKycStatus);
        formData.set('kycCompletedAt', editKycCompletedAt);
        formData.set('amlStatus', editAmlStatus);
        formData.set('amlCompletedAt', editAmlCompletedAt);
        formData.set('accreditedStatus', editAccreditedStatus);

        startTransition(async () => {
            const result = await updateInvestor(investor.id, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setIsEditing(false);
            }
        });
    };

    return (
        <>
            {canEdit && (
                <div className="flex items-center gap-2 mb-4">
                    {!isEditing ? (
                        <Button variant="outline" onClick={handleEditClick}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Compliance
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleSave}
                                disabled={isPending}
                                className="bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90"
                            >
                                {isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant="outline" onClick={handleDiscard} disabled={isPending}>
                                Discard
                            </Button>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className="rounded-md p-3 text-sm bg-[#DC2626]/15 text-[#DC2626] mb-4">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {/* KYC Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            KYC Status
                        </CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                {isEditing ? (
                                    <Select value={editKycStatus} onValueChange={setEditKycStatus}>
                                        <SelectTrigger className="w-40 h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {KYC_STATUSES.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge className={getKYCBadgeColor(investor.kycStatus)}>
                                        {investor.kycStatus}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completed</span>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={editKycCompletedAt}
                                        onChange={(e) => setEditKycCompletedAt(e.target.value)}
                                        className="w-40 h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                                    />
                                ) : (
                                    <span className="text-sm font-medium">
                                        {formatDate(investor.kycCompletedAt)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Accreditation</span>
                                {isEditing ? (
                                    <Select value={editAccreditedStatus} onValueChange={setEditAccreditedStatus}>
                                        <SelectTrigger className="w-48 h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ACCREDITED_STATUSES.map((s) => (
                                                <SelectItem key={s.value || '__none'} value={s.value || '__none'}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="text-sm font-medium">
                                        {investor.accreditedStatus
                                            ? investor.accreditedStatus.replace(/_/g, ' ')
                                            : '-'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* AML Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            AML Status
                        </CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                {isEditing ? (
                                    <Select value={editAmlStatus} onValueChange={setEditAmlStatus}>
                                        <SelectTrigger className="w-40 h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AML_STATUSES.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge className={getAMLBadgeColor(investor.amlStatus)}>
                                        {investor.amlStatus}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completed</span>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={editAmlCompletedAt}
                                        onChange={(e) => setEditAmlCompletedAt(e.target.value)}
                                        className="w-40 h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                                    />
                                ) : (
                                    <span className="text-sm font-medium">
                                        {formatDate(investor.amlCompletedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F8FAFC] flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            Enable Edit Mode
                        </DialogTitle>
                        <DialogDescription className="text-[#94A3B8] pt-2">
                            You are about to modify compliance data. All changes will be recorded in the audit log and attributed to your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirm(false)}
                            className="border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmEdit}
                            className="bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90"
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
