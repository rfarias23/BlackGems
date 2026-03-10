import { LoginForm } from '@/components/auth/login-form'
import { Metadata } from 'next'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
    title: 'Login - BlackGem',
    description: 'Login to your account',
}

export default async function LoginPage() {
    // Resolve org branding from subdomain
    const headerList = await headers()
    const orgSlug = headerList.get('x-org-slug')

    let orgName: string | null = null
    if (orgSlug) {
        const org = await prisma.organization.findUnique({
            where: { slug: orgSlug },
            select: { name: true },
        })
        orgName = org?.name ?? null
    }

    return (
        <div className="relative flex min-h-screen bg-[#11141D]">
            {/* Vertical brand mark — left edge (root domain only) */}
            {!orgName && (
                <div className="hidden lg:flex items-center pl-8 select-none">
                    <span
                        className="font-serif text-[16px] text-slate-500 tracking-tight"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                        <span className="font-normal">Black</span><span className="font-semibold">Gem</span>
                    </span>
                </div>
            )}

            {/* Form — centered vertically, offset left of center */}
            <div className="flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-[420px]">
                    {orgName && (
                        <div className="mb-8 text-center">
                            <p className="text-sm text-slate-400 mb-2">Investor Portal</p>
                            <h1 className="font-serif text-2xl font-semibold text-white tracking-tight">
                                {orgName}
                            </h1>
                        </div>
                    )}
                    <LoginForm />
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[11px] text-slate-600">
                    &copy; {new Date().getFullYear()} BlackGem. All rights reserved.
                </p>
            </div>
        </div>
    )
}
