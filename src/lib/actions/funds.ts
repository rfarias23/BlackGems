'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { setActiveFundId } from '@/lib/shared/active-fund'
import { logAudit } from '@/lib/shared/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Currency, FundType } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface FundSummary {
  id: string
  name: string
  currency: string
  status: string
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createFundSchema = z.object({
  name: z.string().min(1, 'Fund name is required').max(200),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  type: z.enum([
    'TRADITIONAL_SEARCH_FUND',
    'SELF_FUNDED_SEARCH',
    'ACCELERATOR_FUND',
    'ACQUISITION_FUND',
    'PE_FUND',
    'HOLDING_COMPANY',
  ]),
  targetSize: z.string().min(1, 'Target size is required'),
  vintage: z.string().optional(),
})

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Returns all funds the user has access to.
 * SUPER_ADMIN and FUND_ADMIN see all funds.
 * Other users see only funds with active FundMember records.
 */
export async function getUserFunds(userId: string): Promise<FundSummary[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'SUPER_ADMIN' || user?.role === 'FUND_ADMIN') {
    return prisma.fund.findMany({
      select: { id: true, name: true, currency: true, status: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  const memberships = await prisma.fundMember.findMany({
    where: { userId, isActive: true },
    select: {
      fund: {
        select: { id: true, name: true, currency: true, status: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return memberships.map((m) => m.fund)
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Switches the user's active fund.
 * Validates the user has access to the target fund.
 */
export async function switchActiveFund(
  fundId: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  try {
    await requireFundAccess(session.user.id, fundId)
  } catch {
    return { error: 'Access denied' }
  }

  await setActiveFundId(fundId)
  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Creates a new fund with the current user as PRINCIPAL.
 * Only FUND_ADMIN and SUPER_ADMIN can create funds.
 */
export async function createFund(
  formData: FormData
): Promise<{ error?: string; success?: boolean; fundId?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  // Role check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'FUND_ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return { error: 'Only fund administrators can create funds' }
  }

  const raw = {
    name: formData.get('name') as string,
    currency: formData.get('currency') as string,
    type: formData.get('type') as string,
    targetSize: formData.get('targetSize') as string,
    vintage: formData.get('vintage') as string | null,
  }

  const parsed = createFundSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { name, currency, type, targetSize, vintage } = parsed.data

  try {
    // Parse target size (strip currency symbols)
    const targetSizeNum = parseFloat(targetSize.replace(/[$\u20AC\u00A3,]/g, ''))
    if (isNaN(targetSizeNum) || targetSizeNum <= 0) {
      return { error: 'Target size must be a positive number' }
    }

    // Create fund + membership in a transaction
    const fund = await prisma.$transaction(async (tx) => {
      const newFund = await tx.fund.create({
        data: {
          name,
          currency: currency as Currency,
          type: type as FundType,
          status: 'RAISING',
          targetSize: targetSizeNum,
          vintage: vintage ? parseInt(vintage, 10) : new Date().getFullYear(),
          managementFee: 0.02,
          carriedInterest: 0.20,
        },
      })

      await tx.fundMember.create({
        data: {
          fundId: newFund.id,
          userId: session.user.id!,
          role: 'PRINCIPAL',
          isActive: true,
        },
      })

      return newFund
    })

    // Auto-switch to new fund
    await setActiveFundId(fund.id)

    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Fund',
      entityId: fund.id,
      changes: {
        name: { old: null, new: name },
        currency: { old: null, new: currency },
        type: { old: null, new: type },
        targetSize: { old: null, new: targetSizeNum },
      },
    })

    revalidatePath('/', 'layout')
    return { success: true, fundId: fund.id }
  } catch (error) {
    console.error('Failed to create fund:', error)
    const message = error instanceof Error ? error.message : 'Failed to create fund'
    return { error: message }
  }
}
