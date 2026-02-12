'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateProfile, UserProfile } from '@/lib/actions/settings';
import { User, Mail, Shield, Calendar } from 'lucide-react';

interface ProfileFormProps {
    user: UserProfile;
}

const roleDisplay: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    FUND_ADMIN: 'Fund Admin',
    INVESTMENT_MANAGER: 'Investment Manager',
    ANALYST: 'Analyst',
    LP_PRIMARY: 'LP Primary',
    LP_VIEWER: 'LP Viewer',
    AUDITOR: 'Auditor',
};

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) => {
            const result = await updateProfile(formData);
            return result;
        },
        undefined
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                </CardTitle>
                <CardDescription>
                    Update your personal information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={user.name || ''}
                                placeholder="Your name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={user.email}
                                    placeholder="your@email.com"
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <div className="flex items-center gap-2 h-10">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="secondary">
                                    {roleDisplay[user.role] || user.role}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Member Since</Label>
                            <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {formatDate(user.createdAt)}
                            </div>
                        </div>
                    </div>

                    {state?.error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {state.error}
                        </div>
                    )}

                    {state?.success && (
                        <div className="rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-500">
                            Profile updated successfully.
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending} variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
