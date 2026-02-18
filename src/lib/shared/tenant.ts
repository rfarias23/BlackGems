/**
 * Tenant resolution utilities for multi-subdomain routing.
 *
 * Subdomains map to Fund slugs: martha-fund.blackgem.ai -> Fund.slug = "martha-fund"
 * The Organization is inferred from the Fund's organizationId.
 */

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'blackgem.ai'

/**
 * Extracts the subdomain from a hostname.
 * Returns null for root domain, www, or localhost.
 *
 * Examples:
 *   "martha-fund.blackgem.ai" -> "martha-fund"
 *   "blackgem.ai" -> null
 *   "www.blackgem.ai" -> null
 *   "localhost:3002" -> null
 */
export function extractSubdomain(hostname: string, rootDomain: string = ROOT_DOMAIN): string | null {
  if (!hostname) return null

  // Strip port if present
  const host = hostname.split(':')[0]

  // Localhost is always root
  if (host === 'localhost' || host === '127.0.0.1') return null

  // Must end with root domain
  if (!host.endsWith(`.${rootDomain}`)) return null

  // Extract subdomain portion
  const subdomain = host.slice(0, -(rootDomain.length + 1))

  // "www" is treated as root, not a tenant
  if (!subdomain || subdomain === 'www') return null

  return subdomain
}

/**
 * Returns true if the hostname is the root domain (no tenant subdomain).
 */
export function isRootDomain(hostname: string, rootDomain: string = ROOT_DOMAIN): boolean {
  if (!hostname) return true

  const host = hostname.split(':')[0]

  if (host === 'localhost' || host === '127.0.0.1') return true
  if (host === rootDomain || host === `www.${rootDomain}`) return true

  return !host.endsWith(`.${rootDomain}`)
}
