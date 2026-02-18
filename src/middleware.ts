import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { extractSubdomain } from '@/lib/shared/tenant'

/**
 * Next.js middleware for subdomain-based tenant resolution + auth.
 *
 * Composes with NextAuth auth() wrapper:
 * 1. NextAuth authorized() callback runs first (login redirects, LP protection)
 * 2. Our custom handler runs to inject the fund slug header
 *
 * In development (localhost), falls back to ?fund=<slug> query parameter.
 */
export default auth((request) => {
  const hostname = request.headers.get('host') || ''

  // 1. Try subdomain extraction (production)
  let fundSlug = extractSubdomain(hostname)

  // 2. Fallback: query parameter for local development
  if (!fundSlug && hostname.includes('localhost')) {
    fundSlug = request.nextUrl.searchParams.get('fund') || null
  }

  // 3. If no tenant resolved, pass through (root domain)
  if (!fundSlug) {
    return NextResponse.next()
  }

  // 4. Clone headers and inject fund slug for downstream consumption
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-fund-slug', fundSlug)

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
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|api/auth).*)',
  ],
}
