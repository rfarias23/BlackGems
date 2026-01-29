import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type InvestorStatus =
    | 'Prospect'
    | 'Contacted'
    | 'Interested'
    | 'Due Diligence'
    | 'Committed'
    | 'Active'
    | 'Inactive'
    | 'Declined';

const statusConfig: Record<InvestorStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    'Prospect': { variant: 'outline', className: 'border-slate-500 text-slate-400' },
    'Contacted': { variant: 'outline', className: 'border-blue-500 text-blue-400' },
    'Interested': { variant: 'secondary', className: 'bg-blue-500/20 text-blue-400' },
    'Due Diligence': { variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-400' },
    'Committed': { variant: 'secondary', className: 'bg-purple-500/20 text-purple-400' },
    'Active': { variant: 'secondary', className: 'bg-emerald-500/20 text-emerald-400' },
    'Inactive': { variant: 'outline', className: 'border-gray-500 text-gray-400' },
    'Declined': { variant: 'destructive', className: 'bg-red-500/20 text-red-400' },
};

interface InvestorStatusBadgeProps {
    status: InvestorStatus;
    className?: string;
}

export function InvestorStatusBadge({ status, className }: InvestorStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig['Prospect'];

    return (
        <Badge variant={config.variant} className={cn(config.className, className)}>
            {status}
        </Badge>
    );
}
