'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { Trash2 } from 'lucide-react';
import { deleteUser } from '@/lib/actions/users';

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleDelete = () => {
        setError(null);
        startTransition(async () => {
            try {
                const result = await deleteUser(userId);
                if (result?.error) {
                    setError(result.error);
                } else if (result?.success) {
                    setOpen(false);
                    router.push('/admin/users');
                }
            } catch (err) {
                console.error('[DeleteUser] Error:', err);
                setError('An unexpected error occurred.');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E293B] text-[#F8FAFC] border-[#334155]">
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription className="text-[#94A3B8]">
                        Are you sure you want to delete &quot;{userName}&quot;? Their account will be
                        deactivated and they will no longer be able to log in.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-md p-3 text-sm bg-[#DC2626]/15 text-[#DC2626]">
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => { setOpen(false); setError(null); }}
                        disabled={isPending}
                        className="border-[#334155] bg-transparent text-[#F8FAFC] hover:bg-[#334155] hover:text-[#F8FAFC]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-[#DC2626] text-white hover:bg-[#DC2626]/90"
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
