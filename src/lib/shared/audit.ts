import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

interface AuditLogParams {
  userId: string
  action: AuditAction
  entityType: string
  entityId: string
  changes?: Record<string, { old: unknown; new: unknown }>
}

/**
 * Creates an audit log entry for any mutation.
 * Should be called after every CREATE, UPDATE, or DELETE operation.
 */
export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  changes,
}: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
      },
    })
  } catch (error) {
    // Audit logging should never block the primary operation
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Computes a diff of changed fields between old and new objects.
 * Only includes fields that actually changed.
 */
export function computeChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> | undefined {
  const changes: Record<string, { old: unknown; new: unknown }> = {}

  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key]
    const newVal = newData[key]
    if (oldVal !== newVal) {
      changes[key] = { old: oldVal, new: newVal }
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined
}
