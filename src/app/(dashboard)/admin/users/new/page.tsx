import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { UserForm } from '@/components/admin/user-form';
import { getInvestorsForLinking } from '@/lib/actions/users';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function NewUserPage() {
    const session = await auth();
    const role = session?.user?.role;
    if (!role || !['SUPER_ADMIN', 'FUND_ADMIN'].includes(role as string)) {
        redirect('/dashboard');
    }

    const investors = await getInvestorsForLinking();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Invite User</h2>
                    <p className="text-muted-foreground">
                        Create a new user account for the platform.
                    </p>
                </div>
            </div>
            <UserForm investors={investors} />
        </div>
    );
}
