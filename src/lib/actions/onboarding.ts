'use server'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/shared/audit'
import { rateLimit } from '@/lib/shared/rate-limit'
import { validateSlug } from '@/lib/shared/slug-utils'
import { onboardingSchema, type OnboardingInput } from '@/lib/shared/onboarding-schemas'
import { DEFAULT_PERMISSIONS } from '@/lib/shared/permissions'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import type { Currency, FundType, OrgEntityType } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

type OnboardingResult =
  | { success: true; fundSlug: string }
  | { error: string }

// ============================================================================
// VALID ENTITY TYPE VALUES (must match Prisma enum)
// ============================================================================

const VALID_ENTITY_TYPES: Record<string, OrgEntityType> = {
  LLC: 'LLC',
  LP: 'LP',
  C_CORP: 'C_CORP',
  S_CORP: 'S_CORP',
  SICAV: 'SICAV',
  LTD: 'LTD',
  SARL: 'SARL',
  OTHER: 'OTHER',
}

// ============================================================================
// SERVER ACTION
// ============================================================================

/**
 * Self-service registration: creates Organization + User + Fund + FundMember
 * in a single atomic transaction. No auth required (public route).
 */
export async function registerWithOnboarding(
  input: OnboardingInput
): Promise<OnboardingResult> {
  // 1. Validate full input (before rate limiting, since email may be missing)
  const parsed = onboardingSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const data = parsed.data
  const normalizedEmail = data.userEmail.toLowerCase().trim()

  // 2. Rate limit: 5 attempts per email per 5 minutes
  const rl = rateLimit(`register:${normalizedEmail}`, 5, 300_000)
  if (!rl.success) {
    return { error: 'Too many attempts. Please try again in a few minutes.' }
  }

  const isSearchFund = data.vehicleType === 'SEARCH_FUND'

  // Resolve slugs: Search Fund uses orgSlug for both org and fund
  const orgSlug = data.orgSlug
  const fundSlug = isSearchFund ? orgSlug : (data.fundSlug ?? orgSlug)
  const fundName = isSearchFund ? data.firmName : (data.fundName ?? data.firmName)

  // 3. Validate slugs
  const orgSlugValidation = validateSlug(orgSlug)
  if (!orgSlugValidation.valid) {
    return { error: orgSlugValidation.error }
  }

  if (!isSearchFund && fundSlug !== orgSlug) {
    const fundSlugValidation = validateSlug(fundSlug)
    if (!fundSlugValidation.valid) {
      return { error: fundSlugValidation.error }
    }
  }

  // 4. Check uniqueness (parallel)
  try {
    const [existingEmail, existingOrgSlug, existingFundSlug] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
      prisma.organization.findUnique({ where: { slug: orgSlug }, select: { id: true } }),
      prisma.fund.findFirst({ where: { slug: fundSlug }, select: { id: true } }),
    ])

    if (existingEmail) {
      return { error: 'An account with this email already exists.' }
    }
    if (existingOrgSlug) {
      return { error: 'This firm URL is already taken.' }
    }
    if (existingFundSlug) {
      return { error: 'This fund URL is already taken.' }
    }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }

  // 5. Hash password
  const passwordHash = await bcrypt.hash(data.password, 10)

  // 6. Prisma $transaction: create 4 records atomically
  try {
    const resolvedEntityType = data.entityType && VALID_ENTITY_TYPES[data.entityType]
      ? VALID_ENTITY_TYPES[data.entityType]
      : (isSearchFund ? 'LLC' as OrgEntityType : undefined)

    const orgType = isSearchFund ? 'SEARCH_FUND' : 'MID_PE'

    const result = await prisma.$transaction(async (tx) => {
      // Create Organization
      const org = await tx.organization.create({
        data: {
          name: data.firmName,
          slug: orgSlug,
          type: orgType,
          legalName: data.legalName || (isSearchFund ? data.firmName : null),
          entityType: resolvedEntityType ?? null,
          jurisdictionOfFormation: data.jurisdiction || null,
          country: 'USA',
          baseCurrency: data.currency as Currency,
          onboardingCompleted: true,
        },
      })

      // Create User
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: data.userName,
          passwordHash,
          role: 'SUPER_ADMIN',
          organizationId: org.id,
          isActive: true,
        },
      })

      // Create Fund
      const fund = await tx.fund.create({
        data: {
          name: fundName,
          slug: fundSlug,
          organizationId: org.id,
          type: (isSearchFund ? 'TRADITIONAL_SEARCH_FUND' : data.fundType) as FundType,
          status: 'RAISING',
          targetSize: data.targetSize,
          vintage: isSearchFund ? new Date().getFullYear() : (data.vintage ?? new Date().getFullYear()),
          currency: data.currency as Currency,
          managementFee: 0.02,
          carriedInterest: 0.20,
          hurdleRate: isSearchFund ? 0.08 : null,
          strategy: data.strategy || null,
        },
      })

      // Create FundMember
      await tx.fundMember.create({
        data: {
          fundId: fund.id,
          userId: user.id,
          role: 'PRINCIPAL',
          permissions: DEFAULT_PERMISSIONS.PRINCIPAL,
          isActive: true,
        },
      })

      return { org, user, fund }
    })

    // 7. Audit logging (fire-and-forget, outside transaction)
    const auditPromises = [
      logAudit({
        userId: result.user.id,
        action: 'CREATE',
        entityType: 'Organization',
        entityId: result.org.id,
        changes: { name: { old: null, new: data.firmName }, slug: { old: null, new: orgSlug } },
      }),
      logAudit({
        userId: result.user.id,
        action: 'CREATE',
        entityType: 'User',
        entityId: result.user.id,
        changes: { source: { old: null, new: 'onboarding' }, vehicleType: { old: null, new: data.vehicleType } },
      }),
      logAudit({
        userId: result.user.id,
        action: 'CREATE',
        entityType: 'Fund',
        entityId: result.fund.id,
        changes: { name: { old: null, new: fundName }, slug: { old: null, new: fundSlug }, type: { old: null, new: isSearchFund ? 'TRADITIONAL_SEARCH_FUND' : data.fundType } },
      }),
    ]

    // Don't await — fire-and-forget
    Promise.all(auditPromises).catch((err) => console.error('Audit logging failed:', err))

    // 8. Welcome email (fire-and-forget)
    sendWelcomeEmail({
      to: normalizedEmail,
      userName: data.userName,
      fundName,
      fundSlug,
    }).catch((err) => console.error('Welcome email failed:', err))

    return { success: true, fundSlug }
  } catch (error) {
    // Handle Prisma unique constraint violation (race condition)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { error: 'This email or URL was just taken. Please try again.' }
    }
    console.error('Registration failed:', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}
