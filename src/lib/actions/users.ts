'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/shared/audit'

// Display mappings
const USER_ROLE_DISPLAY: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    FUND_ADMIN: 'Fund Admin',
    INVESTMENT_MANAGER: 'Investment Manager',
    ANALYST: 'Analyst',
    LP_PRIMARY: 'LP Primary',
    LP_VIEWER: 'LP Viewer',
    AUDITOR: 'Auditor',
}

const DISPLAY_TO_ROLE: Record<string, string> = {
    'Super Admin': 'SUPER_ADMIN',
    'Fund Admin': 'FUND_ADMIN',
    'Investment Manager': 'INVESTMENT_MANAGER',
    'Analyst': 'ANALYST',
    'LP Primary': 'LP_PRIMARY',
    'LP Viewer': 'LP_VIEWER',
    'Auditor': 'AUDITOR',
}

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'FUND_ADMIN']

// Authorization helper
async function requireAdmin() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }
    const role = session.user.role as UserRole
    if (!ADMIN_ROLES.includes(role)) {
        throw new Error('Forbidden: Admin access required')
    }
    return session
}

// Validation schemas
const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.string(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    investorId: z.string().optional(),
})

// Types
export interface UserListItem {
    id: string
    name: string | null
    email: string
    role: string
    isActive: boolean
    createdAt: Date
}

export interface UserDetail {
    id: string
    name: string | null
    email: string
    role: string
    roleRaw: string
    isActive: boolean
    avatar: string | null
    emailVerified: Date | null
    createdAt: Date
    updatedAt: Date
    fundMemberships: {
        id: string
        fundName: string
        fundId: string
        role: string
        isActive: boolean
        joinedAt: Date
    }[]
    linkedInvestor: {
        id: string
        name: string
        status: string
    } | null
}

// Get all users
export async function getUsers(): Promise<UserListItem[]> {
    const session = await auth()
    if (!session?.user) {
        return []
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    })

    return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: USER_ROLE_DISPLAY[user.role] || user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
    }))
}

// Get single user
export async function getUserById(id: string): Promise<UserDetail | null> {
    const session = await auth()
    if (!session?.user) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            fundMemberships: {
                include: {
                    fund: { select: { name: true } },
                },
            },
            investor: {
                select: { id: true, name: true, status: true },
            },
        },
    })

    if (!user) {
        return null
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: USER_ROLE_DISPLAY[user.role] || user.role,
        roleRaw: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        fundMemberships: user.fundMemberships.map((m) => ({
            id: m.id,
            fundName: m.fund.name,
            fundId: m.fundId,
            role: m.role,
            isActive: m.isActive,
            joinedAt: m.joinedAt,
        })),
        linkedInvestor: user.investor
            ? { id: user.investor.id, name: user.investor.name, status: user.investor.status }
            : null,
    }
}

// Create user
export async function createUser(formData: FormData) {
    let session
    try {
        session = await requireAdmin()
    } catch {
        return { error: 'Unauthorized' }
    }

    const rawData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
        password: formData.get('password') as string,
        investorId: (formData.get('investorId') as string) || undefined,
    }

    const validated = createUserSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data
    const dbRole = (DISPLAY_TO_ROLE[data.role] || 'ANALYST') as UserRole

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    })
    if (existingUser) {
        return { error: 'A user with this email already exists' }
    }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: dbRole,
                passwordHash: hashedPassword,
            },
        })

        // Link to investor record if provided (LP roles)
        if (data.investorId) {
            await prisma.investor.update({
                where: { id: data.investorId },
                data: { userId: user.id },
            })
        }

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'User',
            entityId: user.id,
        })

        revalidatePath('/admin/users')
        redirect(`/admin/users/${user.id}`)
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error creating user:', error)
        return { error: 'Failed to create user' }
    }
}

// Update user
export async function updateUser(id: string, formData: FormData) {
    let session
    try {
        session = await requireAdmin()
    } catch {
        return { error: 'Unauthorized' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    const name = formData.get('name') as string | null
    if (name) updateData.name = name

    const email = formData.get('email') as string | null
    if (email !== null && email) {
        // Check email uniqueness
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })
        if (existingUser && existingUser.id !== id) {
            return { error: 'A user with this email already exists' }
        }
        updateData.email = email
    }

    const role = formData.get('role') as string | null
    if (role) {
        updateData.role = (DISPLAY_TO_ROLE[role] || role) as UserRole
    }

    try {
        await prisma.user.update({
            where: { id },
            data: updateData,
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'User',
            entityId: id,
            changes: updateData,
        })

        revalidatePath('/admin/users')
        revalidatePath(`/admin/users/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating user:', error)
        return { error: 'Failed to update user' }
    }
}

// Toggle user status
export async function toggleUserStatus(id: string) {
    let session
    try {
        session = await requireAdmin()
    } catch {
        return { error: 'Unauthorized' }
    }

    // Prevent self-deactivation
    if (session.user.id === id) {
        return { error: 'Cannot change your own account status' }
    }

    const user = await prisma.user.findUnique({
        where: { id },
        select: { isActive: true },
    })

    if (!user) {
        return { error: 'User not found' }
    }

    try {
        const newStatus = !user.isActive

        await prisma.user.update({
            where: { id },
            data: { isActive: newStatus },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'User',
            entityId: id,
            changes: { isActive: { old: user.isActive, new: newStatus } },
        })

        revalidatePath('/admin/users')
        revalidatePath(`/admin/users/${id}`)
        return { success: true, isActive: newStatus }
    } catch (error) {
        console.error('Error toggling user status:', error)
        return { error: 'Failed to update user status' }
    }
}

// Reset user password
export async function resetUserPassword(id: string, formData: FormData) {
    let session
    try {
        session = await requireAdmin()
    } catch {
        return { error: 'Unauthorized' }
    }

    const newPassword = formData.get('newPassword') as string

    if (!newPassword || newPassword.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id },
            data: { passwordHash: hashedPassword },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'User',
            entityId: id,
            changes: { password: { old: '[redacted]', new: '[reset]' } },
        })

        return { success: true }
    } catch (error) {
        console.error('Error resetting password:', error)
        return { error: 'Failed to reset password' }
    }
}

// Delete user (soft delete via isActive = false)
export async function deleteUser(id: string) {
    let session
    try {
        session = await requireAdmin()
    } catch {
        return { error: 'Unauthorized' }
    }

    // Prevent self-deletion
    if (session.user.id === id) {
        return { error: 'Cannot delete your own account' }
    }

    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
    })

    if (!user) {
        return { error: 'User not found' }
    }

    try {
        await prisma.user.update({
            where: { id },
            data: { isActive: false },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'DELETE',
            entityType: 'User',
            entityId: id,
        })

        revalidatePath('/admin/users')
        redirect('/admin/users')
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        console.error('Error deleting user:', error)
        return { error: 'Failed to delete user' }
    }
}

// Get investors not linked to any user (for LP user creation)
export async function getInvestorsForLinking(): Promise<{ id: string; name: string }[]> {
    const session = await auth()
    if (!session?.user) return []

    const investors = await prisma.investor.findMany({
        where: { userId: null, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })

    return investors
}
