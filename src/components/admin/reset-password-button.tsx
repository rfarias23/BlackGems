'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { KeyRound, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { resetUserPassword } from '@/lib/actions/users';

interface ResetPasswordButtonProps {
    userId: string;
    userName: string | null;
}

function generatePassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export function ResetPasswordButton({ userId, userName }: ResetPasswordButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleReset = () => {
        setError(null);
        setSuccess(false);
        const formData = new FormData();
        formData.set('newPassword', password);

        startTransition(async () => {
            const result = await resetUserPassword(userId, formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setSuccess(true);
            }
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setPassword('');
            setShowPassword(false);
            setError(null);
            setSuccess(false);
        }
    };

    const handleGenerate = () => {
        const pw = generatePassword();
        setPassword(pw);
        setShowPassword(true);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for {userName || 'this user'}. They will need to use this password on their next login.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-[#11141D] border-[#334155] text-[#F8FAFC] placeholder:text-[#94A3B8] focus-visible:ring-[#3E5CFF]"
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
                            <Button type="button" variant="outline" onClick={handleGenerate}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Generate
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-400">
                            Password has been reset successfully.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        {success ? 'Close' : 'Cancel'}
                    </Button>
                    {!success && (
                        <Button onClick={handleReset} disabled={isPending || password.length < 6}>
                            {isPending ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
