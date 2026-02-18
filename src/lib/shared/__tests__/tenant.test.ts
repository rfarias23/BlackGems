import { describe, it, expect } from 'vitest'
import { extractSubdomain, isRootDomain } from '../tenant'

describe('extractSubdomain', () => {
  const ROOT_DOMAIN = 'blackgem.ai'

  it('extracts subdomain from fund.blackgem.ai', () => {
    expect(extractSubdomain('martha-fund.blackgem.ai', ROOT_DOMAIN)).toBe('martha-fund')
  })

  it('extracts subdomain from multi-word slug', () => {
    expect(extractSubdomain('andes-capital-fund-i.blackgem.ai', ROOT_DOMAIN)).toBe('andes-capital-fund-i')
  })

  it('returns null for root domain blackgem.ai', () => {
    expect(extractSubdomain('blackgem.ai', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for www.blackgem.ai', () => {
    expect(extractSubdomain('www.blackgem.ai', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for localhost', () => {
    expect(extractSubdomain('localhost:3002', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for localhost without port', () => {
    expect(extractSubdomain('localhost', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractSubdomain('', ROOT_DOMAIN)).toBeNull()
  })

  it('returns null for unrelated domain', () => {
    expect(extractSubdomain('example.com', ROOT_DOMAIN)).toBeNull()
  })

  it('strips port from hostname before extracting', () => {
    expect(extractSubdomain('martha-fund.blackgem.ai:443', ROOT_DOMAIN)).toBe('martha-fund')
  })
})

describe('isRootDomain', () => {
  const ROOT_DOMAIN = 'blackgem.ai'

  it('returns true for blackgem.ai', () => {
    expect(isRootDomain('blackgem.ai', ROOT_DOMAIN)).toBe(true)
  })

  it('returns true for www.blackgem.ai', () => {
    expect(isRootDomain('www.blackgem.ai', ROOT_DOMAIN)).toBe(true)
  })

  it('returns true for localhost', () => {
    expect(isRootDomain('localhost:3002', ROOT_DOMAIN)).toBe(true)
  })

  it('returns false for subdomain', () => {
    expect(isRootDomain('martha-fund.blackgem.ai', ROOT_DOMAIN)).toBe(false)
  })
})
