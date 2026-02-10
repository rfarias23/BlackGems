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
import { Trash2 } from 'lucide-react';
import { deleteUser } from '@/lib/actions/users';

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            await deleteUser(userId);
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &quot;{userName}&quot;? Their account will be deactivated and they will no longer be able to log in.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                        {isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
