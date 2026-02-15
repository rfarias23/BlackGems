import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentCategory } from '@prisma/client'
import { notDeleted } from '@/lib/shared/soft-delete'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { logAudit } from '@/lib/shared/audit'
import { rateLimit } from '@/lib/shared/rate-limit'
import { revalidatePath } from 'next/cache'
import path from 'path'
import { uploadToS3, getS3Key } from '@/lib/s3'

const MANAGE_ROLES = ['SUPER_ADMIN', 'FUND_ADMIN', 'INVESTMENT_MANAGER', 'ANALYST']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.csv', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.zip',
]

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = (session.user as { role?: string }).role || 'LP_VIEWER'
  if (!MANAGE_ROLES.includes(userRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Rate limit: 20 uploads per minute per user
  const rateLimitResult = rateLimit(`upload:${session.user.id}`, 20, 60_000)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const dealId = formData.get('dealId') as string | null
    const investorId = formData.get('investorId') as string | null
    const category = formData.get('category') as string | null
    const documentName = formData.get('name') as string | null
    const parentDocumentId = formData.get('parentDocumentId') as string | null

    if (!file || !category || (!dealId && !investorId)) {
      return NextResponse.json({ error: 'Missing required fields: file, category, and dealId or investorId' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `File type ${ext} not allowed.` }, { status: 400 })
    }

    // Validate category
    if (!Object.values(DocumentCategory).includes(category as DocumentCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Determine ownership folder and verify access
    const ownerId = dealId || investorId!
    if (dealId) {
      const deal = await prisma.deal.findFirst({
        where: { id: dealId, ...notDeleted },
        select: { fundId: true },
      })
      if (!deal) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }
      await requireFundAccess(session.user.id, deal.fundId)
    } else if (investorId) {
      const investor = await prisma.investor.findFirst({
        where: { id: investorId, deletedAt: null },
      })
      if (!investor) {
        return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
      }
    }

    // Upload to S3
    const s3Key = getS3Key(ownerId, file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'application/octet-stream'
    await uploadToS3(s3Key, buffer, contentType)

    // Version logic
    let version = 1
    let parentId: string | undefined = undefined

    if (parentDocumentId) {
      const parentDoc = await prisma.document.findFirst({
        where: { id: parentDocumentId, ...notDeleted },
      })
      if (parentDoc) {
        // Find the root document
        const rootId = parentDoc.parentId || parentDoc.id

        // Get highest version in the chain
        const maxVersion = await prisma.document.aggregate({
          where: {
            OR: [
              { id: rootId },
              { parentId: rootId },
            ],
            ...notDeleted,
          },
          _max: { version: true },
        })

        version = (maxVersion._max.version || 0) + 1
        parentId = rootId

        // Mark all existing versions as not latest
        await prisma.document.updateMany({
          where: {
            OR: [
              { id: rootId },
              { parentId: rootId },
            ],
            ...notDeleted,
          },
          data: { isLatest: false },
        })
      }
    }

    // Create document record
    const doc = await prisma.document.create({
      data: {
        name: documentName || file.name,
        fileName: file.name,
        fileUrl: s3Key,
        fileType: file.type || ext,
        fileSize: file.size,
        category: category as DocumentCategory,
        dealId: dealId || undefined,
        investorId: investorId || undefined,
        uploadedBy: session.user.id,
        version,
        isLatest: true,
        parentId: parentId || undefined,
      },
    })

    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Document',
      entityId: doc.id,
    })

    if (dealId) revalidatePath(`/deals/${dealId}`)
    if (investorId) revalidatePath(`/investors/${investorId}`)

    return NextResponse.json({ success: true, documentId: doc.id })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
