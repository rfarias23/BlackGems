'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { DDCategory, DDStatus } from '@prisma/client'
import { notDeleted } from '@/lib/shared/soft-delete'
import { logAudit } from '@/lib/shared/audit'
import { requireFundAccess } from '@/lib/shared/fund-access'

// ============================================================================
// CONSTANTS
// ============================================================================

const DD_MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']

export const DD_CATEGORY_LABELS: Record<DDCategory, string> = {
    FINANCIAL: 'Financial',
    ACCOUNTING: 'Accounting',
    TAX: 'Tax',
    LEGAL: 'Legal',
    COMMERCIAL: 'Commercial',
    OPERATIONAL: 'Operational',
    HR: 'Human Resources',
    IT: 'Information Technology',
    ENVIRONMENTAL: 'Environmental',
    INSURANCE: 'Insurance',
    REAL_ESTATE: 'Real Estate',
    IP: 'Intellectual Property',
    REGULATORY: 'Regulatory',
    QUALITY: 'Quality',
    OTHER: 'Other',
}

export const DD_STATUS_LABELS: Record<DDStatus, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    PENDING_INFO: 'Pending Info',
    UNDER_REVIEW: 'Under Review',
    COMPLETED: 'Completed',
    NA: 'N/A',
}

const PRIORITY_LABELS: Record<number, string> = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Optional',
}

// ============================================================================
// TYPES
// ============================================================================

export interface DDItemData {
    id: string
    category: string
    item: string
    status: string
    priority: number
    assignedTo: string | null
    notes: string | null
    findings: string | null
    redFlag: boolean
    createdAt: Date
    updatedAt: Date
}

export interface DDCategoryStats {
    category: string
    total: number
    completed: number
    redFlags: number
}

export interface DDStats {
    totalItems: number
    completedItems: number
    redFlagCount: number
    overallProgress: number
    byCategory: DDCategoryStats[]
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/** Fetch all due diligence items for a deal */
export async function getDealDueDiligence(dealId: string): Promise<DDItemData[]> {
    const session = await auth()
    if (!session?.user) return []

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { fundId: true },
    })
    if (!deal) return []

    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return []
    }

    const items = await prisma.dueDiligenceItem.findMany({
        where: { dealId },
        orderBy: [{ category: 'asc' }, { priority: 'asc' }, { createdAt: 'asc' }],
    })

    return items.map((item) => ({
        id: item.id,
        category: item.category,
        item: item.item,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo,
        notes: item.notes,
        findings: item.findings,
        redFlag: item.redFlag,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }))
}

/** Get aggregated stats for DD progress */
export async function getDDStats(dealId: string): Promise<DDStats | null> {
    const session = await auth()
    if (!session?.user) return null

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { fundId: true },
    })
    if (!deal) return null

    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return null
    }

    const items = await prisma.dueDiligenceItem.findMany({
        where: { dealId },
        select: { category: true, status: true, redFlag: true },
    })

    if (items.length === 0) {
        return {
            totalItems: 0,
            completedItems: 0,
            redFlagCount: 0,
            overallProgress: 0,
            byCategory: [],
        }
    }

    // Group by category
    const categoryMap = new Map<string, { total: number; completed: number; redFlags: number }>()

    for (const item of items) {
        const cat = item.category
        if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { total: 0, completed: 0, redFlags: 0 })
        }
        const stats = categoryMap.get(cat)!
        stats.total++
        if (item.status === 'COMPLETED' || item.status === 'NA') {
            stats.completed++
        }
        if (item.redFlag) {
            stats.redFlags++
        }
    }

    const totalItems = items.length
    const completedItems = items.filter((i) => i.status === 'COMPLETED' || i.status === 'NA').length
    const redFlagCount = items.filter((i) => i.redFlag).length
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    const byCategory: DDCategoryStats[] = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({
            category,
            total: stats.total,
            completed: stats.completed,
            redFlags: stats.redFlags,
        }))
        .sort((a, b) => a.category.localeCompare(b.category))

    return { totalItems, completedItems, redFlagCount, overallProgress, byCategory }
}

// ============================================================================
// CREATE
// ============================================================================

/** Create a new due diligence item */
export async function createDDItem(dealId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
    if (!DD_MANAGE_ROLES.includes(userRole)) {
        return { error: 'Insufficient permissions' }
    }

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { fundId: true },
    })
    if (!deal) {
        return { error: 'Deal not found' }
    }

    try {
        await requireFundAccess(session.user.id!, deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    const category = formData.get('category') as string
    const item = (formData.get('item') as string)?.trim()
    const priorityStr = formData.get('priority') as string
    const status = (formData.get('status') as string) || 'NOT_STARTED'
    const notes = (formData.get('notes') as string)?.trim() || null
    const assignedTo = (formData.get('assignedTo') as string)?.trim() || null

    if (!category || !Object.values(DDCategory).includes(category as DDCategory)) {
        return { error: 'Valid category is required' }
    }
    if (!item || item.length < 2) {
        return { error: 'Item description must be at least 2 characters' }
    }
    if (!Object.values(DDStatus).includes(status as DDStatus)) {
        return { error: 'Invalid status' }
    }

    const priority = parseInt(priorityStr || '3', 10)
    if (priority < 1 || priority > 5) {
        return { error: 'Priority must be between 1 and 5' }
    }

    try {
        const ddItem = await prisma.dueDiligenceItem.create({
            data: {
                dealId,
                category: category as DDCategory,
                item,
                status: status as DDStatus,
                priority,
                assignedTo,
                notes,
            },
        })

        await logAudit({
            userId: session.user.id!,
            action: 'CREATE',
            entityType: 'DueDiligenceItem',
            entityId: ddItem.id,
        })

        revalidatePath(`/deals/${dealId}`)
        return { success: true }
    } catch (error) {
        console.error('Error creating DD item:', error)
        return { error: 'Failed to create due diligence item' }
    }
}

// ============================================================================
// UPDATE
// ============================================================================

/** Update an existing due diligence item */
export async function updateDDItem(itemId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
    if (!DD_MANAGE_ROLES.includes(userRole)) {
        return { error: 'Insufficient permissions' }
    }

    const existing = await prisma.dueDiligenceItem.findUnique({
        where: { id: itemId },
        include: { deal: { select: { fundId: true, id: true } } },
    })
    if (!existing) {
        return { error: 'Item not found' }
    }

    try {
        await requireFundAccess(session.user.id!, existing.deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    // Build changes object for audit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    const status = formData.get('status') as string | null
    if (status && status !== existing.status) {
        if (!Object.values(DDStatus).includes(status as DDStatus)) {
            return { error: 'Invalid status' }
        }
        updateData.status = status as DDStatus
        changes.status = { old: existing.status, new: status }
    }

    const item = formData.get('item') as string | null
    if (item !== null && item.trim() !== existing.item) {
        if (item.trim().length < 2) {
            return { error: 'Item description must be at least 2 characters' }
        }
        updateData.item = item.trim()
        changes.item = { old: existing.item, new: item.trim() }
    }

    const priorityStr = formData.get('priority') as string | null
    if (priorityStr !== null) {
        const priority = parseInt(priorityStr, 10)
        if (priority >= 1 && priority <= 5 && priority !== existing.priority) {
            updateData.priority = priority
            changes.priority = { old: existing.priority, new: priority }
        }
    }

    const assignedTo = formData.get('assignedTo') as string | null
    if (assignedTo !== undefined && assignedTo !== existing.assignedTo) {
        updateData.assignedTo = assignedTo?.trim() || null
        changes.assignedTo = { old: existing.assignedTo, new: assignedTo?.trim() || null }
    }

    const notes = formData.get('notes') as string | null
    if (notes !== null && notes.trim() !== (existing.notes || '')) {
        updateData.notes = notes.trim() || null
        changes.notes = { old: existing.notes, new: notes.trim() || null }
    }

    const findings = formData.get('findings') as string | null
    if (findings !== null && findings.trim() !== (existing.findings || '')) {
        updateData.findings = findings.trim() || null
        changes.findings = { old: existing.findings, new: findings.trim() || null }
    }

    const redFlagStr = formData.get('redFlag') as string | null
    if (redFlagStr !== null) {
        const redFlag = redFlagStr === 'true'
        if (redFlag !== existing.redFlag) {
            updateData.redFlag = redFlag
            changes.redFlag = { old: existing.redFlag, new: redFlag }
        }
    }

    if (Object.keys(updateData).length === 0) {
        return { success: true } // No changes
    }

    try {
        await prisma.dueDiligenceItem.update({
            where: { id: itemId },
            data: updateData,
        })

        await logAudit({
            userId: session.user.id!,
            action: 'UPDATE',
            entityType: 'DueDiligenceItem',
            entityId: itemId,
            changes,
        })

        revalidatePath(`/deals/${existing.deal.id}`)
        return { success: true }
    } catch (error) {
        console.error('Error updating DD item:', error)
        return { error: 'Failed to update due diligence item' }
    }
}

// ============================================================================
// DELETE
// ============================================================================

/** Delete a due diligence item */
export async function deleteDDItem(itemId: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: 'Unauthorized' }
    }

    const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
    if (!DD_MANAGE_ROLES.includes(userRole)) {
        return { error: 'Insufficient permissions' }
    }

    const item = await prisma.dueDiligenceItem.findUnique({
        where: { id: itemId },
        include: { deal: { select: { fundId: true, id: true } } },
    })
    if (!item) {
        return { error: 'Item not found' }
    }

    try {
        await requireFundAccess(session.user.id!, item.deal.fundId)
    } catch {
        return { error: 'Access denied' }
    }

    try {
        await prisma.dueDiligenceItem.delete({ where: { id: itemId } })

        await logAudit({
            userId: session.user.id!,
            action: 'DELETE',
            entityType: 'DueDiligenceItem',
            entityId: itemId,
        })

        revalidatePath(`/deals/${item.deal.id}`)
        return { success: true }
    } catch (error) {
        console.error('Error deleting DD item:', error)
        return { error: 'Failed to delete due diligence item' }
    }
}

// Re-export labels for use in client components
export { PRIORITY_LABELS }
