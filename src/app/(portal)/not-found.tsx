import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PortalNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Not Found</h2>
            <p className="text-slate-500 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
            <Button asChild variant="outline">
                <Link href="/portal">Return to Portal</Link>
            </Button>
        </div>
    )
}
