'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions'
import { AlertCircle, ArrowRight } from 'lucide-react'

export function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined)

    return (
        <div>
            {/* Title */}
            <h1 className="font-serif text-[28px] font-normal text-[#F8FAFC] mb-2">
                Login
            </h1>
            <p className="text-[14px] text-slate-400 mb-10">
                Enter your credentials to access your account.
            </p>

            <form action={dispatch} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-[13px] text-slate-400"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="name@fund.com"
                        required
                        className="w-full rounded-lg border border-[#334155] bg-[#1E2432] px-4 py-3 text-[14px] text-[#F8FAFC] placeholder:text-slate-500 outline-none transition-colors focus:border-[#3E5CFF] focus:ring-1 focus:ring-[#3E5CFF]"
                    />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-[13px] text-slate-400"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        required
                        className="w-full rounded-lg border border-[#334155] bg-[#1E2432] px-4 py-3 text-[14px] text-[#F8FAFC] placeholder:text-slate-500 outline-none transition-colors focus:border-[#3E5CFF] focus:ring-1 focus:ring-[#3E5CFF]"
                    />
                </div>

                {/* Error */}
                {errorMessage && (
                    <div className="flex items-center gap-2 text-sm text-red-400" aria-live="polite">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{errorMessage}</p>
                    </div>
                )}

                {/* Submit */}
                <LoginButton />
            </form>
        </div>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            aria-disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3E5CFF] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#3350E0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? 'Signing in...' : (
                <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                </>
            )}
        </button>
    )
}
