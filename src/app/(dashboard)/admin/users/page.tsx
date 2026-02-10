import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/admin/user-table';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getUsers } from '@/lib/actions/users';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
    const session = await auth();
    const role = session?.user?.role;
    if (!role || !['SUPER_ADMIN', 'FUND_ADMIN'].includes(role as string)) {
        redirect('/dashboard');
    }

    const users = await getUsers();

    const tableUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        date: user.createdAt.toISOString().split('T')[0],
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Team</h2>
                    <p className="text-muted-foreground">
                        Manage users, roles, and access permissions.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/users/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Invite User
                    </Link>
                </Button>
            </div>
            <UserTable users={tableUsers} />
        </div>
    );
}
