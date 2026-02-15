import { LoginForm } from '@/components/auth/login-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login - BlackGem',
    description: 'Login to your account',
}

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen bg-[#11141D]">
            {/* Vertical brand mark — left edge */}
            <div className="hidden lg:flex items-center pl-8 select-none">
                <span
                    className="text-[13px] tracking-[0.25em] text-slate-600 uppercase"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                    Black<span className="font-semibold">Gem</span>
                </span>
            </div>

            {/* Form — centered vertically, offset left of center */}
            <div className="flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-[420px]">
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
