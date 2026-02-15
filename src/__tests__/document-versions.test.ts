import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('document versioning', () => {
  const versionsPath = path.join(process.cwd(), 'src/lib/actions/document-versions.ts')
  const uploadPath = path.join(process.cwd(), 'src/app/api/documents/upload/route.ts')
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma')

  it('document-versions.ts exists with required exports', () => {
    const src = fs.readFileSync(versionsPath, 'utf-8')
    expect(src).toContain('export async function getDocumentVersions')
    expect(src).toContain('export async function setLatestVersion')
  })

  it('upload route supports parentDocumentId', () => {
    const src = fs.readFileSync(uploadPath, 'utf-8')
    expect(src).toContain('parentDocumentId')
    expect(src).toContain('version')
    expect(src).toContain('isLatest')
  })

  it('schema has versioning fields on Document', () => {
    const src = fs.readFileSync(schemaPath, 'utf-8')
    expect(src).toContain('version')
    expect(src).toContain('isLatest')
    expect(src).toContain('parentId')
    expect(src).toContain('DocumentVersions')
  })

  it('version actions follow server action pattern', () => {
    const src = fs.readFileSync(versionsPath, 'utf-8')
    // Must have 'use server' directive
    expect(src).toMatch(/^'use server'/)
    // Must check auth
    expect(src).toContain('auth()')
    expect(src).toContain("!session?.user?.id")
    // Must have audit logging
    expect(src).toContain('logAudit')
  })
})
