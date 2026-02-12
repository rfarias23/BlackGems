'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Check, X } from 'lucide-react';
import { updatePortalProfile } from '@/lib/actions/portal';

interface ProfileEditFormProps {
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactTitle: string | null;
}

export function ProfileEditForm({ contactName, contactEmail, contactPhone, contactTitle }: ProfileEditFormProps) {
    const [editing, setEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        contactName: contactName || '',
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || '',
        contactTitle: contactTitle || '',
    });

    const handleSave = () => {
        setError(null);
        setSuccess(false);
        startTransition(async () => {
            const result = await updatePortalProfile(form);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setEditing(false);
                setTimeout(() => setSuccess(false), 3000);
            }
        });
    };

    const handleCancel = () => {
        setForm({
            contactName: contactName || '',
            contactEmail: contactEmail || '',
            contactPhone: contactPhone || '',
            contactTitle: contactTitle || '',
        });
        setEditing(false);
        setError(null);
    };

    if (!editing) {
        return (
            <Card className="bg-white border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-slate-900">Primary Contact</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent>
                    {success && (
                        <p className="text-sm text-emerald-600 mb-4">Contact information updated.</p>
                    )}
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <dt className="text-slate-500">Name</dt>
                            <dd className="font-medium text-slate-900 mt-0.5">{contactName || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Title</dt>
                            <dd className="font-medium text-slate-900 mt-0.5">{contactTitle || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Email</dt>
                            <dd className="font-medium text-slate-900 mt-0.5">{contactEmail || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Phone</dt>
                            <dd className="font-medium text-slate-900 mt-0.5">{contactPhone || '-'}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-slate-900">Edit Contact</CardTitle>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isPending}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-[#3E5CFF] hover:bg-[#3E5CFF]/90 text-white"
                    >
                        <Check className="mr-1 h-3 w-3" />
                        {isPending ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contactName" className="text-slate-700">Name</Label>
                        <Input
                            id="contactName"
                            value={form.contactName}
                            onChange={(e) => setForm(f => ({ ...f, contactName: e.target.value }))}
                            className="border-slate-200 bg-white text-slate-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactTitle" className="text-slate-700">Title</Label>
                        <Input
                            id="contactTitle"
                            value={form.contactTitle}
                            onChange={(e) => setForm(f => ({ ...f, contactTitle: e.target.value }))}
                            className="border-slate-200 bg-white text-slate-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactEmail" className="text-slate-700">Email</Label>
                        <Input
                            id="contactEmail"
                            type="email"
                            value={form.contactEmail}
                            onChange={(e) => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                            className="border-slate-200 bg-white text-slate-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactPhone" className="text-slate-700">Phone</Label>
                        <Input
                            id="contactPhone"
                            value={form.contactPhone}
                            onChange={(e) => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                            className="border-slate-200 bg-white text-slate-900"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
