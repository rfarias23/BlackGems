'use client'

import { useEffect } from 'react'

export default function RegisterError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[RegisterError]', error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#11141D] px-6">
            <div className="w-full max-w-[420px] text-center">
                <h2 className="font-serif text-[22px] font-normal text-[#F8FAFC] mb-2">
                    Something went wrong
                </h2>
                <p className="text-[14px] text-slate-400 mb-2 leading-relaxed">
                    {error.message || 'An unexpected error occurred during registration.'}
                </p>
                {error.digest && (
                    <p className="text-[12px] text-slate-600 font-mono mb-6">
                        Error: {error.digest}
                    </p>
                )}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="rounded-lg border border-[#334155] px-4 py-2.5 text-[14px] text-[#F8FAFC] transition-colors hover:bg-[#1E2432]"
                    >
                        Try again
                    </button>
                    <a
                        href="/register"
                        className="rounded-lg bg-[#3E5CFF] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#3350E0]"
                    >
                        Start over
                    </a>
                </div>
            </div>
        </div>
    )
}
