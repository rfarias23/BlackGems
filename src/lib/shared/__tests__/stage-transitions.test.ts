import { describe, it, expect } from 'vitest'
import { canTransitionDealStage, getAllowedTransitions } from '../stage-transitions'

// We mock the DealStage enum since it comes from @prisma/client
// In tests, we use string values that match the enum
const DealStage = {
  IDENTIFIED: 'IDENTIFIED',
  INITIAL_REVIEW: 'INITIAL_REVIEW',
  PRELIMINARY_ANALYSIS: 'PRELIMINARY_ANALYSIS',
  MANAGEMENT_MEETING: 'MANAGEMENT_MEETING',
  NDA_SIGNED: 'NDA_SIGNED',
  NDA_CIM: 'NDA_CIM',
  IOI_SUBMITTED: 'IOI_SUBMITTED',
  SITE_VISIT: 'SITE_VISIT',
  LOI_PREPARATION: 'LOI_PREPARATION',
  LOI_NEGOTIATION: 'LOI_NEGOTIATION',
  DUE_DILIGENCE: 'DUE_DILIGENCE',
  FINAL_NEGOTIATION: 'FINAL_NEGOTIATION',
  CLOSING: 'CLOSING',
  CLOSED: 'CLOSED',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST',
  PASSED: 'PASSED',
  ON_HOLD: 'ON_HOLD',
} as const

describe('canTransitionDealStage', () => {
  describe('valid forward transitions', () => {
    it('allows IDENTIFIED -> INITIAL_REVIEW', () => {
      expect(canTransitionDealStage(DealStage.IDENTIFIED as any, DealStage.INITIAL_REVIEW as any)).toBe(true)
    })

    it('allows INITIAL_REVIEW -> PRELIMINARY_ANALYSIS', () => {
      expect(canTransitionDealStage(DealStage.INITIAL_REVIEW as any, DealStage.PRELIMINARY_ANALYSIS as any)).toBe(true)
    })

    it('allows LOI_NEGOTIATION -> DUE_DILIGENCE', () => {
      expect(canTransitionDealStage(DealStage.LOI_NEGOTIATION as any, DealStage.DUE_DILIGENCE as any)).toBe(true)
    })

    it('allows CLOSING -> CLOSED_WON', () => {
      expect(canTransitionDealStage(DealStage.CLOSING as any, DealStage.CLOSED_WON as any)).toBe(true)
    })
  })

  describe('PASSED transitions', () => {
    it('allows any active stage to transition to PASSED', () => {
      const activeStages = [
        DealStage.IDENTIFIED,
        DealStage.INITIAL_REVIEW,
        DealStage.PRELIMINARY_ANALYSIS,
        DealStage.NDA_CIM,
        DealStage.DUE_DILIGENCE,
        DealStage.CLOSING,
      ]
      for (const stage of activeStages) {
        expect(canTransitionDealStage(stage as any, DealStage.PASSED as any)).toBe(true)
      }
    })

    it('does not allow PASSED to transition anywhere', () => {
      expect(canTransitionDealStage(DealStage.PASSED as any, DealStage.INITIAL_REVIEW as any)).toBe(false)
      expect(canTransitionDealStage(DealStage.PASSED as any, DealStage.IDENTIFIED as any)).toBe(false)
    })
  })

  describe('terminal states', () => {
    it('CLOSED has no allowed transitions', () => {
      expect(canTransitionDealStage(DealStage.CLOSED as any, DealStage.INITIAL_REVIEW as any)).toBe(false)
      expect(canTransitionDealStage(DealStage.CLOSED as any, DealStage.ON_HOLD as any)).toBe(false)
    })

    it('CLOSED_WON has no allowed transitions', () => {
      expect(canTransitionDealStage(DealStage.CLOSED_WON as any, DealStage.CLOSING as any)).toBe(false)
    })
  })

  describe('invalid transitions', () => {
    it('does not allow skipping stages', () => {
      expect(canTransitionDealStage(DealStage.INITIAL_REVIEW as any, DealStage.CLOSING as any)).toBe(false)
    })

    it('does not allow IDENTIFIED -> DUE_DILIGENCE', () => {
      expect(canTransitionDealStage(DealStage.IDENTIFIED as any, DealStage.DUE_DILIGENCE as any)).toBe(false)
    })

    it('does not allow backward transitions', () => {
      expect(canTransitionDealStage(DealStage.DUE_DILIGENCE as any, DealStage.INITIAL_REVIEW as any)).toBe(false)
    })
  })

  describe('ON_HOLD behavior', () => {
    it('allows active stages to move to ON_HOLD', () => {
      expect(canTransitionDealStage(DealStage.INITIAL_REVIEW as any, DealStage.ON_HOLD as any)).toBe(true)
      expect(canTransitionDealStage(DealStage.DUE_DILIGENCE as any, DealStage.ON_HOLD as any)).toBe(true)
    })

    it('does not allow terminal stages to move to ON_HOLD', () => {
      expect(canTransitionDealStage(DealStage.CLOSED as any, DealStage.ON_HOLD as any)).toBe(false)
      expect(canTransitionDealStage(DealStage.PASSED as any, DealStage.ON_HOLD as any)).toBe(false)
    })

    it('allows ON_HOLD to return to non-terminal stages', () => {
      expect(canTransitionDealStage(DealStage.ON_HOLD as any, DealStage.INITIAL_REVIEW as any)).toBe(true)
      expect(canTransitionDealStage(DealStage.ON_HOLD as any, DealStage.DUE_DILIGENCE as any)).toBe(true)
    })

    it('does not allow ON_HOLD to move to terminal stages', () => {
      expect(canTransitionDealStage(DealStage.ON_HOLD as any, DealStage.CLOSED as any)).toBe(false)
      expect(canTransitionDealStage(DealStage.ON_HOLD as any, DealStage.PASSED as any)).toBe(false)
    })
  })
})

describe('getAllowedTransitions', () => {
  it('returns valid next stages for INITIAL_REVIEW', () => {
    const allowed = getAllowedTransitions(DealStage.INITIAL_REVIEW as any)
    expect(allowed).toContain(DealStage.PRELIMINARY_ANALYSIS)
    expect(allowed).toContain(DealStage.PASSED)
    expect(allowed).toContain(DealStage.ON_HOLD)
  })

  it('returns empty array for terminal stages', () => {
    expect(getAllowedTransitions(DealStage.CLOSED as any)).toEqual([])
    expect(getAllowedTransitions(DealStage.PASSED as any)).toEqual([])
  })

  it('ON_HOLD returns all non-terminal stages', () => {
    const allowed = getAllowedTransitions(DealStage.ON_HOLD as any)
    expect(allowed).toContain(DealStage.INITIAL_REVIEW)
    expect(allowed).toContain(DealStage.DUE_DILIGENCE)
    expect(allowed).not.toContain(DealStage.CLOSED)
    expect(allowed).not.toContain(DealStage.PASSED)
    expect(allowed).not.toContain(DealStage.ON_HOLD)
  })
})
