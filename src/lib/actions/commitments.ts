'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { logAudit, computeChanges } from '@/lib/shared/audit'
import { revalidatePath } from 'next/cache'
import { notDeleted, softDelete } from '@/lib/shared/soft-delete'
import { z } from 'zod'

// ============================================================================
// Schemas
// ============================================================================

const createCommitmentSchema = z.object({
    fundId: z.string().min(1, 'Fund is required'),
    committedAmount: z.string().min(1, 'Committed amount is required'),
    status: z.enum(['PENDING', 'SIGNED', 'FUNDED', 'ACTIVE', 'DEFAULTED', 'TRANSFERRED', 'REDEEMED']).default('PENDING'),
    notes: z.string().optional(),
})

const updateCommitmentSchema = z.object({
    committedAmount: z.string().optional(),
    calledAmount: z.string().optional(),
    paidAmount: z.string().optional(),
    status: z.enum(['PENDING', 'SIGNED', 'FUNDED', 'ACTIVE', 'DEFAULTED', 'TRANSFERRED', 'REDEEMED']).optional(),
    notes: z.string().optional(),
})

// ============================================================================
// Reads
// ============================================================================

export async function getFundsForCommitment(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    const funds = await prisma.fund.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    })

    return funds
}

// ============================================================================
// Mutations
// ============================================================================

export async function createCommitment(
    investorId: string,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const raw = {
        fundId: formData.get('fundId') as string,
        committedAmount: formData.get('committedAmount') as string,
        status: (formData.get('status') as string) || 'PENDING',
        notes: formData.get('notes') as string,
    }

    const parsed = createCommitmentSchema.safeParse(raw)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'Invalid input.' }
    }

    const { fundId, committedAmount, status, notes } = parsed.data

    try {
        await requireFundAccess(session.user.id, fundId)
    } catch {
        return { error: 'Access denied' }
    }

    const amount = parseFloat(committedAmount.replace(/[$,]/g, ''))
    if (isNaN(amount) || amount <= 0) {
        return { error: 'Invalid committed amount.' }
    }

    try {
        // Verify investor exists
        const investor = await prisma.investor.findFirst({
            where: { id: investorId, ...notDeleted },
        })
        if (!investor) {
            return { error: 'Investor not found.' }
        }

        // Check for duplicate commitment
        const existing = await prisma.commitment.findFirst({
            where: { investorId, fundId, ...notDeleted },
        })
        if (existing) {
            return { error: 'This investor already has a commitment to this fund.' }
        }

        const commitment = await prisma.commitment.create({
            data: {
                investorId,
                fundId,
                committedAmount: amount,
                status,
                notes: notes || null,
            },
        })

        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'Commitment',
            entityId: commitment.id,
            changes: {
                investorId: { old: null, new: investorId },
                fundId: { old: null, new: fundId },
                committedAmount: { old: null, new: amount },
                status: { old: null, new: status },
            },
        })

        revalidatePath(`/investors/${investorId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to create commitment:', error)
        return { error: 'Failed to create commitment.' }
    }
}

export async function updateCommitment(
    commitmentId: string,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const raw: Record<string, string | undefined> = {}
    const committedAmount = formData.get('committedAmount') as string | null
    const calledAmount = formData.get('calledAmount') as string | null
    const paidAmount = formData.get('paidAmount') as string | null
    const status = formData.get('status') as string | null
    const notes = formData.get('notes') as string | null

    if (committedAmount !== null) raw.committedAmount = committedAmount
    if (calledAmount !== null) raw.calledAmount = calledAmount
    if (paidAmount !== null) raw.paidAmount = paidAmount
    if (status) raw.status = status
    if (notes !== null) raw.notes = notes

    const parsed = updateCommitmentSchema.safeParse(raw)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'Invalid input.' }
    }

    try {
        const existing = await prisma.commitment.findFirst({
            where: { id: commitmentId, ...notDeleted },
        })
        if (!existing) {
            return { error: 'Commitment not found.' }
        }

        await requireFundAccess(session.user.id, existing.fundId)

        const updateData: Record<string, unknown> = {}

        if (parsed.data.committedAmount !== undefined) {
            const val = parseFloat(parsed.data.committedAmount.replace(/[$,]/g, ''))
            if (!isNaN(val) && val > 0) updateData.committedAmount = val
        }
        if (parsed.data.calledAmount !== undefined) {
            const val = parseFloat(parsed.data.calledAmount.replace(/[$,]/g, ''))
            if (!isNaN(val)) updateData.calledAmount = val
        }
        if (parsed.data.paidAmount !== undefined) {
            const val = parseFloat(parsed.data.paidAmount.replace(/[$,]/g, ''))
            if (!isNaN(val)) updateData.paidAmount = val
        }
        if (parsed.data.status) {
            updateData.status = parsed.data.status
        }
        if (parsed.data.notes !== undefined) {
            updateData.notes = parsed.data.notes || null
        }

        if (Object.keys(updateData).length === 0) {
            return { error: 'No changes provided.' }
        }

        await prisma.commitment.update({
            where: { id: commitmentId },
            data: updateData,
        })

        const oldData: Record<string, unknown> = {
            committedAmount: Number(existing.committedAmount),
            calledAmount: Number(existing.calledAmount),
            paidAmount: Number(existing.paidAmount),
            status: existing.status,
            notes: existing.notes,
        }

        await logAudit({
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'Commitment',
            entityId: commitmentId,
            changes: computeChanges(oldData, updateData),
        })

        revalidatePath(`/investors/${existing.investorId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to update commitment:', error)
        return { error: 'Failed to update commitment.' }
    }
}

export async function deleteCommitment(
    commitmentId: string
): Promise<{ error?: string; success?: boolean }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    try {
        const existing = await prisma.commitment.findFirst({
            where: { id: commitmentId, ...notDeleted },
        })
        if (!existing) {
            return { error: 'Commitment not found.' }
        }

        await requireFundAccess(session.user.id, existing.fundId)

        await softDelete('commitment', commitmentId)

        await logAudit({
            userId: session.user.id,
            action: 'DELETE',
            entityType: 'Commitment',
            entityId: commitmentId,
            changes: {
                investorId: { old: existing.investorId, new: null },
                fundId: { old: existing.fundId, new: null },
                committedAmount: { old: Number(existing.committedAmount), new: null },
            },
        })

        revalidatePath(`/investors/${existing.investorId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to delete commitment:', error)
        return { error: 'Failed to delete commitment.' }
    }
}
