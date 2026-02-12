import { describe, it, expect } from 'vitest'
import {
    VALID_CALL_TRANSITIONS,
    VALID_DIST_TRANSITIONS,
    canTransitionStatus,
    getAllowedNextStatuses,
    isTerminalStatus,
    getTerminalStatuses,
    getInitialStatuses,
} from '../workflow-transitions'

// ===========================================================================
// Capital Call Workflow
// ===========================================================================

describe('Capital Call Workflow', () => {
    describe('valid forward transitions', () => {
        it('allows DRAFT → APPROVED', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'DRAFT', 'APPROVED')).toBe(true)
        })

        it('allows DRAFT → CANCELLED', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'DRAFT', 'CANCELLED')).toBe(true)
        })

        it('allows APPROVED → SENT', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'APPROVED', 'SENT')).toBe(true)
        })

        it('allows APPROVED → CANCELLED', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'APPROVED', 'CANCELLED')).toBe(true)
        })

        it('allows SENT → PARTIALLY_FUNDED', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'SENT', 'PARTIALLY_FUNDED')).toBe(true)
        })

        it('allows SENT → FULLY_FUNDED', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'SENT', 'FULLY_FUNDED')).toBe(true)
        })

        it('allows PARTIALLY_FUNDED → FULLY_FUNDED', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'PARTIALLY_FUNDED', 'FULLY_FUNDED')).toBe(true)
        })
    })

    describe('invalid transitions', () => {
        it('does not allow skipping APPROVED → FULLY_FUNDED', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'APPROVED', 'FULLY_FUNDED')).toBe(false)
        })

        it('does not allow DRAFT → SENT (must approve first)', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'DRAFT', 'SENT')).toBe(false)
        })

        it('does not allow backward SENT → DRAFT', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'SENT', 'DRAFT')).toBe(false)
        })

        it('does not allow backward FULLY_FUNDED → SENT', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'FULLY_FUNDED', 'SENT')).toBe(false)
        })

        it('does not allow PARTIALLY_FUNDED → CANCELLED (too late)', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'PARTIALLY_FUNDED', 'CANCELLED')).toBe(false)
        })

        it('does not allow SENT → CANCELLED (already sent)', () => {
            expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'SENT', 'CANCELLED')).toBe(false)
        })
    })

    describe('terminal states', () => {
        it('FULLY_FUNDED is terminal', () => {
            expect(isTerminalStatus(VALID_CALL_TRANSITIONS, 'FULLY_FUNDED')).toBe(true)
        })

        it('CANCELLED is terminal', () => {
            expect(isTerminalStatus(VALID_CALL_TRANSITIONS, 'CANCELLED')).toBe(true)
        })

        it('DRAFT is not terminal', () => {
            expect(isTerminalStatus(VALID_CALL_TRANSITIONS, 'DRAFT')).toBe(false)
        })

        it('SENT is not terminal', () => {
            expect(isTerminalStatus(VALID_CALL_TRANSITIONS, 'SENT')).toBe(false)
        })

        it('returns correct terminal statuses', () => {
            const terminals = getTerminalStatuses(VALID_CALL_TRANSITIONS)
            expect(terminals).toContain('FULLY_FUNDED')
            expect(terminals).toContain('CANCELLED')
            expect(terminals).toHaveLength(2)
        })
    })

    describe('initial states', () => {
        it('DRAFT is the only initial status', () => {
            const initials = getInitialStatuses(VALID_CALL_TRANSITIONS)
            expect(initials).toEqual(['DRAFT'])
        })
    })

    describe('getAllowedNextStatuses', () => {
        it('DRAFT can go to APPROVED or CANCELLED', () => {
            const allowed = getAllowedNextStatuses(VALID_CALL_TRANSITIONS, 'DRAFT')
            expect(allowed).toEqual(['APPROVED', 'CANCELLED'])
        })

        it('FULLY_FUNDED has no next statuses', () => {
            const allowed = getAllowedNextStatuses(VALID_CALL_TRANSITIONS, 'FULLY_FUNDED')
            expect(allowed).toEqual([])
        })

        it('unknown status returns empty array', () => {
            const allowed = getAllowedNextStatuses(VALID_CALL_TRANSITIONS, 'NONEXISTENT')
            expect(allowed).toEqual([])
        })
    })

    describe('workflow completeness', () => {
        it('has all 6 expected statuses', () => {
            const statuses = Object.keys(VALID_CALL_TRANSITIONS)
            expect(statuses).toHaveLength(6)
            expect(statuses).toEqual([
                'DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_FUNDED', 'FULLY_FUNDED', 'CANCELLED',
            ])
        })

        it('every target status exists as a key', () => {
            for (const [, targets] of Object.entries(VALID_CALL_TRANSITIONS)) {
                for (const target of targets) {
                    expect(VALID_CALL_TRANSITIONS).toHaveProperty(target)
                }
            }
        })

        it('no status allows transition to itself', () => {
            for (const [status, targets] of Object.entries(VALID_CALL_TRANSITIONS)) {
                expect(targets).not.toContain(status)
            }
        })
    })
})

// ===========================================================================
// Distribution Workflow
// ===========================================================================

describe('Distribution Workflow', () => {
    describe('valid forward transitions', () => {
        it('allows DRAFT → APPROVED', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'DRAFT', 'APPROVED')).toBe(true)
        })

        it('allows DRAFT → CANCELLED', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'DRAFT', 'CANCELLED')).toBe(true)
        })

        it('allows APPROVED → PROCESSING', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'APPROVED', 'PROCESSING')).toBe(true)
        })

        it('allows APPROVED → CANCELLED', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'APPROVED', 'CANCELLED')).toBe(true)
        })

        it('allows PROCESSING → COMPLETED', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'PROCESSING', 'COMPLETED')).toBe(true)
        })
    })

    describe('invalid transitions', () => {
        it('does not allow DRAFT → PROCESSING (must approve first)', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'DRAFT', 'PROCESSING')).toBe(false)
        })

        it('does not allow DRAFT → COMPLETED (must go through all stages)', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'DRAFT', 'COMPLETED')).toBe(false)
        })

        it('does not allow backward PROCESSING → APPROVED', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'PROCESSING', 'APPROVED')).toBe(false)
        })

        it('does not allow PROCESSING → CANCELLED (too late)', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'PROCESSING', 'CANCELLED')).toBe(false)
        })

        it('does not allow COMPLETED → anything', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'COMPLETED', 'DRAFT')).toBe(false)
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'COMPLETED', 'PROCESSING')).toBe(false)
        })

        it('does not allow CANCELLED → anything', () => {
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'CANCELLED', 'DRAFT')).toBe(false)
            expect(canTransitionStatus(VALID_DIST_TRANSITIONS, 'CANCELLED', 'APPROVED')).toBe(false)
        })
    })

    describe('terminal states', () => {
        it('COMPLETED is terminal', () => {
            expect(isTerminalStatus(VALID_DIST_TRANSITIONS, 'COMPLETED')).toBe(true)
        })

        it('CANCELLED is terminal', () => {
            expect(isTerminalStatus(VALID_DIST_TRANSITIONS, 'CANCELLED')).toBe(true)
        })

        it('returns correct terminal statuses', () => {
            const terminals = getTerminalStatuses(VALID_DIST_TRANSITIONS)
            expect(terminals).toContain('COMPLETED')
            expect(terminals).toContain('CANCELLED')
            expect(terminals).toHaveLength(2)
        })
    })

    describe('initial states', () => {
        it('DRAFT is the only initial status', () => {
            const initials = getInitialStatuses(VALID_DIST_TRANSITIONS)
            expect(initials).toEqual(['DRAFT'])
        })
    })

    describe('workflow completeness', () => {
        it('has all 5 expected statuses', () => {
            const statuses = Object.keys(VALID_DIST_TRANSITIONS)
            expect(statuses).toHaveLength(5)
            expect(statuses).toEqual([
                'DRAFT', 'APPROVED', 'PROCESSING', 'COMPLETED', 'CANCELLED',
            ])
        })

        it('every target status exists as a key', () => {
            for (const [, targets] of Object.entries(VALID_DIST_TRANSITIONS)) {
                for (const target of targets) {
                    expect(VALID_DIST_TRANSITIONS).toHaveProperty(target)
                }
            }
        })

        it('no status allows transition to itself', () => {
            for (const [status, targets] of Object.entries(VALID_DIST_TRANSITIONS)) {
                expect(targets).not.toContain(status)
            }
        })
    })
})

// ===========================================================================
// Generic Helper Functions
// ===========================================================================

describe('canTransitionStatus', () => {
    it('returns false for unknown source status', () => {
        expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'UNKNOWN', 'APPROVED')).toBe(false)
    })

    it('returns false for unknown target status', () => {
        expect(canTransitionStatus(VALID_CALL_TRANSITIONS, 'DRAFT', 'UNKNOWN')).toBe(false)
    })
})

describe('isTerminalStatus', () => {
    it('returns false for unknown status', () => {
        expect(isTerminalStatus(VALID_CALL_TRANSITIONS, 'UNKNOWN')).toBe(false)
    })
})
