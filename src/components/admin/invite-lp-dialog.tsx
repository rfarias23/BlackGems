'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Mail, CheckCircle } from 'lucide-react';
import { createLPInvitation } from '@/lib/actions/users';

const dark = {
    dialog: 'bg-[#1E293B] text-[#F8FAFC] border-[#334155]',
    input: 'bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]',
    label: 'text-[#94A3B8]',
    error: 'bg-[#DC2626]/15 text-[#DC2626]',
    success: 'bg-emerald-500/15 text-emerald-400',
    cancelBtn: 'border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]',
    saveBtn: 'bg-[#F8FAFC] text-[#11141D] hover:bg-[#F8FAFC]/90',
    muted: 'text-[#94A3B8]',
    select: 'bg-[#11141D] border-[#334155] text-[#F8FAFC]',
    selectContent: 'bg-[#1E293B] border-[#334155] text-[#F8FAFC]',
} as const;

interface InviteLPDialogProps {
    investors: { id: string; name: string }[];
}

export function InviteLPDialog({ investors }: InviteLPDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [investorId, setInvestorId] = useState('');
    const [role, setRole] = useState('LP_PRIMARY');

    const resetForm = () => {
        setEmail('');
        setInvestorId('');
        setRole('LP_PRIMARY');
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = () => {
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.set('email', email);
        formData.set('investorId', investorId);
        formData.set('role', role);

        startTransition(async () => {
            const result = await createLPInvitation(formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                setSuccess(`Invitation sent to ${result.email}`);
                setTimeout(() => {
                    setOpen(false);
                    resetForm();
                }, 2000);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Invite LP
                </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[480px] ${dark.dialog}`}>
                <DialogHeader>
                    <DialogTitle className="text-[#F8FAFC] flex items-center gap-2">
                        <Mail className="h-5 w-5 text-[#3E5CFF]" />
                        Invite LP via Email
                    </DialogTitle>
                    <DialogDescription className={dark.muted}>
                        Send an email invitation to an LP. They&apos;ll set their own password.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className={dark.label}>Email Address *</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="investor@example.com"
                            className={dark.input}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Link to Investor Record *</Label>
                        <Select value={investorId} onValueChange={setInvestorId}>
                            <SelectTrigger className={dark.select}>
                                <SelectValue placeholder="Select an investor..." />
                            </SelectTrigger>
                            <SelectContent className={dark.selectContent}>
                                {investors.length === 0 ? (
                                    <SelectItem value="__none" disabled>
                                        No unlinked investors available
                                    </SelectItem>
                                ) : (
                                    investors.map((inv) => (
                                        <SelectItem key={inv.id} value={inv.id}>
                                            {inv.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-[#64748B]">
                            The LP will see investment data for this investor in their portal.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className={dark.label}>Portal Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className={dark.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={dark.selectContent}>
                                <SelectItem value="LP_PRIMARY">LP Primary (full access)</SelectItem>
                                <SelectItem value="LP_VIEWER">LP Viewer (read-only)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {error && (
                    <div className={`rounded-md p-3 text-sm ${dark.error}`}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className={`rounded-md p-3 text-sm flex items-center gap-2 ${dark.success}`}>
                        <CheckCircle className="h-4 w-4" />
                        {success}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setOpen(false); resetForm(); }}
                        disabled={isPending}
                        className={dark.cancelBtn}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!email || !investorId || isPending}
                        className={dark.saveBtn}
                    >
                        {isPending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
