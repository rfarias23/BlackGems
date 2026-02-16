/**
 * Sentry error monitoring integration.
 *
 * Uses lazy-init pattern to avoid build crashes when SENTRY_DSN is not set.
 * To activate: install @sentry/nextjs and set SENTRY_DSN in environment.
 *
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Set SENTRY_DSN in .env
 * 3. Call initSentry() in instrumentation.ts or layout.tsx
 */

interface SentryLike {
    init(options: {
        dsn: string
        tracesSampleRate: number
        environment: string | undefined
        enabled: boolean
    }): void
    captureException(error: unknown): void
    captureMessage(message: string, level: string): void
}

let _initialized = false
let _sentry: SentryLike | null = null

async function loadSentryModule(): Promise<SentryLike | null> {
    try {
        // Dynamic import with variable specifier prevents TypeScript
        // from resolving the module at build time
        const specifier = ['@sentry', 'nextjs'].join('/')
        return await import(/* webpackIgnore: true */ specifier) as unknown as SentryLike
    } catch {
        return null
    }
}

export async function initSentry(): Promise<void> {
    if (_initialized || !process.env.SENTRY_DSN) return

    const mod = await loadSentryModule()
    if (!mod) {
        console.warn('Sentry SDK not available. Error monitoring disabled.')
        return
    }

    mod.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
        enabled: process.env.NODE_ENV === 'production',
    })
    _sentry = mod
    _initialized = true
}

export function captureException(error: unknown): void {
    if (!_initialized || !_sentry) return
    _sentry.captureException(error)
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!_initialized || !_sentry) return
    _sentry.captureMessage(message, level)
}
