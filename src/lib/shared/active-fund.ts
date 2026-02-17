import { cookies } from 'next/headers'

const ACTIVE_FUND_COOKIE = 'blackgem-active-fund'

/**
 * Reads the active fund ID from the httpOnly cookie.
 * Returns null if no cookie is set.
 */
export async function getActiveFundId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_FUND_COOKIE)?.value ?? null
}

/**
 * Sets the active fund ID in an httpOnly cookie.
 * Persists for 1 year. Secure in production.
 */
export async function setActiveFundId(fundId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_FUND_COOKIE, fundId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}

/**
 * Clears the active fund cookie.
 */
export async function clearActiveFundId(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_FUND_COOKIE)
}
