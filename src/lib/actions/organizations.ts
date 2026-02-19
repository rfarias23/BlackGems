'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/shared/audit'
import { z } from 'zod'

// ============================================================================
// SLUG UTILITIES (exported for testing)
// ============================================================================

const RESERVED_SLUGS = [
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

// ============================================================================
// SCHEMAS
// ============================================================================

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  slug: z.string().min(1).max(63),
  type: z.enum(['SEARCH_FUND', 'MICRO_PE', 'MID_PE', 'CONSOLIDATED_PE']),
  legalName: z.string().optional(),
  country: z.string().default('USA'),
})

// ============================================================================
// ACTIONS
// ============================================================================

export async function createOrganization(input: z.infer<typeof createOrganizationSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const parsed = createOrganizationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const slugValidation = validateSlug(parsed.data.slug)
  if (!slugValidation.valid) return { error: slugValidation.error }

  // Check slug uniqueness
  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  })
  if (existing) return { error: 'This URL is already taken. Please choose a different one.' }

  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      type: parsed.data.type,
      legalName: parsed.data.legalName || null,
      country: parsed.data.country,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Organization',
    entityId: org.id,
  })

  return { data: org }
}

/**
 * Returns the organization for the current user, if any.
 */
export async function getUserOrganization() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })

  if (!user?.organizationId) return null

  return prisma.organization.findUnique({
    where: { id: user.organizationId },
  })
}
