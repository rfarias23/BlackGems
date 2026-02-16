'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[GlobalError]', error)
        import('@/lib/sentry').then(({ captureException }) => {
            captureException(error)
        }).catch(() => {
            // Sentry not available
        })
    }, [error])

    return (
        <html>
            <body style={{ backgroundColor: '#11141D', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>
                            An unexpected error occurred.
                        </p>
                        <button
                            onClick={reset}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'transparent',
                                color: '#F8FAFC',
                                border: '1px solid #334155',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
