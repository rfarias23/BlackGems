import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    'Super Admin':        { variant: 'secondary', className: 'bg-red-500/20 text-red-400' },
    'Fund Admin':         { variant: 'secondary', className: 'bg-purple-500/20 text-purple-400' },
    'Investment Manager': { variant: 'secondary', className: 'bg-blue-500/20 text-blue-400' },
    'Analyst':            { variant: 'secondary', className: 'bg-cyan-500/20 text-cyan-400' },
    'LP Primary':         { variant: 'secondary', className: 'bg-emerald-500/20 text-emerald-400' },
    'LP Viewer':          { variant: 'outline',   className: 'border-slate-500 text-slate-400' },
    'Auditor':            { variant: 'outline',   className: 'border-amber-500 text-amber-400' },
};

export function UserRoleBadge({ role, className }: { role: string; className?: string }) {
    const config = roleConfig[role] || roleConfig['Analyst'];
    return (
        <Badge variant={config.variant} className={cn(config.className, className)}>
            {role}
        </Badge>
    );
}
