'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NotificationType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export interface NotificationItem {
    id: string
    type: NotificationType
    title: string
    message: string
    link: string | null
    isRead: boolean
    createdAt: Date
}

// Get notifications for the current user
export async function getNotifications(limit = 20): Promise<NotificationItem[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            type: true,
            title: true,
            message: true,
            link: true,
            isRead: true,
            createdAt: true,
        },
    })

    return notifications
}

// Get unread count for the badge
export async function getUnreadCount(): Promise<number> {
    const session = await auth()
    if (!session?.user?.id) return 0

    return prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
    })
}

// Mark a single notification as read
export async function markAsRead(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    await prisma.notification.updateMany({
        where: { id, userId: session.user.id },
        data: { isRead: true },
    })

    revalidatePath('/', 'layout')
    return { success: true }
}

// Mark all notifications as read
export async function markAllAsRead() {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
    })

    revalidatePath('/', 'layout')
    return { success: true }
}

// Helper: Create a notification (used by other server actions)
export async function createNotification({
    userId,
    type,
    title,
    message,
    link,
}: {
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
}) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link: link || null,
            },
        })
    } catch (error) {
        // Notification creation is non-critical — log but don't throw
        console.error('Failed to create notification:', error)
    }
}

// Helper: Notify all members of a fund
export async function notifyFundMembers({
    fundId,
    type,
    title,
    message,
    link,
    excludeUserId,
}: {
    fundId: string
    type: NotificationType
    title: string
    message: string
    link?: string
    excludeUserId?: string
}) {
    try {
        const members = await prisma.fundMember.findMany({
            where: { fundId, isActive: true },
            select: { userId: true },
        })

        const userIds = members
            .map((m) => m.userId)
            .filter((id) => id !== excludeUserId)

        if (userIds.length === 0) return

        await prisma.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                type,
                title,
                message,
                link: link || null,
            })),
        })
    } catch (error) {
        console.error('Failed to notify fund members:', error)
    }
}
