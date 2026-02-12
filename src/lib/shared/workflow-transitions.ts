/**
 * Workflow state machine definitions for capital calls and distributions.
 *
 * Each map defines the adjacency list: status → allowed next statuses.
 * Terminal states map to empty arrays.
 */

// ---------------------------------------------------------------------------
// Capital Call Status Workflow
// ---------------------------------------------------------------------------

export const VALID_CALL_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['APPROVED', 'CANCELLED'],
    APPROVED: ['SENT', 'CANCELLED'],
    SENT: ['PARTIALLY_FUNDED', 'FULLY_FUNDED'],
    PARTIALLY_FUNDED: ['FULLY_FUNDED'],
    FULLY_FUNDED: [],
    CANCELLED: [],
}

// ---------------------------------------------------------------------------
// Distribution Status Workflow
// ---------------------------------------------------------------------------

export const VALID_DIST_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['APPROVED', 'CANCELLED'],
    APPROVED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
}

// ---------------------------------------------------------------------------
// Transition helpers
// ---------------------------------------------------------------------------

/**
 * Check if a status transition is valid for a given workflow.
 */
export function canTransitionStatus(
    transitions: Record<string, string[]>,
    from: string,
    to: string
): boolean {
    const allowed = transitions[from]
    if (!allowed) return false
    return allowed.includes(to)
}

/**
 * Get all allowed next statuses for a given current status.
 */
export function getAllowedNextStatuses(
    transitions: Record<string, string[]>,
    current: string
): string[] {
    return transitions[current] || []
}

/**
 * Check if a status is a terminal state (no further transitions allowed).
 */
export function isTerminalStatus(
    transitions: Record<string, string[]>,
    status: string
): boolean {
    const allowed = transitions[status]
    return allowed !== undefined && allowed.length === 0
}

/**
 * Get all terminal statuses for a workflow.
 */
export function getTerminalStatuses(
    transitions: Record<string, string[]>
): string[] {
    return Object.entries(transitions)
        .filter(([, allowed]) => allowed.length === 0)
        .map(([status]) => status)
}

/**
 * Get all initial statuses (statuses that are NOT reachable from any other status).
 */
export function getInitialStatuses(
    transitions: Record<string, string[]>
): string[] {
    const reachable = new Set<string>()
    for (const targets of Object.values(transitions)) {
        for (const target of targets) {
            reachable.add(target)
        }
    }
    return Object.keys(transitions).filter(status => !reachable.has(status))
}
