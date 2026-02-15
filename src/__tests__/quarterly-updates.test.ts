import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('quarterly update builder', () => {
  const filePath = path.join(process.cwd(), 'src/lib/actions/quarterly-updates.ts')

  it('exports generateQuarterlyUpdate function', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toContain('export async function generateQuarterlyUpdate')
  })

  it('exports updateQuarterlySection function', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toContain('export async function updateQuarterlySection')
  })

  it('exports getQuarterlyUpdateDraft function', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toContain('export async function getQuarterlyUpdateDraft')
  })

  it('exports approveAndPublish function', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toContain('export async function approveAndPublish')
  })

  it('follows server action pattern', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toMatch(/^'use server'/)
    expect(src).toContain('auth()')
    expect(src).toContain("!session?.user?.id")
    expect(src).toContain('requireFundAccess')
    expect(src).toContain('logAudit')
  })

  it('validates input with Zod', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toContain('z.object')
    expect(src).toContain('.safeParse')
  })

  it('auto-populates fund summary section', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toContain('fund_summary')
    expect(src).toContain('formatMoney')
    expect(src).toContain('formatPercent')
  })

  it('exports listReports function', () => {
    const src = fs.readFileSync(filePath, 'utf-8')
    expect(src).toContain('export async function listReports')
  })
})
