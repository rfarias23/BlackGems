'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, TrendingUp, FileText, Check, AlertTriangle } from 'lucide-react';
import { updatePortfolioCompanyStatus } from '@/lib/actions/portfolio';

interface PortfolioStatusActionsProps {
    companyId: string;
    currentStatus: string;
}

export function PortfolioStatusActions({ companyId, currentStatus }: PortfolioStatusActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleStatusChange = (newStatus: string) => {
        setError(null);
        startTransition(async () => {
            const result = await updatePortfolioCompanyStatus(companyId, newStatus);
            if (result.error) {
                setError(result.error);
            }
        });
    };

    const getAvailableActions = () => {
        switch (currentStatus) {
            case 'Holding':
                return [
                    { label: 'Preparing Exit', status: 'Preparing Exit', icon: TrendingUp },
                    { label: 'Write Off', status: 'Written Off', icon: AlertTriangle },
                ];
            case 'Preparing Exit':
                return [
                    { label: 'Under LOI', status: 'Under LOI', icon: FileText },
                    { label: 'Back to Holding', status: 'Holding', icon: Check },
                ];
            case 'Under LOI':
                return [
                    { label: 'Partial Exit', status: 'Partial Exit', icon: TrendingUp },
                    { label: 'Full Exit', status: 'Exited', icon: Check },
                    { label: 'Back to Preparing', status: 'Preparing Exit', icon: FileText },
                ];
            case 'Partial Exit':
                return [
                    { label: 'Full Exit', status: 'Exited', icon: Check },
                ];
            default:
                return [];
        }
    };

    const actions = getAvailableActions();

    if (actions.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {error && (
                <span className="text-sm text-destructive">{error}</span>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isPending}>
                        {isPending ? 'Updating...' : 'Status'}
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {actions.map((action) => (
                        <DropdownMenuItem
                            key={action.status}
                            onClick={() => handleStatusChange(action.status)}
                        >
                            <action.icon className="mr-2 h-4 w-4" />
                            {action.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
