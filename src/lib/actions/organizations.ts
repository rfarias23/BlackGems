'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/shared/audit'
import { z } from 'zod'

// Re-export slug utilities from shared module (no 'use server' restriction)
export { generateSlug, validateSlug } from '@/lib/shared/slug-utils'
import { validateSlug } from '@/lib/shared/slug-utils'

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
