import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { requireFundAccess } from '@/lib/shared/fund-access'
import fs from 'fs/promises'
import path from 'path'

/** GET /api/documents/[id] — Download a document with access control */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const doc = await prisma.document.findFirst({
    where: { id, ...notDeleted },
    include: { deal: { select: { fundId: true } } },
  })

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Verify fund access
  const fundId = doc.deal?.fundId
  if (fundId) {
    try {
      await requireFundAccess(session.user.id, fundId)
    } catch {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  // Read file from disk
  try {
    const filePath = path.join(process.cwd(), doc.fileUrl)
    const fileBuffer = await fs.readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        'Content-Length': doc.fileSize.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}
