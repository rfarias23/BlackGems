import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { extractSubdomain } from '@/lib/shared/tenant'

/**
 * Next.js middleware for subdomain-based tenant resolution + auth.
 *
 * Composes with NextAuth auth() wrapper:
 * 1. NextAuth authorized() callback runs first (login redirects, LP protection)
 * 2. Our custom handler runs to inject the org slug header (subdomain → Organization.slug)
 *
 * In development (localhost), falls back to ?org=<slug> query parameter.
 */
export default auth((request) => {
  const hostname = request.headers.get('host') || ''

  // 1. Try subdomain extraction (production)
  let orgSlug = extractSubdomain(hostname)

  // 2. Fallback: query parameter for local development
  if (!orgSlug && hostname.includes('localhost')) {
    orgSlug = request.nextUrl.searchParams.get('org') || null
  }

  // 3. If no tenant resolved, pass through (root domain)
  if (!orgSlug) {
    return NextResponse.next()
  }

  // 4. Clone headers and inject org slug for downstream consumption
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-org-slug', orgSlug)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
})

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.png (browser icons)
     * - api/auth (NextAuth handles its own routing)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|api/auth|api/stripe).*)',
  ],
}
