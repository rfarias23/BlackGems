import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — vi.mock factories are hoisted, so they must use vi.fn() inline
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    organization: { findUnique: vi.fn() },
    fund: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/shared/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/shared/rate-limit', () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 4, resetAt: Date.now() + 300_000 }),
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword') },
}))

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
}))

import { registerWithOnboarding } from '../onboarding'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/shared/rate-limit'
import { logAudit } from '@/lib/shared/audit'
import { sendWelcomeEmail } from '@/lib/email'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const searchFundInput = {
  vehicleType: 'SEARCH_FUND' as const,
  firmName: 'Martha Fund',
  orgSlug: 'martha-fund',
  targetSize: 5_000_000,
  currency: 'USD' as const,
  userName: 'Martha Smith',
  userEmail: 'martha@fund.com',
  password: 'securepass123',
  confirmPassword: 'securepass123',
}

const peFundInput = {
  vehicleType: 'PE_FUND' as const,
  firmName: 'Andes Capital Partners',
  orgSlug: 'andes-capital',
  legalName: 'Andes Capital Partners LLC',
  entityType: 'LLC',
  jurisdiction: 'Delaware, USA',
  fundName: 'Andes Capital Fund I',
  fundSlug: 'andes-fund-i',
  fundType: 'PE_FUND' as const,
  targetSize: 25_000_000,
  vintage: 2026,
  currency: 'USD' as const,
  strategy: 'Mid-market buyouts',
  userName: 'Maria Rodriguez',
  userEmail: 'maria@andes.com',
  password: 'securepass123',
  confirmPassword: 'securepass123',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupHappyPath() {
  // Uniqueness checks return null (no conflicts)
  vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never)
  vi.mocked(prisma.organization.findUnique).mockResolvedValue(null as never)
  vi.mocked(prisma.fund.findFirst).mockResolvedValue(null as never)

  // Transaction returns created entities
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
    const tx = {
      organization: { create: vi.fn().mockResolvedValue({ id: 'org_1', name: 'Martha Fund', slug: 'martha-fund' }) },
      user: { create: vi.fn().mockResolvedValue({ id: 'user_1', email: 'martha@fund.com', name: 'Martha Smith' }) },
      fund: { create: vi.fn().mockResolvedValue({ id: 'fund_1', name: 'Martha Fund', slug: 'martha-fund' }) },
      fundMember: { create: vi.fn().mockResolvedValue({ id: 'fm_1' }) },
    }
    if (typeof fn === 'function') {
      return (fn as (tx: typeof prisma) => Promise<unknown>)(tx as unknown as typeof prisma)
    }
    return undefined
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('registerWithOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rateLimit).mockReturnValue({ success: true, remaining: 4, resetAt: Date.now() + 300_000 })
    setupHappyPath()
  })

  // Happy paths
  describe('happy path', () => {
    it('registers Search Fund successfully', async () => {
      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ success: true, fundSlug: 'martha-fund', skipPayment: false })
    })

    it('registers PE Fund successfully', async () => {
      const result = await registerWithOnboarding(peFundInput)
      expect(result).toEqual({ success: true, fundSlug: 'andes-fund-i', skipPayment: false })
    })

    it('calls logAudit 3 times on success', async () => {
      await registerWithOnboarding(searchFundInput)
      await new Promise((r) => setTimeout(r, 50))
      expect(logAudit).toHaveBeenCalledTimes(3)
    })

    it('sends welcome email on success', async () => {
      await registerWithOnboarding(searchFundInput)
      await new Promise((r) => setTimeout(r, 50))
      expect(sendWelcomeEmail).toHaveBeenCalledWith({
        to: 'martha@fund.com',
        userName: 'Martha Smith',
        fundName: 'Martha Fund',
        fundSlug: 'martha-fund',
      })
    })

    it('Search Fund uses orgSlug for fund slug', async () => {
      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ success: true, fundSlug: 'martha-fund', skipPayment: false })
    })

    it('PE Fund uses separate fund slug', async () => {
      const result = await registerWithOnboarding(peFundInput)
      expect(result).toEqual({ success: true, fundSlug: 'andes-fund-i', skipPayment: false })
    })

    it('Search Fund with EUR currency succeeds', async () => {
      const result = await registerWithOnboarding({
        ...searchFundInput,
        currency: 'EUR',
      })
      expect(result).toEqual({ success: true, fundSlug: 'martha-fund', skipPayment: false })
    })
  })

  // Rate limiting
  describe('rate limiting', () => {
    it('returns error when rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockReturnValue({ success: false, remaining: 0, resetAt: Date.now() + 300_000 })
      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ error: 'Too many attempts. Please try again in a few minutes.' })
    })
  })

  // Validation
  describe('validation', () => {
    it('rejects missing required fields', async () => {
      const result = await registerWithOnboarding({
        vehicleType: 'SEARCH_FUND',
      } as never)
      expect('error' in result).toBe(true)
    })

    it('rejects password mismatch', async () => {
      const result = await registerWithOnboarding({
        ...searchFundInput,
        confirmPassword: 'different',
      })
      expect(result).toEqual({ error: 'Passwords do not match' })
    })

    it('rejects password shorter than 8 chars', async () => {
      const result = await registerWithOnboarding({
        ...searchFundInput,
        password: 'short',
        confirmPassword: 'short',
      })
      expect('error' in result).toBe(true)
    })

    it('rejects invalid email', async () => {
      const result = await registerWithOnboarding({
        ...searchFundInput,
        userEmail: 'not-email',
      })
      expect('error' in result).toBe(true)
    })

    it('rejects reserved slug', async () => {
      const result = await registerWithOnboarding({
        ...searchFundInput,
        orgSlug: 'admin',
      })
      expect('error' in result).toBe(true)
    })
  })

  // Uniqueness
  describe('uniqueness checks', () => {
    it('rejects duplicate email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as never)
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null as never)
      vi.mocked(prisma.fund.findFirst).mockResolvedValue(null as never)

      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ error: 'An account with this email already exists.' })
    })

    it('rejects duplicate org slug', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never)
      vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'existing' } as never)
      vi.mocked(prisma.fund.findFirst).mockResolvedValue(null as never)

      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ error: 'This firm URL is already taken.' })
    })

    it('rejects duplicate fund slug', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never)
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null as never)
      vi.mocked(prisma.fund.findFirst).mockResolvedValue({ id: 'existing' } as never)

      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ error: 'This fund URL is already taken.' })
    })
  })

  // Error handling
  describe('error handling', () => {
    it('handles P2002 unique constraint violation', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue({ code: 'P2002' })

      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ error: 'This email or URL was just taken. Please try again.' })
    })

    it('handles generic database error', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Connection failed'))

      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ error: 'Something went wrong. Please try again.' })
    })

    it('succeeds even if welcome email fails', async () => {
      vi.mocked(sendWelcomeEmail).mockRejectedValue(new Error('Resend down'))
      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ success: true, fundSlug: 'martha-fund', skipPayment: false })
    })

    it('succeeds even if audit logging fails', async () => {
      vi.mocked(logAudit).mockRejectedValue(new Error('Audit DB error'))
      const result = await registerWithOnboarding(searchFundInput)
      expect(result).toEqual({ success: true, fundSlug: 'martha-fund', skipPayment: false })
    })
  })
})
