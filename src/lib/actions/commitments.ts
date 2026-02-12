'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/shared/audit'
import { revalidatePath } from 'next/cache'
import { notDeleted } from '@/lib/shared/soft-delete'

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

export async function createCommitment(
    investorId: string,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const fundId = formData.get('fundId') as string
    const committedAmount = formData.get('committedAmount') as string
    const status = (formData.get('status') as string) || 'PENDING'
    const notes = formData.get('notes') as string

    if (!fundId || !committedAmount) {
        return { error: 'Fund and committed amount are required.' }
    }

    const parsed = parseFloat(committedAmount.replace(/[$,]/g, ''))
    if (isNaN(parsed) || parsed <= 0) {
        return { error: 'Invalid committed amount.' }
    }

    // Verify investor exists
    const investor = await prisma.investor.findFirst({
        where: { id: investorId, ...notDeleted },
    })
    if (!investor) {
        return { error: 'Investor not found.' }
    }

    // Check for duplicate commitment
    const existing = await prisma.commitment.findUnique({
        where: { investorId_fundId: { investorId, fundId } },
    })
    if (existing) {
        return { error: 'This investor already has a commitment to this fund.' }
    }

    const commitment = await prisma.commitment.create({
        data: {
            investorId,
            fundId,
            committedAmount: parsed,
            status: status as 'PENDING' | 'SIGNED' | 'FUNDED' | 'ACTIVE' | 'DEFAULTED' | 'TRANSFERRED' | 'REDEEMED',
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
            committedAmount: { old: null, new: parsed },
            status: { old: null, new: status },
        },
    })

    revalidatePath(`/investors/${investorId}`)
    return { success: true }
}

export async function updateCommitment(
    commitmentId: string,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const existing = await prisma.commitment.findUnique({
        where: { id: commitmentId },
    })
    if (!existing) {
        return { error: 'Commitment not found.' }
    }

    const updateData: Record<string, unknown> = {}

    const committedAmount = formData.get('committedAmount') as string | null
    if (committedAmount !== null) {
        const parsed = parseFloat(committedAmount.replace(/[$,]/g, ''))
        if (!isNaN(parsed) && parsed > 0) {
            updateData.committedAmount = parsed
        }
    }

    const calledAmount = formData.get('calledAmount') as string | null
    if (calledAmount !== null) {
        const parsed = parseFloat(calledAmount.replace(/[$,]/g, ''))
        if (!isNaN(parsed)) updateData.calledAmount = parsed
    }

    const paidAmount = formData.get('paidAmount') as string | null
    if (paidAmount !== null) {
        const parsed = parseFloat(paidAmount.replace(/[$,]/g, ''))
        if (!isNaN(parsed)) updateData.paidAmount = parsed
    }

    const status = formData.get('status') as string | null
    if (status) {
        updateData.status = status
    }

    const notes = formData.get('notes') as string | null
    if (notes !== null) {
        updateData.notes = notes || null
    }

    if (Object.keys(updateData).length === 0) {
        return { error: 'No changes provided.' }
    }

    await prisma.commitment.update({
        where: { id: commitmentId },
        data: updateData,
    })

    await logAudit({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Commitment',
        entityId: commitmentId,
    })

    revalidatePath(`/investors/${existing.investorId}`)
    return { success: true }
}

export async function deleteCommitment(
    commitmentId: string
): Promise<{ error?: string; success?: boolean }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    const existing = await prisma.commitment.findUnique({
        where: { id: commitmentId },
    })
    if (!existing) {
        return { error: 'Commitment not found.' }
    }

    await prisma.commitment.delete({
        where: { id: commitmentId },
    })

    await logAudit({
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'Commitment',
        entityId: commitmentId,
    })

    revalidatePath(`/investors/${existing.investorId}`)
    return { success: true }
}
