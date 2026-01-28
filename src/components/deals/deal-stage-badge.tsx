import { Badge } from '@/components/ui/badge';

export type DealStage =
    | 'Identified'
    | 'Initial Review'
    | 'NDA Signed'
    | 'IOI Submitted'
    | 'LOI Negotiation'
    | 'Due Diligence'
    | 'Closing'
    | 'Closed Won'
    | 'Closed Lost'
    | 'On Hold';

interface DealStageBadgeProps {
    stage: DealStage;
    className?: string;
}

export function DealStageBadge({ stage, className }: DealStageBadgeProps) {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    let customClass = '';

    switch (stage) {
        case 'Identified':
            variant = 'outline';
            customClass = 'text-slate-500 border-slate-500';
            break;
        case 'Initial Review':
            variant = 'secondary';
            customClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            break;
        case 'NDA Signed':
            variant = 'secondary';
            customClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            break;
        case 'IOI Submitted':
            variant = 'default'; // Access color roughly
            customClass = 'bg-indigo-500 hover:bg-indigo-600';
            break;
        case 'LOI Negotiation':
            variant = 'secondary';
            customClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            break;
        case 'Due Diligence':
            variant = 'secondary';
            customClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            break;
        case 'Closing':
            variant = 'secondary';
            customClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
            break;
        case 'Closed Won':
            variant = 'default';
            customClass = 'bg-emerald-600 hover:bg-emerald-700'; // emerald-forest
            break;
        case 'Closed Lost':
            variant = 'destructive';
            break;
        case 'On Hold':
            variant = 'secondary';
            customClass = 'text-muted-foreground';
            break;
    }

    return (
        <Badge variant={variant} className={`${customClass} ${className} whitespace-nowrap`}>
            {stage}
        </Badge>
    );
}
