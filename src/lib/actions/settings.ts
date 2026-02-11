'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { FundStatus } from '@prisma/client'
import { logAudit } from '@/lib/shared/audit'

// ============================================================================
// USER PROFILE
// ============================================================================

export interface UserProfile {
    id: string
    name: string | null
    email: string
    role: string
    avatar: string | null
    createdAt: Date
}

export async function getCurrentUser(): Promise<UserProfile | null> {
    const session = await auth()
    if (!session?.user?.email) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            createdAt: true,
        },
    })

    return user
}

const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
})

export async function updateProfile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.email) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
    }

    const validated = updateProfileSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true },
        })

        // Check if email is already taken by another user
        if (rawData.email !== session.user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: rawData.email },
            })
            if (existingUser) {
                return { error: 'Email is already in use' }
            }
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: rawData.name,
                email: rawData.email,
            },
        })

        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                action: 'UPDATE',
                entityType: 'User',
                entityId: currentUser.id,
                changes: {
                    ...(rawData.name !== currentUser.name ? { name: { old: currentUser.name, new: rawData.name } } : {}),
                    ...(rawData.email !== currentUser.email ? { email: { old: currentUser.email, new: rawData.email } } : {}),
                },
            })
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return { error: 'Failed to update profile' }
    }
}

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
})

export async function changePassword(formData: FormData) {
    const session = await auth()
    if (!session?.user?.email) {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        currentPassword: formData.get('currentPassword') as string,
        newPassword: formData.get('newPassword') as string,
        confirmPassword: formData.get('confirmPassword') as string,
    }

    const validated = changePasswordSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    if (rawData.newPassword !== rawData.confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user || !user.passwordHash) {
            return { error: 'User not found' }
        }

        const isValid = await bcrypt.compare(rawData.currentPassword, user.passwordHash)
        if (!isValid) {
            return { error: 'Current password is incorrect' }
        }

        const hashedPassword = await bcrypt.hash(rawData.newPassword, 10)

        await prisma.user.update({
            where: { email: session.user.email },
            data: { passwordHash: hashedPassword },
        })

        await logAudit({
            userId: user.id,
            action: 'UPDATE',
            entityType: 'User',
            entityId: user.id,
            changes: { password: { old: '[redacted]', new: '[redacted]' } },
        })

        return { success: true }
    } catch (error) {
        console.error('Error changing password:', error)
        return { error: 'Failed to change password' }
    }
}

// ============================================================================
// FUND CONFIGURATION
// ============================================================================

export interface FundConfig {
    id: string
    name: string
    legalName: string | null
    type: string
    status: string
    vintage: number
    targetSize: string
    hardCap: string | null
    minimumCommitment: string | null
    currency: string
    managementFee: string
    carriedInterest: string
    hurdleRate: string | null
    description: string | null
}

// Helper to format decimal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMoney(value: any): string {
    if (!value) return ''
    return `$${Number(value).toLocaleString()}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPercent(value: any): string {
    if (!value) return ''
    return `${(Number(value) * 100).toFixed(2)}%`
}

function parseMoney(value: string): number {
    if (!value) return 0
    return parseFloat(value.replace(/[$,]/g, '')) || 0
}

function parsePercent(value: string): number {
    if (!value) return 0
    const num = parseFloat(value.replace(/%/g, ''))
    return num > 1 ? num / 100 : num
}

export async function getFundConfig(): Promise<FundConfig | null> {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const fund = await prisma.fund.findFirst()

    if (!fund) {
        return null
    }

    return {
        id: fund.id,
        name: fund.name,
        legalName: fund.legalName,
        type: fund.type,
        status: fund.status,
        vintage: fund.vintage,
        targetSize: formatMoney(fund.targetSize),
        hardCap: fund.hardCap ? formatMoney(fund.hardCap) : null,
        minimumCommitment: fund.minimumCommitment ? formatMoney(fund.minimumCommitment) : null,
        currency: fund.currency,
        managementFee: formatPercent(fund.managementFee),
        carriedInterest: formatPercent(fund.carriedInterest),
        hurdleRate: fund.hurdleRate ? formatPercent(fund.hurdleRate) : null,
        description: fund.description,
    }
}

const updateFundSchema = z.object({
    name: z.string().min(1, 'Fund name is required'),
    legalName: z.string().optional(),
    description: z.string().optional(),
    targetSize: z.string().min(1, 'Target size is required'),
    hardCap: z.string().optional(),
    minimumCommitment: z.string().optional(),
    managementFee: z.string().min(1, 'Management fee is required'),
    carriedInterest: z.string().min(1, 'Carried interest is required'),
    hurdleRate: z.string().optional(),
})

export async function updateFundConfig(formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const fundId = formData.get('fundId') as string

    const rawData = {
        name: formData.get('name') as string,
        legalName: formData.get('legalName') as string || undefined,
        description: formData.get('description') as string || undefined,
        targetSize: formData.get('targetSize') as string,
        hardCap: formData.get('hardCap') as string || undefined,
        minimumCommitment: formData.get('minimumCommitment') as string || undefined,
        managementFee: formData.get('managementFee') as string,
        carriedInterest: formData.get('carriedInterest') as string,
        hurdleRate: formData.get('hurdleRate') as string || undefined,
    }

    const validated = updateFundSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user?.email || '' },
            select: { id: true },
        })

        await prisma.fund.update({
            where: { id: fundId },
            data: {
                name: rawData.name,
                legalName: rawData.legalName || null,
                description: rawData.description || null,
                targetSize: parseMoney(rawData.targetSize),
                hardCap: rawData.hardCap ? parseMoney(rawData.hardCap) : null,
                minimumCommitment: rawData.minimumCommitment ? parseMoney(rawData.minimumCommitment) : null,
                managementFee: parsePercent(rawData.managementFee),
                carriedInterest: parsePercent(rawData.carriedInterest),
                hurdleRate: rawData.hurdleRate ? parsePercent(rawData.hurdleRate) : null,
            },
        })

        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                action: 'UPDATE',
                entityType: 'Fund',
                entityId: fundId,
            })
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating fund config:', error)
        return { error: 'Failed to update fund configuration' }
    }
}

const FUND_STATUS_DISPLAY: Record<string, string> = {
    RAISING: 'Raising',
    SEARCHING: 'Searching',
    UNDER_LOI: 'Under LOI',
    ACQUIRED: 'Acquired',
    OPERATING: 'Operating',
    PREPARING_EXIT: 'Preparing Exit',
    EXITED: 'Exited',
    DISSOLVED: 'Dissolved',
    CLOSED: 'Closed',
}

const DISPLAY_TO_STATUS: Record<string, string> = Object.fromEntries(
    Object.entries(FUND_STATUS_DISPLAY).map(([k, v]) => [v, k])
)

export async function updateFundStatus(fundId: string, status: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const dbStatus = DISPLAY_TO_STATUS[status] || status

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user?.email || '' },
            select: { id: true },
        })
        const existingFund = await prisma.fund.findUnique({
            where: { id: fundId },
            select: { status: true },
        })

        await prisma.fund.update({
            where: { id: fundId },
            data: { status: dbStatus as FundStatus },
        })

        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                action: 'UPDATE',
                entityType: 'Fund',
                entityId: fundId,
                changes: { status: { old: existingFund?.status, new: dbStatus } },
            })
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating fund status:', error)
        return { error: 'Failed to update fund status' }
    }
}

export async function getFundStatusOptions(): Promise<string[]> {
    return Object.values(FUND_STATUS_DISPLAY)
}
