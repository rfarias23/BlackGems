'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Lock, Unlock, Edit, ShieldAlert, ExternalLink } from 'lucide-react';
import { updateUser } from '@/lib/actions/users';
import type { UserDetail } from '@/lib/actions/users';
import { UserRoleBadge } from './user-role-badge';

const USER_ROLES = [
    'Super Admin', 'Fund Admin', 'Investment Manager',
    'Analyst', 'LP Primary', 'LP Viewer', 'Auditor',
];

interface UserOverviewProps {
    user: UserDetail;
}

function formatDate(date: Date | null): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

function InlineField({
    label,
    value,
    editValue,
    onChange,
    isEditing,
    type = 'text',
    placeholder,
    className = '',
}: {
    label?: string;
    value: string;
    editValue: string;
    onChange: (val: string) => void;
    isEditing: boolean;
    type?: string;
    placeholder?: string;
    className?: string;
}) {
    if (isEditing) {
        return (
            <div className={className}>
                {label && <span className="text-xs text-[#94A3B8] mb-1 block">{label}</span>}
                <div className="flex items-center gap-1.5">
                    <Unlock className="h-3 w-3 text-[#3E5CFF] shrink-0" />
                    <Input
                        type={type}
                        value={editValue}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm focus-visible:ring-[#3E5CFF]"
                    />
                </div>
            </div>
        );
    }
    return (
        <div className={className}>
            {label && <span className="text-xs text-[#94A3B8] mb-1 block">{label}</span>}
            <div className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-[#475569] shrink-0" />
                <span className="text-sm font-medium">{value}</span>
            </div>
        </div>
    );
}

export function UserOverview({ user }: UserOverviewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Editable state
    const [editName, setEditName] = useState(user.name || '');
    const [editEmail, setEditEmail] = useState(user.email);
    const [editRole, setEditRole] = useState(user.role);

    const resetState = () => {
        setEditName(user.name || '');
        setEditEmail(user.email);
        setEditRole(user.role);
    };

    const handleEditClick = () => {
        setShowConfirm(true);
    };

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
        formData.set('name', editName);
        formData.set('email', editEmail);
        formData.set('role', editRole);

        startTransition(async () => {
            const result = await updateUser(user.id, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setIsEditing(false);
            }
        });
    };

    const isLPUser = user.roleRaw === 'LP_PRIMARY' || user.roleRaw === 'LP_VIEWER';

    return (
        <>
            {/* Edit/Save/Discard controls */}
            <div className="flex items-center gap-2 mb-4">
                {!isEditing ? (
                    <Button variant="outline" onClick={handleEditClick}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
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
                        <Button
                            variant="outline"
                            onClick={handleDiscard}
                            disabled={isPending}
                        >
                            Discard
                        </Button>
                    </>
                )}
            </div>

            {error && (
                <div className="rounded-md p-3 text-sm bg-[#DC2626]/15 text-[#DC2626] mb-4">
                    {error}
                </div>
            )}

            {/* Header fields — name, email, role (shown only in edit mode) */}
            {isEditing && (
                <Card className="mb-4">
                    <CardContent className="pt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <InlineField
                                label="Name"
                                value={user.name || '-'}
                                editValue={editName}
                                onChange={setEditName}
                                isEditing={isEditing}
                                placeholder="Jane Smith"
                            />
                            <InlineField
                                label="Email"
                                value={user.email}
                                editValue={editEmail}
                                onChange={setEditEmail}
                                isEditing={isEditing}
                                type="email"
                                placeholder="jane@blackgem.com"
                            />
                            <div>
                                <span className="text-xs text-[#94A3B8] mb-1 block">Role</span>
                                <div className="flex items-center gap-1.5">
                                    <Unlock className="h-3 w-3 text-[#3E5CFF] shrink-0" />
                                    <Select value={editRole} onValueChange={setEditRole}>
                                        <SelectTrigger className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {USER_ROLES.map((r) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Account Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Account Information</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Role</span>
                            <UserRoleBadge role={user.role} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <span className={user.isActive ? 'text-emerald-400 font-medium' : 'text-gray-400 font-medium'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Created</span>
                            <span className="font-medium">{formatDate(user.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Updated</span>
                            <span className="font-medium">{formatDate(user.updatedAt)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Fund Memberships */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fund Memberships</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.fundMemberships.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                                No fund memberships.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fund</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {user.fundMemberships.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-medium">{m.fundName}</TableCell>
                                            <TableCell>{m.role}</TableCell>
                                            <TableCell>
                                                <span className={m.isActive ? 'text-emerald-400' : 'text-gray-400'}>
                                                    {m.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(m.joinedAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* LP Investor Link */}
            {isLPUser && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Linked Investor Record</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.linkedInvestor ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium">{user.linkedInvestor.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Status: {user.linkedInvestor.status}
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/investors/${user.linkedInvestor.id}`}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View Investor
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                No investor record linked. This user cannot access LP Portal data.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F8FAFC] flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            Enable Edit Mode
                        </DialogTitle>
                        <DialogDescription className="text-[#94A3B8] pt-2">
                            You are about to modify user account data. All changes will be recorded in the audit log and attributed to your account.
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
