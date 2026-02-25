/**
 * Zod validation schemas for the onboarding wizard.
 *
 * Per-step schemas for client-side validation + a combined schema
 * for the server action. Shared between client and server.
 */

import { z } from 'zod'

// ============================================================================
// STEP 1: Vehicle Type
// ============================================================================

export const vehicleTypeSchema = z.object({
  vehicleType: z.enum(['SEARCH_FUND', 'PE_FUND']),
})

export type VehicleType = z.infer<typeof vehicleTypeSchema>['vehicleType']

// ============================================================================
// STEP 2 (Search Fund): Combined firm + fund + account
// ============================================================================

export const searchFundStepSchema = z.object({
  firmName: z.string().min(2, 'Fund name must be at least 2 characters').max(255),
  targetSize: z.number().min(1000, 'Target size must be at least 1,000'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  userName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  userEmail: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ============================================================================
// STEP 2 (PE Fund): Firm info
// ============================================================================

export const peFirmStepSchema = z.object({
  firmName: z.string().min(2, 'Firm name must be at least 2 characters').max(255),
  orgSlug: z.string().min(3, 'URL must be at least 3 characters').max(63),
  legalName: z.string().max(255).optional().or(z.literal('')),
  entityType: z.string().optional().or(z.literal('')),
  jurisdiction: z.string().max(255).optional().or(z.literal('')),
})

// ============================================================================
// STEP 3 (PE Fund): Fund info
// ============================================================================

export const peFundStepSchema = z.object({
  fundName: z.string().min(2, 'Fund name must be at least 2 characters').max(200),
  fundSlug: z.string().min(3, 'Fund URL must be at least 3 characters').max(63),
  fundType: z.enum([
    'TRADITIONAL_SEARCH_FUND',
    'SELF_FUNDED_SEARCH',
    'ACCELERATOR_FUND',
    'ACQUISITION_FUND',
    'PE_FUND',
    'HOLDING_COMPANY',
  ]),
  targetSize: z.number().min(1000, 'Target size must be at least 1,000'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  vintage: z.number().min(2000).max(2100).optional(),
  strategy: z.string().max(500).optional().or(z.literal('')),
})

// ============================================================================
// STEP 4 (PE Fund): Account info
// ============================================================================

export const peAccountStepSchema = z.object({
  userName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  userEmail: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ============================================================================
// FULL ONBOARDING SCHEMA (server action)
// ============================================================================

export const onboardingSchema = z.object({
  vehicleType: z.enum(['SEARCH_FUND', 'PE_FUND']),

  // Organization
  firmName: z.string().min(2).max(255),
  orgSlug: z.string().min(3).max(63),
  legalName: z.string().max(255).optional().or(z.literal('')),
  entityType: z.string().optional().or(z.literal('')),
  jurisdiction: z.string().max(255).optional().or(z.literal('')),

  // Fund
  fundName: z.string().min(2).max(200).optional(),
  fundSlug: z.string().min(3).max(63).optional(),
  fundType: z.enum([
    'TRADITIONAL_SEARCH_FUND',
    'SELF_FUNDED_SEARCH',
    'ACCELERATOR_FUND',
    'ACQUISITION_FUND',
    'PE_FUND',
    'HOLDING_COMPANY',
  ]).optional(),
  targetSize: z.number().min(1000),
  vintage: z.number().min(2000).max(2100).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  strategy: z.string().max(500).optional().or(z.literal('')),

  // Account
  userName: z.string().min(2).max(100),
  userEmail: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),

  // Beta code (optional)
  code: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
