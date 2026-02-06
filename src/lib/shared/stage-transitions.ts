import { DealStage } from '@prisma/client'

/**
 * Defines allowed deal stage transitions per the Business Rules (08_Business_Rules.md).
 * Deals follow a linear pipeline; they can also be PASSED from any active stage.
 */
const DEAL_STAGE_TRANSITIONS: Record<DealStage, DealStage[]> = {
  IDENTIFIED: [DealStage.INITIAL_REVIEW, DealStage.PASSED],
  INITIAL_REVIEW: [DealStage.PRELIMINARY_ANALYSIS, DealStage.PASSED],
  PRELIMINARY_ANALYSIS: [DealStage.MANAGEMENT_MEETING, DealStage.PASSED],
  MANAGEMENT_MEETING: [DealStage.NDA_CIM, DealStage.NDA_SIGNED, DealStage.PASSED],
  NDA_SIGNED: [DealStage.NDA_CIM, DealStage.PASSED],
  NDA_CIM: [DealStage.SITE_VISIT, DealStage.IOI_SUBMITTED, DealStage.LOI_PREPARATION, DealStage.PASSED],
  IOI_SUBMITTED: [DealStage.SITE_VISIT, DealStage.LOI_PREPARATION, DealStage.PASSED],
  SITE_VISIT: [DealStage.LOI_PREPARATION, DealStage.PASSED],
  LOI_PREPARATION: [DealStage.LOI_NEGOTIATION, DealStage.PASSED],
  LOI_NEGOTIATION: [DealStage.DUE_DILIGENCE, DealStage.PASSED],
  DUE_DILIGENCE: [DealStage.FINAL_NEGOTIATION, DealStage.PASSED],
  FINAL_NEGOTIATION: [DealStage.CLOSING, DealStage.PASSED],
  CLOSING: [DealStage.CLOSED, DealStage.CLOSED_WON, DealStage.PASSED],
  CLOSED: [],
  CLOSED_WON: [],
  CLOSED_LOST: [],
  PASSED: [],
  ON_HOLD: [], // ON_HOLD can resume to any stage — handled separately
}

/**
 * Validates whether a deal stage transition is allowed.
 * ON_HOLD is special: any active stage can go to ON_HOLD,
 * and ON_HOLD can return to any active stage.
 */
export function canTransitionDealStage(
  current: DealStage,
  target: DealStage
): boolean {
  // Any active stage can go to ON_HOLD
  if (target === DealStage.ON_HOLD) {
    const terminalStages: DealStage[] = [
      DealStage.CLOSED,
      DealStage.CLOSED_WON,
      DealStage.CLOSED_LOST,
      DealStage.PASSED,
    ]
    return !terminalStages.includes(current)
  }

  // ON_HOLD can return to any non-terminal stage
  if (current === DealStage.ON_HOLD) {
    const terminalStages: DealStage[] = [
      DealStage.CLOSED,
      DealStage.CLOSED_WON,
      DealStage.CLOSED_LOST,
      DealStage.PASSED,
    ]
    return !terminalStages.includes(target)
  }

  return DEAL_STAGE_TRANSITIONS[current]?.includes(target) ?? false
}

/**
 * Returns the list of stages a deal can transition to from its current stage.
 */
export function getAllowedTransitions(current: DealStage): DealStage[] {
  const allowed = [...(DEAL_STAGE_TRANSITIONS[current] ?? [])]

  // Any non-terminal stage can go to ON_HOLD
  const terminalStages: DealStage[] = [
    DealStage.CLOSED,
    DealStage.CLOSED_WON,
    DealStage.CLOSED_LOST,
    DealStage.PASSED,
  ]
  if (!terminalStages.includes(current) && current !== DealStage.ON_HOLD) {
    allowed.push(DealStage.ON_HOLD)
  }

  // ON_HOLD can return to any non-terminal stage
  if (current === DealStage.ON_HOLD) {
    return Object.values(DealStage).filter(
      (s) => !terminalStages.includes(s) && s !== DealStage.ON_HOLD
    )
  }

  return allowed
}
