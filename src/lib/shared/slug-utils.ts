/**
 * Slug generation and validation utilities.
 *
 * Pure functions — no server runtime, no database calls.
 * Shared by both client components (wizard preview) and server actions.
 */

export const RESERVED_SLUGS = [
  'www', 'api', 'app', 'admin', 'login', 'register', 'portal',
  'dashboard', 'settings', 'pricing', 'docs', 'help', 'support',
  'status', 'blog', 'mail', 'ftp', 'ssh', 'cdn', 'static',
]

/**
 * Generates a URL-safe slug from a display name.
 * DNS label max length: 63 characters.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

/**
 * Validates a slug for use as a subdomain.
 */
export function validateSlug(
  slug: string
): { valid: true } | { valid: false; error: string } {
  if (!slug) return { valid: false, error: 'Slug cannot be empty' }
  if (slug.length > 63) return { valid: false, error: 'Slug must be 63 characters or fewer' }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return { valid: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen' }
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: `"${slug}" is a reserved name and cannot be used` }
  }
  return { valid: true }
}
