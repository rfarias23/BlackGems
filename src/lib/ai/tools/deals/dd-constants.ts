import { DDStatus, DealStage } from '@prisma/client'

/** Deal stages where DD is actively tracked (overview scope). */
export const DD_ACTIVE_STAGES: DealStage[] = [
  DealStage.DUE_DILIGENCE,
  DealStage.FINAL_NEGOTIATION,
  DealStage.CLOSING,
]

/** Terminal DD statuses — items considered "done". */
export const DD_DONE_STATUSES: DDStatus[] = [DDStatus.COMPLETED, DDStatus.NA]
