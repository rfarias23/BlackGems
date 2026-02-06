import { DocumentCategory } from '@prisma/client'

// Category display names
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  FUND_FORMATION: 'Fund Formation',
  INVESTOR_COMMS: 'Investor Comms',
  TAX: 'Tax',
  COMPLIANCE: 'Compliance',
  CIM: 'CIM',
  NDA: 'NDA',
  FINANCIAL_STATEMENTS: 'Financial Statements',
  LOI: 'LOI',
  TERM_SHEET: 'Term Sheet',
  DUE_DILIGENCE: 'Due Diligence',
  PURCHASE_AGREEMENT: 'Purchase Agreement',
  CLOSING_DOCS: 'Closing Docs',
  BOARD_MATERIALS: 'Board Materials',
  OPERATING_REPORTS: 'Operating Reports',
  BUDGET: 'Budget',
  STRATEGIC_PLAN: 'Strategic Plan',
  LEGAL: 'Legal',
  OTHER: 'Other',
}

// Deal-relevant categories (subset for deal data room)
export const DEAL_CATEGORIES: DocumentCategory[] = [
  'CIM',
  'NDA',
  'FINANCIAL_STATEMENTS',
  'LOI',
  'TERM_SHEET',
  'DUE_DILIGENCE',
  'PURCHASE_AGREEMENT',
  'CLOSING_DOCS',
  'LEGAL',
  'OTHER',
]

export interface DocumentItem {
  id: string
  name: string
  fileName: string
  fileType: string
  fileSize: number
  category: string
  categoryLabel: string
  uploadedBy: string
  uploaderName: string | null
  createdAt: Date
}
