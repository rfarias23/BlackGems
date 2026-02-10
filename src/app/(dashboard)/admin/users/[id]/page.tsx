import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserRoleBadge } from '@/components/admin/user-role-badge';
import { UserOverview } from '@/components/admin/user-overview';
import { ToggleStatusButton } from '@/components/admin/toggle-status-button';
import { ResetPasswordButton } from '@/components/admin/reset-password-button';
import { DeleteUserButton } from '@/components/admin/delete-user-button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getUserById } from '@/lib/actions/users';
import { auth } from '@/lib/auth';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const session = await auth();
    const currentRole = session?.user?.role;
    if (!currentRole || !['SUPER_ADMIN', 'FUND_ADMIN'].includes(currentRole as string)) {
        redirect('/dashboard');
    }

    const user = await getUserById(id);
    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild className="mt-1">
                        <Link href="/admin/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {user.name || user.email}
                        </h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{user.email}</span>
                            <span>·</span>
                            <UserRoleBadge role={user.role} />
                            <span>·</span>
                            <span className={user.isActive ? 'text-emerald-400' : 'text-gray-400'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ResetPasswordButton userId={user.id} userName={user.name} />
                    <ToggleStatusButton userId={user.id} userName={user.name} isActive={user.isActive} />
                    <DeleteUserButton userId={user.id} userName={user.name || user.email} />
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Overview with inline editing */}
            <UserOverview user={user} />
        </div>
    );
}
