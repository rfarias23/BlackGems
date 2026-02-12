import { AcceptInviteForm } from '@/components/auth/accept-invite-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Accept Invitation - BlackGem',
    description: 'Set up your investor portal account',
}

export default async function AcceptInvitePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const params = await searchParams
    const token = params.token || ''

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <AcceptInviteForm token={token} />
        </div>
    )
}
