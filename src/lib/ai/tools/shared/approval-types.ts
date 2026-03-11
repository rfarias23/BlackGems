export interface ApprovalResult {
  needsApproval: true
  actionId: string
  tool: string
  summary: string
  details: Record<string, string>
}

export interface WriteToolMetadata {
  name: string
  description: string
  category: 'deals' | 'capital' | 'investors' | 'portfolio' | 'operations'
  isWriteTool: true
}
