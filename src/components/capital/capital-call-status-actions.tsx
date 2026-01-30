'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Send, Check, X } from 'lucide-react';
import { updateCapitalCallStatus } from '@/lib/actions/capital-calls';

interface CapitalCallStatusActionsProps {
    callId: string;
    currentStatus: string;
}

export function CapitalCallStatusActions({ callId, currentStatus }: CapitalCallStatusActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleStatusChange = (newStatus: string) => {
        setError(null);
        startTransition(async () => {
            const result = await updateCapitalCallStatus(callId, newStatus);
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
                    { label: 'Send to LPs', status: 'Sent', icon: Send },
                    { label: 'Cancel', status: 'Cancelled', icon: X },
                ];
            case 'Sent':
                return [
                    { label: 'Mark Fully Funded', status: 'Fully Funded', icon: Check },
                ];
            case 'Partially Funded':
                return [
                    { label: 'Mark Fully Funded', status: 'Fully Funded', icon: Check },
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
