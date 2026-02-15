import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('settings.ts audit logging coverage', () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/actions/settings.ts'),
    'utf-8'
  )

  // Extract function bodies by finding each export async function and its closing
  function extractFunctionBody(funcName: string): string {
    const regex = new RegExp(
      `export async function ${funcName}[\\s\\S]*?\\n\\}`,
      'm'
    )
    const match = content.match(regex)
    return match?.[0] || ''
  }

  it('updateProfile calls logAudit', () => {
    const body = extractFunctionBody('updateProfile')
    expect(body).toContain('logAudit')
  })

  it('changePassword calls logAudit', () => {
    const body = extractFunctionBody('changePassword')
    expect(body).toContain('logAudit')
  })

  it('updateFundConfig calls logAudit', () => {
    const body = extractFunctionBody('updateFundConfig')
    expect(body).toContain('logAudit')
  })

  it('updateFundStatus calls logAudit', () => {
    const body = extractFunctionBody('updateFundStatus')
    expect(body).toContain('logAudit')
  })
})
