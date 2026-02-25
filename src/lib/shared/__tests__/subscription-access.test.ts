import { describe, it, expect } from 'vitest'
import { checkSubscriptionAccess } from '../subscription-access'

describe('checkSubscriptionAccess', () => {
  it('allows ACTIVE subscription', () => {
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: null,
      stripeSubscriptionId: 'sub_123',
    })
    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('allows TRIALING with future trial end', () => {
    const future = new Date(Date.now() + 7 * 86400000) // 7 days from now
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'TRIALING',
      trialEndsAt: future,
      stripeSubscriptionId: null,
    })
    expect(result.allowed).toBe(true)
    expect(result.daysRemaining).toBe(7)
  })

  it('blocks TRIALING with expired trial', () => {
    const past = new Date(Date.now() - 86400000) // 1 day ago
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'TRIALING',
      trialEndsAt: past,
      stripeSubscriptionId: null,
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('expired')
  })

  it('allows PAST_DUE (grace period)', () => {
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'PAST_DUE',
      trialEndsAt: null,
      stripeSubscriptionId: 'sub_123',
    })
    expect(result.allowed).toBe(true)
    expect(result.reason).toContain('past due')
  })

  it('blocks CANCELED subscription', () => {
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'CANCELED',
      trialEndsAt: null,
      stripeSubscriptionId: 'sub_123',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('canceled')
  })

  it('blocks UNPAID subscription', () => {
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'UNPAID',
      trialEndsAt: null,
      stripeSubscriptionId: 'sub_123',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('unpaid')
  })

  it('blocks null status with no trial', () => {
    const result = checkSubscriptionAccess({
      subscriptionStatus: null,
      trialEndsAt: null,
      stripeSubscriptionId: null,
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('No active subscription')
  })

  it('returns correct daysRemaining for trial', () => {
    const future = new Date(Date.now() + 14 * 86400000) // 14 days
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'TRIALING',
      trialEndsAt: future,
      stripeSubscriptionId: null,
    })
    expect(result.daysRemaining).toBe(14)
  })

  it('blocks TRIALING with no trialEndsAt (data inconsistency)', () => {
    const result = checkSubscriptionAccess({
      subscriptionStatus: 'TRIALING',
      trialEndsAt: null,
      stripeSubscriptionId: null,
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('expired')
  })
})
