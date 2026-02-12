'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[DashboardError]', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                {error.message || 'An unexpected error occurred while loading this page.'}
            </p>
            <Button onClick={reset} variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                Try again
            </Button>
        </div>
    )
}
