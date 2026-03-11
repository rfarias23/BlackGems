import { DealStage } from '@prisma/client'

const STAGE_ALIASES: Record<string, DealStage> = {
  // CLOSED_LOST
  'dead': DealStage.CLOSED_LOST,
  'not interested': DealStage.CLOSED_LOST,
  'lost': DealStage.CLOSED_LOST,
  'no go': DealStage.CLOSED_LOST,

  // PASSED
  'passed': DealStage.PASSED,
  'pass': DealStage.PASSED,
  'skip': DealStage.PASSED,

  // LOI_NEGOTIATION
  'under loi': DealStage.LOI_NEGOTIATION,
  'loi signed': DealStage.LOI_NEGOTIATION,
  'loi': DealStage.LOI_NEGOTIATION,

  // IOI_SUBMITTED
  'ioi': DealStage.IOI_SUBMITTED,
  'ioi submitted': DealStage.IOI_SUBMITTED,
  'indication of interest': DealStage.IOI_SUBMITTED,

  // MANAGEMENT_MEETING
  'management meeting': DealStage.MANAGEMENT_MEETING,
  'met the team': DealStage.MANAGEMENT_MEETING,
  'met management': DealStage.MANAGEMENT_MEETING,

  // DUE_DILIGENCE
  'due diligence': DealStage.DUE_DILIGENCE,
  'in dd': DealStage.DUE_DILIGENCE,
  'dd': DealStage.DUE_DILIGENCE,
  'diligencing': DealStage.DUE_DILIGENCE,

  // CLOSED_WON
  'closed': DealStage.CLOSED_WON,
  'done': DealStage.CLOSED_WON,
  'acquired': DealStage.CLOSED_WON,
  'closed won': DealStage.CLOSED_WON,

  // INITIAL_REVIEW
  'initial contact': DealStage.INITIAL_REVIEW,
  'first call done': DealStage.INITIAL_REVIEW,
  'initial review': DealStage.INITIAL_REVIEW,

  // NDA_SIGNED
  'nda signed': DealStage.NDA_SIGNED,
  'under nda': DealStage.NDA_SIGNED,
  'nda': DealStage.NDA_SIGNED,

  // ON_HOLD
  'on hold': DealStage.ON_HOLD,
  'paused': DealStage.ON_HOLD,
  'hold': DealStage.ON_HOLD,

  // SITE_VISIT
  'site visit': DealStage.SITE_VISIT,
  'visited': DealStage.SITE_VISIT,

  // CLOSING
  'closing': DealStage.CLOSING,

  // FINAL_NEGOTIATION
  'final negotiation': DealStage.FINAL_NEGOTIATION,

  // IDENTIFIED
  'identified': DealStage.IDENTIFIED,
  'new': DealStage.IDENTIFIED,

  // LOI_PREPARATION
  'loi prep': DealStage.LOI_PREPARATION,
  'preparing loi': DealStage.LOI_PREPARATION,
}

export function resolveStageAlias(input: string): DealStage | null {
  const normalized = input.toLowerCase().trim()

  // Alias map takes precedence over raw enum matching
  if (normalized in STAGE_ALIASES) {
    return STAGE_ALIASES[normalized]
  }

  // Direct enum match (case-insensitive) for exact enum values not in alias map
  const upper = normalized.toUpperCase()
  if (Object.values(DealStage).includes(upper as DealStage)) {
    return upper as DealStage
  }

  return null
}
