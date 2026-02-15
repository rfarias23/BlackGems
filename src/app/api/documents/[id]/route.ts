import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/shared/soft-delete'
import { requireFundAccess } from '@/lib/shared/fund-access'
import fs from 'fs/promises'
import path from 'path'
import { getSignedDownloadUrl } from '@/lib/s3'

// Resolve proper MIME type from stored fileType or fileName
const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
}

function resolveContentType(storedType: string, fileName: string): string {
  // If already a proper MIME type, use it
  if (storedType.includes('/')) return storedType
  // Otherwise resolve from file extension
  const ext = path.extname(fileName).toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

/** GET /api/documents/[id] — Serve a document with access control.
 *  Use ?inline=1 for preview (Content-Disposition: inline) */
export async function GET(
  request: NextRequest,
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

  // S3 documents: redirect to signed URL
  if (doc.fileUrl.startsWith('documents/')) {
    try {
      const signedUrl = await getSignedDownloadUrl(doc.fileUrl)
      return NextResponse.redirect(signedUrl)
    } catch {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }
  }

  // Legacy disk documents: serve from filesystem
  try {
    const filePath = path.join(process.cwd(), doc.fileUrl)
    const fileBuffer = await fs.readFile(filePath)

    const contentType = resolveContentType(doc.fileType, doc.fileName)
    const inline = request.nextUrl.searchParams.get('inline') === '1'
    const disposition = inline
      ? `inline; filename="${encodeURIComponent(doc.fileName)}"`
      : `attachment; filename="${encodeURIComponent(doc.fileName)}"`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': doc.fileSize.toString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}
