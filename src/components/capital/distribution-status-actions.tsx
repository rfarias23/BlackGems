'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check, X, Play } from 'lucide-react';
import { updateDistributionStatus } from '@/lib/actions/distributions';

interface DistributionStatusActionsProps {
    distributionId: string;
    currentStatus: string;
}

export function DistributionStatusActions({ distributionId, currentStatus }: DistributionStatusActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleStatusChange = (newStatus: string) => {
        setError(null);
        startTransition(async () => {
            const result = await updateDistributionStatus(distributionId, newStatus);
            if (result.error) {
                setError(result.error);
            }
        });
    };

    // Determine which actions are available based on current status
    const getAvailableActions = () => {
        switch (currentStatus) {
            case 'Draft':
                return [
                    { label: 'Approve', status: 'Approved', icon: Check },
                    { label: 'Cancel', status: 'Cancelled', icon: X },
                ];
            case 'Approved':
                return [
                    { label: 'Start Processing', status: 'Processing', icon: Play },
                    { label: 'Cancel', status: 'Cancelled', icon: X },
                ];
            case 'Processing':
                return [
                    { label: 'Mark Completed', status: 'Completed', icon: Check },
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
                        {isPending ? 'Updating...' : 'Actions'}
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
