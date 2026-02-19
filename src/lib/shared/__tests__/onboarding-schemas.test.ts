import { describe, it, expect } from 'vitest'
import {
  vehicleTypeSchema,
  searchFundStepSchema,
  peFirmStepSchema,
  peFundStepSchema,
  peAccountStepSchema,
  onboardingSchema,
} from '../onboarding-schemas'

describe('vehicleTypeSchema', () => {
  it('accepts SEARCH_FUND', () => {
    expect(vehicleTypeSchema.safeParse({ vehicleType: 'SEARCH_FUND' }).success).toBe(true)
  })

  it('accepts PE_FUND', () => {
    expect(vehicleTypeSchema.safeParse({ vehicleType: 'PE_FUND' }).success).toBe(true)
  })

  it('rejects invalid type', () => {
    expect(vehicleTypeSchema.safeParse({ vehicleType: 'MICRO_PE' }).success).toBe(false)
  })
})

describe('searchFundStepSchema', () => {
  const validData = {
    firmName: 'Martha Fund',
    targetSize: 5_000_000,
    currency: 'USD' as const,
    userName: 'Maria Rodriguez',
    userEmail: 'maria@fund.com',
    password: 'securepass123',
    confirmPassword: 'securepass123',
  }

  it('accepts valid search fund data', () => {
    expect(searchFundStepSchema.safeParse(validData).success).toBe(true)
  })

  it('rejects password mismatch', () => {
    const result = searchFundStepSchema.safeParse({
      ...validData,
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Passwords do not match')
    }
  })

  it('rejects password shorter than 8 chars', () => {
    const result = searchFundStepSchema.safeParse({
      ...validData,
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects target size below 1000', () => {
    const result = searchFundStepSchema.safeParse({
      ...validData,
      targetSize: 500,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = searchFundStepSchema.safeParse({
      ...validData,
      userEmail: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('accepts EUR currency', () => {
    const result = searchFundStepSchema.safeParse({
      ...validData,
      currency: 'EUR',
    })
    expect(result.success).toBe(true)
  })

  it('accepts GBP currency', () => {
    const result = searchFundStepSchema.safeParse({
      ...validData,
      currency: 'GBP',
    })
    expect(result.success).toBe(true)
  })
})

describe('peFirmStepSchema', () => {
  it('accepts valid firm data with all fields', () => {
    const result = peFirmStepSchema.safeParse({
      firmName: 'Andes Capital Partners',
      orgSlug: 'andes-capital',
      legalName: 'Andes Capital Partners LLC',
      entityType: 'LLC',
      jurisdiction: 'Delaware, USA',
    })
    expect(result.success).toBe(true)
  })

  it('accepts firm data with optional fields empty', () => {
    const result = peFirmStepSchema.safeParse({
      firmName: 'Andes Capital Partners',
      orgSlug: 'andes-capital',
      legalName: '',
      entityType: '',
      jurisdiction: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects firm name shorter than 2 chars', () => {
    const result = peFirmStepSchema.safeParse({
      firmName: 'A',
      orgSlug: 'a-fund',
    })
    expect(result.success).toBe(false)
  })

  it('rejects slug shorter than 3 chars', () => {
    const result = peFirmStepSchema.safeParse({
      firmName: 'Andes',
      orgSlug: 'ab',
    })
    expect(result.success).toBe(false)
  })
})

describe('peFundStepSchema', () => {
  const validData = {
    fundName: 'Andes Capital Fund I',
    fundSlug: 'andes-fund-i',
    fundType: 'PE_FUND' as const,
    targetSize: 25_000_000,
    currency: 'USD' as const,
  }

  it('accepts valid fund data', () => {
    expect(peFundStepSchema.safeParse(validData).success).toBe(true)
  })

  it('accepts fund data with optional fields', () => {
    expect(peFundStepSchema.safeParse({
      ...validData,
      vintage: 2026,
      strategy: 'Mid-market buyouts in Latin America',
    }).success).toBe(true)
  })

  it('accepts all fund types', () => {
    const types = [
      'TRADITIONAL_SEARCH_FUND', 'SELF_FUNDED_SEARCH', 'ACCELERATOR_FUND',
      'ACQUISITION_FUND', 'PE_FUND', 'HOLDING_COMPANY',
    ]
    for (const type of types) {
      expect(
        peFundStepSchema.safeParse({ ...validData, fundType: type }).success,
        `Expected ${type} to be accepted`
      ).toBe(true)
    }
  })

  it('rejects strategy longer than 500 chars', () => {
    const result = peFundStepSchema.safeParse({
      ...validData,
      strategy: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('peAccountStepSchema', () => {
  it('accepts valid account data', () => {
    const result = peAccountStepSchema.safeParse({
      userName: 'Maria Rodriguez',
      userEmail: 'maria@andes.com',
      password: 'securepass123',
      confirmPassword: 'securepass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects password mismatch', () => {
    const result = peAccountStepSchema.safeParse({
      userName: 'Maria Rodriguez',
      userEmail: 'maria@andes.com',
      password: 'securepass123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })
})

describe('onboardingSchema (full)', () => {
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

  it('validates Search Fund input', () => {
    expect(onboardingSchema.safeParse(searchFundInput).success).toBe(true)
  })

  it('validates PE Fund input', () => {
    expect(onboardingSchema.safeParse(peFundInput).success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = onboardingSchema.safeParse({
      vehicleType: 'SEARCH_FUND',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password mismatch in full schema', () => {
    const result = onboardingSchema.safeParse({
      ...searchFundInput,
      confirmPassword: 'wrong',
    })
    expect(result.success).toBe(false)
  })

  it('accepts Search Fund with EUR currency', () => {
    const result = onboardingSchema.safeParse({
      ...searchFundInput,
      currency: 'EUR',
    })
    expect(result.success).toBe(true)
  })
})
