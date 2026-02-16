import { describe, it, expect } from 'vitest'
import {
  validateDealScores,
  computeCompositeScore,
  getScoreColor,
} from '@/lib/shared/deal-scoring-utils'
import fs from 'fs'
import path from 'path'

// ============================================================================
// Pure utility function tests
// ============================================================================

describe('validateDealScores', () => {
  it('returns null for valid scores in range 1-10', () => {
    expect(validateDealScores({ attractivenessScore: 1, fitScore: 5, riskScore: 10 })).toBeNull()
    expect(validateDealScores({ attractivenessScore: 7, fitScore: 7, riskScore: 7 })).toBeNull()
  })

  it('returns error for scores below 1', () => {
    const result = validateDealScores({ attractivenessScore: 0, fitScore: 5, riskScore: 5 })
    expect(result).toContain('Attractiveness')
    expect(result).toContain('between 1 and 10')
  })

  it('returns error for scores above 10', () => {
    const result = validateDealScores({ attractivenessScore: 5, fitScore: 11, riskScore: 5 })
    expect(result).toContain('Fit')
    expect(result).toContain('between 1 and 10')
  })

  it('returns error for non-integer scores', () => {
    const result = validateDealScores({ attractivenessScore: 5, fitScore: 5, riskScore: 3.5 })
    expect(result).toContain('Risk')
    expect(result).toContain('integer')
  })

  it('returns error for negative scores', () => {
    const result = validateDealScores({ attractivenessScore: -1, fitScore: 5, riskScore: 5 })
    expect(result).toContain('Attractiveness')
  })
})

describe('computeCompositeScore', () => {
  it('calculates correct weighted average (40% / 35% / 25%)', () => {
    // 10 * 0.4 + 10 * 0.35 + 10 * 0.25 = 10.0
    expect(computeCompositeScore(10, 10, 10)).toBe(10)

    // 1 * 0.4 + 1 * 0.35 + 1 * 0.25 = 1.0
    expect(computeCompositeScore(1, 1, 1)).toBe(1)

    // 8 * 0.4 + 6 * 0.35 + 4 * 0.25 = 3.2 + 2.1 + 1.0 = 6.3
    expect(computeCompositeScore(8, 6, 4)).toBe(6.3)
  })

  it('returns null when all scores are null', () => {
    expect(computeCompositeScore(null, null, null)).toBeNull()
  })

  it('handles partially scored deals (one score)', () => {
    // Only attractiveness = 8, weight is re-normalized to 1.0
    expect(computeCompositeScore(8, null, null)).toBe(8)
  })

  it('handles partially scored deals (two scores)', () => {
    // Attractiveness = 8 (weight 0.4), Fit = 6 (weight 0.35)
    // Re-normalized: total weight = 0.75
    // (8*0.4 + 6*0.35) / 0.75 = (3.2 + 2.1) / 0.75 = 7.066... → 7.1
    expect(computeCompositeScore(8, 6, null)).toBe(7.1)
  })

  it('rounds to one decimal place', () => {
    // 7 * 0.4 + 5 * 0.35 + 3 * 0.25 = 2.8 + 1.75 + 0.75 = 5.3
    expect(computeCompositeScore(7, 5, 3)).toBe(5.3)
  })
})

describe('getScoreColor', () => {
  it('returns emerald-500 for scores 8-10', () => {
    expect(getScoreColor(8)).toBe('text-emerald-500')
    expect(getScoreColor(9)).toBe('text-emerald-500')
    expect(getScoreColor(10)).toBe('text-emerald-500')
  })

  it('returns amber-500 for scores 5-7', () => {
    expect(getScoreColor(5)).toBe('text-amber-500')
    expect(getScoreColor(6)).toBe('text-amber-500')
    expect(getScoreColor(7)).toBe('text-amber-500')
  })

  it('returns red-400 for scores 1-4', () => {
    expect(getScoreColor(1)).toBe('text-red-400')
    expect(getScoreColor(2)).toBe('text-red-400')
    expect(getScoreColor(3)).toBe('text-red-400')
    expect(getScoreColor(4)).toBe('text-red-400')
  })
})

// ============================================================================
// Server action structural tests
// ============================================================================

describe('deal scoring server actions', () => {
  const dealsPath = path.join(process.cwd(), 'src/lib/actions/deals.ts')

  it('updateDealScores exists with correct pattern', () => {
    const src = fs.readFileSync(dealsPath, 'utf-8')
    expect(src).toContain('export async function updateDealScores')
    // Must follow server action pattern
    expect(src).toContain("!session?.user?.id")
    expect(src).toContain('requireFundAccess')
    expect(src).toContain('logAudit')
    expect(src).toContain('computeChanges')
  })

  it('getDealScores exists with auth check', () => {
    const src = fs.readFileSync(dealsPath, 'utf-8')
    expect(src).toContain('export async function getDealScores')
    expect(src).toContain("!session?.user?.id")
  })

  it('scoring schema validates 1-10 range', () => {
    const src = fs.readFileSync(dealsPath, 'utf-8')
    expect(src).toContain('min(1)')
    expect(src).toContain('max(10)')
    expect(src).toContain('attractivenessScore')
    expect(src).toContain('fitScore')
    expect(src).toContain('riskScore')
  })
})

// ============================================================================
// Component structural tests
// ============================================================================

describe('deal scoring component', () => {
  const componentPath = path.join(process.cwd(), 'src/components/deals/deal-scoring.tsx')

  it('component file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true)
  })

  it('is a client component with useTransition', () => {
    const src = fs.readFileSync(componentPath, 'utf-8')
    expect(src).toMatch(/^'use client'/)
    expect(src).toContain('useTransition')
  })

  it('imports scoring utilities', () => {
    const src = fs.readFileSync(componentPath, 'utf-8')
    expect(src).toContain('computeCompositeScore')
    expect(src).toContain('getScoreColor')
  })

  it('uses font-mono tabular-nums for score display', () => {
    const src = fs.readFileSync(componentPath, 'utf-8')
    expect(src).toContain('font-mono')
    expect(src).toContain('tabular-nums')
  })
})
