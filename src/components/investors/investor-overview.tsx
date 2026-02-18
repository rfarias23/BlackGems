'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Lock, Unlock, Mail, Phone, MapPin, Edit, ShieldAlert } from 'lucide-react';
import { updateInvestor } from '@/lib/actions/investors';

const EDIT_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST'];

const INVESTOR_TYPES = [
    'Individual', 'Joint Venture', 'Trust', 'Individual Retirement Account', 'Family Office',
    'Foundation', 'Endowment', 'Pension Fund', 'Investment Fund',
    'Corporate', 'Sovereign Wealth', 'Insurance Company', 'Bank', 'Other',
];

const INVESTOR_STATUSES = [
    'Prospect', 'Contacted', 'Interested', 'Due Diligence',
    'Committed', 'Active', 'Inactive', 'Declined',
];

interface InvestorOverviewProps {
    investor: {
        id: string;
        name: string;
        type: string;
        status: string;
        legalName: string | null;
        jurisdiction: string | null;
        email: string | null;
        phone: string | null;
        city: string | null;
        state: string | null;
        country: string;
        contactName: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        contactTitle: string | null;
        investmentCapacity: string | null;
        notes: string | null;
        source: string | null;
        createdAt: Date;
    };
    userRole: string;
    currencySymbol?: string;
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
    prefix,
    className = '',
    textClassName = 'text-sm font-medium',
}: {
    label?: string;
    value: string;
    editValue: string;
    onChange: (val: string) => void;
    isEditing: boolean;
    type?: string;
    placeholder?: string;
    prefix?: string;
    className?: string;
    textClassName?: string;
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
                <span className={textClassName}>{prefix}{value}</span>
            </div>
        </div>
    );
}

export function InvestorOverview({ investor, userRole, currencySymbol = '$' }: InvestorOverviewProps) {
    const canEdit = EDIT_ROLES.includes(userRole);
    const [isEditing, setIsEditing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Editable state
    const [editName, setEditName] = useState(investor.name);
    const [editType, setEditType] = useState(investor.type);
    const [editStatus, setEditStatus] = useState(investor.status);
    const [editLegalName, setEditLegalName] = useState(investor.legalName || '');
    const [editJurisdiction, setEditJurisdiction] = useState(investor.jurisdiction || '');
    const [editEmail, setEditEmail] = useState(investor.email || '');
    const [editPhone, setEditPhone] = useState(investor.phone || '');
    const [editContactName, setEditContactName] = useState(investor.contactName || '');
    const [editContactEmail, setEditContactEmail] = useState(investor.contactEmail || '');
    const [editContactPhone, setEditContactPhone] = useState(investor.contactPhone || '');
    const [editContactTitle, setEditContactTitle] = useState(investor.contactTitle || '');
    const [editCity, setEditCity] = useState(investor.city || '');
    const [editState, setEditState] = useState(investor.state || '');
    const [editCountry, setEditCountry] = useState(investor.country || '');
    const [editInvestmentCapacity, setEditInvestmentCapacity] = useState(
        (investor.investmentCapacity || '').replace(/[$,]/g, '')
    );
    const [editNotes, setEditNotes] = useState(investor.notes || '');
    const [editSource, setEditSource] = useState(investor.source || '');

    const resetState = () => {
        setEditName(investor.name);
        setEditType(investor.type);
        setEditStatus(investor.status);
        setEditLegalName(investor.legalName || '');
        setEditJurisdiction(investor.jurisdiction || '');
        setEditEmail(investor.email || '');
        setEditPhone(investor.phone || '');
        setEditContactName(investor.contactName || '');
        setEditContactEmail(investor.contactEmail || '');
        setEditContactPhone(investor.contactPhone || '');
        setEditContactTitle(investor.contactTitle || '');
        setEditCity(investor.city || '');
        setEditState(investor.state || '');
        setEditCountry(investor.country || '');
        setEditInvestmentCapacity((investor.investmentCapacity || '').replace(/[$,]/g, ''));
        setEditNotes(investor.notes || '');
        setEditSource(investor.source || '');
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
        formData.set('type', editType);
        formData.set('status', editStatus);
        formData.set('legalName', editLegalName);
        formData.set('jurisdiction', editJurisdiction);
        formData.set('email', editEmail);
        formData.set('phone', editPhone);
        formData.set('contactName', editContactName);
        formData.set('contactEmail', editContactEmail);
        formData.set('contactPhone', editContactPhone);
        formData.set('contactTitle', editContactTitle);
        formData.set('city', editCity);
        formData.set('state', editState);
        formData.set('country', editCountry);
        formData.set('investmentCapacity', editInvestmentCapacity);
        formData.set('notes', editNotes);
        formData.set('source', editSource);

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
            {/* Edit/Save/Discard controls */}
            {canEdit && (
                <div className="flex items-center gap-2 mb-4">
                    {!isEditing ? (
                        <Button variant="outline" onClick={handleEditClick}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Investor
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
            )}

            {error && (
                <div className="rounded-md p-3 text-sm bg-[#DC2626]/15 text-[#DC2626] mb-4">
                    {error}
                </div>
            )}

            {/* Header fields — name, type, status (shown only in edit mode) */}
            {isEditing && (
                <Card className="mb-4">
                    <CardContent className="pt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <InlineField
                                label="Investor Name"
                                value={investor.name}
                                editValue={editName}
                                onChange={setEditName}
                                isEditing={isEditing}
                            />
                            <div>
                                <span className="text-xs text-[#94A3B8] mb-1 block">Type</span>
                                <div className="flex items-center gap-1.5">
                                    <Unlock className="h-3 w-3 text-[#3E5CFF] shrink-0" />
                                    <Select value={editType} onValueChange={setEditType}>
                                        <SelectTrigger className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INVESTOR_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-[#94A3B8] mb-1 block">Status</span>
                                <div className="flex items-center gap-1.5">
                                    <Unlock className="h-3 w-3 text-[#3E5CFF] shrink-0" />
                                    <Select value={editStatus} onValueChange={setEditStatus}>
                                        <SelectTrigger className="h-8 bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INVESTOR_STATUSES.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contact & Details */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Contact Information</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <InlineField
                                    label="Contact Name"
                                    value={investor.contactName || '-'}
                                    editValue={editContactName}
                                    onChange={setEditContactName}
                                    isEditing={isEditing}
                                    placeholder="John Smith"
                                />
                                <InlineField
                                    label="Contact Title"
                                    value={investor.contactTitle || '-'}
                                    editValue={editContactTitle}
                                    onChange={setEditContactTitle}
                                    isEditing={isEditing}
                                    placeholder="Managing Director"
                                />
                                <InlineField
                                    label="Email"
                                    value={investor.email || '-'}
                                    editValue={editEmail}
                                    onChange={setEditEmail}
                                    isEditing={isEditing}
                                    type="email"
                                    placeholder="investor@example.com"
                                />
                                <InlineField
                                    label="Contact Email"
                                    value={investor.contactEmail || '-'}
                                    editValue={editContactEmail}
                                    onChange={setEditContactEmail}
                                    isEditing={isEditing}
                                    type="email"
                                    placeholder="contact@example.com"
                                />
                                <InlineField
                                    label="Phone"
                                    value={investor.phone || '-'}
                                    editValue={editPhone}
                                    onChange={setEditPhone}
                                    isEditing={isEditing}
                                    placeholder="+1 (555) 000-0000"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <InlineField
                                        label="City"
                                        value={investor.city || '-'}
                                        editValue={editCity}
                                        onChange={setEditCity}
                                        isEditing={isEditing}
                                        placeholder="Miami"
                                    />
                                    <InlineField
                                        label="State"
                                        value={investor.state || '-'}
                                        editValue={editState}
                                        onChange={setEditState}
                                        isEditing={isEditing}
                                        placeholder="FL"
                                    />
                                    <InlineField
                                        label="Country"
                                        value={investor.country || '-'}
                                        editValue={editCountry}
                                        onChange={setEditCountry}
                                        isEditing={isEditing}
                                        placeholder="USA"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {investor.contactName && (
                                    <div>
                                        <div className="text-sm font-medium">{investor.contactName}</div>
                                        {investor.contactTitle && (
                                            <div className="text-xs text-muted-foreground">{investor.contactTitle}</div>
                                        )}
                                    </div>
                                )}
                                {investor.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{investor.email}</span>
                                    </div>
                                )}
                                {investor.contactEmail && investor.contactEmail !== investor.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{investor.contactEmail} (contact)</span>
                                    </div>
                                )}
                                {investor.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{investor.phone}</span>
                                    </div>
                                )}
                                {(investor.city || investor.state || investor.country) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {[investor.city, investor.state, investor.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {!investor.email && !investor.phone && !investor.contactName && (
                                    <div className="text-sm text-muted-foreground italic">
                                        No contact information provided.
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Entity Details</CardTitle>
                        {isEditing ? (
                            <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                        ) : (
                            <Lock className="h-3.5 w-3.5 text-[#475569]" />
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <InlineField
                                    label="Legal Name"
                                    value={investor.legalName || investor.name}
                                    editValue={editLegalName}
                                    onChange={setEditLegalName}
                                    isEditing={isEditing}
                                    placeholder="Williams Family Trust"
                                />
                                <InlineField
                                    label="Jurisdiction"
                                    value={investor.jurisdiction || '-'}
                                    editValue={editJurisdiction}
                                    onChange={setEditJurisdiction}
                                    isEditing={isEditing}
                                    placeholder="Delaware, USA"
                                />
                                <InlineField
                                    label="Investment Capacity"
                                    value={investor.investmentCapacity || '-'}
                                    editValue={editInvestmentCapacity}
                                    onChange={setEditInvestmentCapacity}
                                    isEditing={isEditing}
                                    placeholder="5000000"
                                    prefix={currencySymbol}
                                />
                                <InlineField
                                    label="Source"
                                    value={investor.source || '-'}
                                    editValue={editSource}
                                    onChange={setEditSource}
                                    isEditing={isEditing}
                                    placeholder="Referral"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Legal Name</span>
                                    <span className="font-medium">{investor.legalName || investor.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{investor.type}</span>
                                </div>
                                {investor.jurisdiction && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Jurisdiction</span>
                                        <span className="font-medium">{investor.jurisdiction}</span>
                                    </div>
                                )}
                                {investor.investmentCapacity && investor.investmentCapacity !== '$0' && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Investment Capacity</span>
                                        <span className="font-medium">{investor.investmentCapacity}</span>
                                    </div>
                                )}
                                {investor.source && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Source</span>
                                        <span className="font-medium">{investor.source}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Added</span>
                                    <span className="font-medium">{formatDate(investor.createdAt)}</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Notes</CardTitle>
                    {isEditing ? (
                        <Unlock className="h-3.5 w-3.5 text-[#3E5CFF]" />
                    ) : (
                        <Lock className="h-3.5 w-3.5 text-[#475569]" />
                    )}
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <Textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes about this investor..."
                            rows={4}
                            className="bg-[#11141D] border-[#334155] text-[#F8FAFC] text-sm resize-none focus-visible:ring-[#3E5CFF]"
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {investor.notes || 'No notes.'}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F8FAFC] flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            Enable Edit Mode
                        </DialogTitle>
                        <DialogDescription className="text-[#94A3B8] pt-2">
                            You are about to modify investor data. All changes will be recorded in the audit log and attributed to your account.
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
