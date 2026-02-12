'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { acknowledgeCapitalCall } from '@/lib/actions/portal';

interface AcknowledgeCallButtonProps {
    itemId: string;
}

export function AcknowledgeCallButton({ itemId }: AcknowledgeCallButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);

    const handleAcknowledge = () => {
        setError(null);
        startTransition(async () => {
            const result = await acknowledgeCapitalCall(itemId);
            if (result.error) {
                setError(result.error);
            } else {
                setAcknowledged(true);
            }
        });
    };

    if (acknowledged) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle className="h-3 w-3" />
                Acknowledged
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <Button
                variant="outline"
                size="sm"
                onClick={handleAcknowledge}
                disabled={isPending}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            >
                {isPending ? 'Acknowledging...' : 'Acknowledge'}
            </Button>
        </div>
    );
}
