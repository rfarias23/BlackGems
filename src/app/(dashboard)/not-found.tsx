import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">Not Found</h2>
            <p className="text-muted-foreground mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
            <Button asChild variant="outline" className="text-white border-[#334155] hover:bg-[#334155]">
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
    )
}
