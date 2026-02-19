import { Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'
import { RegisterWizard } from '@/components/auth/register-wizard'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Register - BlackGem',
    description: 'Create your fund management account.',
}

export default function RegisterPage() {
    return (
        <div className="relative flex min-h-screen bg-[#11141D]">
            {/* Vertical brand mark — left edge */}
            <div className="hidden lg:flex items-center pl-8 select-none">
                <span
                    className="font-serif text-[16px] text-slate-500 tracking-tight"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                    <span className="font-normal">Black</span><span className="font-semibold">Gem</span>
                </span>
            </div>

            {/* Form — centered */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-[520px]">
                    <SessionProvider>
                        <Suspense>
                            <RegisterWizard />
                        </Suspense>
                    </SessionProvider>
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
