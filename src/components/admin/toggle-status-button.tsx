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
import { UserX, UserCheck } from 'lucide-react';
import { toggleUserStatus } from '@/lib/actions/users';

interface ToggleStatusButtonProps {
    userId: string;
    userName: string | null;
    isActive: boolean;
}

export function ToggleStatusButton({ userId, userName, isActive }: ToggleStatusButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleToggle = () => {
        setError(null);
        startTransition(async () => {
            const result = await toggleUserStatus(userId);
            if (result?.error) {
                setError(result.error);
            } else {
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isActive ? (
                    <Button variant="outline" size="sm">
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                    </Button>
                ) : (
                    <Button variant="outline" size="sm">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isActive ? 'Deactivate User' : 'Activate User'}
                    </DialogTitle>
                    <DialogDescription>
                        {isActive
                            ? `Are you sure you want to deactivate "${userName || 'this user'}"? They will no longer be able to log in.`
                            : `Are you sure you want to activate "${userName || 'this user'}"? They will be able to log in again.`
                        }
                    </DialogDescription>
                </DialogHeader>
                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant={isActive ? 'destructive' : 'default'}
                        onClick={handleToggle}
                        disabled={isPending}
                    >
                        {isPending
                            ? (isActive ? 'Deactivating...' : 'Activating...')
                            : (isActive ? 'Deactivate' : 'Activate')
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
