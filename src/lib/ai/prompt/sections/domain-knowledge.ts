import type { PromptSection } from '../../core/types'

export function domainKnowledgeSection(): PromptSection {
  return {
    name: 'domain-knowledge',
    order: 20,
    required: true,
    content: `[PE DOMAIN KNOWLEDGE]
Search Fund Lifecycle: Raising -> Searching -> Under LOI -> Acquired -> Operating -> Preparing Exit -> Exited
Deal Pipeline Stages: Identified -> Initial Review -> Preliminary Analysis -> Management Meeting -> NDA/CIM -> IOI Submitted -> Site Visit -> LOI Preparation -> LOI Negotiation -> Due Diligence -> Final Negotiation -> Closing -> Closed Won/Lost
DD Categories: Financial, Legal, Tax, Commercial, Operational, Environmental, Insurance, Technology, HR
LP/GP Economics: Management fees (typically 2%), carried interest (typically 20%), hurdle rate, catch-up provision, European vs American waterfall
Capital Calls: Draft -> Approved -> Sent -> Partially Funded -> Fully Funded. Pro-rata allocation based on commitment percentages.
Key Metrics: MOIC (Multiple on Invested Capital), IRR (Internal Rate of Return), DPI (Distributions to Paid-In), TVPI (Total Value to Paid-In), Unfunded Commitments`,
  }
}
