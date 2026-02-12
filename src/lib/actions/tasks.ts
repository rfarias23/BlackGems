'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@prisma/client'
import { logAudit, computeChanges } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { notDeleted } from '@/lib/shared/soft-delete'

// ============================================================================
// TYPES
// ============================================================================

export interface TaskItem {
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    dueDate: Date | null
    completedAt: Date | null
    assignee: { id: string; name: string | null; email: string | null }
    createdBy: { id: string; name: string | null }
    createdAt: Date
}

// ============================================================================
// VALIDATION
// ============================================================================

const createTaskSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority),
    assigneeId: z.string().min(1, 'Assignee is required'),
    dueDate: z.string().optional(),
})

const validStatuses = Object.values(TaskStatus)

// ============================================================================
// GET DEAL TASKS
// ============================================================================

export async function getDealTasks(dealId: string): Promise<TaskItem[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    // Verify the deal exists and get fund ID for access check
    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { fundId: true },
    })
    if (!deal) {
        return []
    }

    try {
        await requireFundAccess(session.user.id, deal.fundId)
    } catch {
        return []
    }

    const tasks = await prisma.task.findMany({
        where: { dealId },
        orderBy: [{ status: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }],
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
            createdAt: true,
            assignee: {
                select: { id: true, name: true, email: true },
            },
            createdBy: {
                select: { id: true, name: true },
            },
        },
    })

    return tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        assignee: task.assignee,
        createdBy: task.createdBy,
        createdAt: task.createdAt,
    }))
}

// ============================================================================
// CREATE DEAL TASK
// ============================================================================

export async function createDealTask(
    dealId: string,
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    // Verify the deal exists and get fund ID
    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { fundId: true },
    })
    if (!deal) {
        return { error: 'Deal not found' }
    }

    try {
        await requireFundAccess(session.user.id, deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    const rawData = {
        title: (formData.get('title') as string)?.trim(),
        description: (formData.get('description') as string)?.trim() || undefined,
        priority: formData.get('priority') as string,
        assigneeId: formData.get('assigneeId') as string,
        dueDate: (formData.get('dueDate') as string) || undefined,
    }

    const validated = createTaskSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const data = validated.data

    try {
        const task = await prisma.task.create({
            data: {
                dealId,
                title: data.title,
                description: data.description || null,
                priority: data.priority,
                assigneeId: data.assigneeId,
                createdById: session.user.id,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
            },
        })

        await logAudit({
            userId: session.user.id,
            action: 'CREATE',
            entityType: 'Task',
            entityId: task.id,
        })

        revalidatePath(`/deals/${dealId}`)
        return { success: true }
    } catch (error) {
        console.error('Error creating task:', error)
        return { error: 'Failed to create task' }
    }
}

// ============================================================================
// UPDATE TASK STATUS
// ============================================================================

export async function updateTaskStatus(
    taskId: string,
    status: string
): Promise<{ success?: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    // Validate status
    if (!validStatuses.includes(status as TaskStatus)) {
        return { error: 'Invalid status' }
    }

    // Load task with deal info for fund access check
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
            id: true,
            status: true,
            completedAt: true,
            deal: { select: { id: true, fundId: true } },
        },
    })
    if (!task) {
        return { error: 'Task not found' }
    }

    // Fund access check via the deal
    if (task.deal) {
        try {
            await requireFundAccess(session.user.id, task.deal.fundId)
        } catch {
            return { error: 'Access denied' }
        }
    }

    const oldStatus = task.status
    const newStatus = status as TaskStatus

    // Set completedAt when marking as COMPLETED, clear it otherwise
    const completedAt = newStatus === 'COMPLETED' ? new Date() : null

    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { status: newStatus, completedAt },
        })

        const changes = computeChanges(
            { status: oldStatus, completedAt: task.completedAt },
            { status: newStatus, completedAt }
        )

        await logAudit({
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'Task',
            entityId: taskId,
            changes,
        })

        if (task.deal) {
            revalidatePath(`/deals/${task.deal.id}`)
        }
        return { success: true }
    } catch (error) {
        console.error('Error updating task status:', error)
        return { error: 'Failed to update task status' }
    }
}

// ============================================================================
// DELETE TASK
// ============================================================================

export async function deleteTask(
    taskId: string
): Promise<{ success?: boolean; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: 'Unauthorized' }
    }

    // Load task with deal info for fund access check
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
            id: true,
            deal: { select: { id: true, fundId: true } },
        },
    })
    if (!task) {
        return { error: 'Task not found' }
    }

    // Fund access check via the deal
    if (task.deal) {
        try {
            await requireFundAccess(session.user.id, task.deal.fundId)
        } catch {
            return { error: 'Access denied' }
        }
    }

    try {
        await prisma.task.delete({ where: { id: taskId } })

        await logAudit({
            userId: session.user.id,
            action: 'DELETE',
            entityType: 'Task',
            entityId: taskId,
        })

        if (task.deal) {
            revalidatePath(`/deals/${task.deal.id}`)
        }
        return { success: true }
    } catch (error) {
        console.error('Error deleting task:', error)
        return { error: 'Failed to delete task' }
    }
}

// ============================================================================
// GET FUND MEMBERS (for assignee dropdown)
// ============================================================================

export async function getFundMembers(
    dealId: string
): Promise<{ id: string; name: string | null }[]> {
    const session = await auth()
    if (!session?.user?.id) {
        return []
    }

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { fundId: true },
    })
    if (!deal) {
        return []
    }

    try {
        await requireFundAccess(session.user.id, deal.fundId)
    } catch {
        return []
    }

    const members = await prisma.fundMember.findMany({
        where: { fundId: deal.fundId, isActive: true },
        select: {
            user: { select: { id: true, name: true } },
        },
    })

    return members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
    }))
}
