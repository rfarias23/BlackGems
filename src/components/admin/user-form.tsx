'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { createUser } from '@/lib/actions/users';

const USER_ROLES = [
    'Super Admin', 'Fund Admin', 'Investment Manager',
    'Analyst', 'LP Primary', 'LP Viewer', 'Auditor',
];

const LP_ROLES = ['LP Primary', 'LP Viewer'];

interface UserFormProps {
    investors: { id: string; name: string }[];
}

function generatePassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export function UserForm({ investors }: UserFormProps) {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: { error?: string } | undefined, formData: FormData) => {
            return await createUser(formData);
        },
        undefined
    );

    const [selectedRole, setSelectedRole] = useState('Analyst');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isLPRole = LP_ROLES.includes(selectedRole);

    const handleGenerate = () => {
        const pw = generatePassword();
        setPassword(pw);
        setShowPassword(true);
    };

    return (
        <form action={formAction} className="space-y-6">
            {/* Account Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Jane Smith"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="jane@blackgem.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                name="role"
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {USER_ROLES.map((role) => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGenerate}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Generate
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* LP Configuration - shown only for LP roles */}
            {isLPRole && investors.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>LP Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="investorId">Link to Investor Record (optional)</Label>
                            <Select name="investorId">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an investor to link..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {investors.map((inv) => (
                                        <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Linking an investor record grants this user access to the LP Portal with their investment data.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {state?.error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {state.error}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                    <Link href="/admin/users">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending} variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                    {isPending ? 'Creating...' : 'Create User'}
                </Button>
            </div>
        </form>
    );
}
