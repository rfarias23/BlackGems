import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentCategory } from '@prisma/client'
import { notDeleted } from '@/lib/shared/soft-delete'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { logAudit } from '@/lib/shared/audit'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'

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

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const dealId = formData.get('dealId') as string | null
    const investorId = formData.get('investorId') as string | null
    const category = formData.get('category') as string | null
    const documentName = formData.get('name') as string | null

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

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', ownerId)
    await fs.mkdir(uploadDir, { recursive: true })

    // Generate unique filename to avoid collisions
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storedName = `${timestamp}_${safeName}`
    const filePath = path.join(uploadDir, storedName)
    const relativePath = `uploads/${ownerId}/${storedName}`

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    // Create document record
    const doc = await prisma.document.create({
      data: {
        name: documentName || file.name,
        fileName: file.name,
        fileUrl: relativePath,
        fileType: file.type || ext,
        fileSize: file.size,
        category: category as DocumentCategory,
        dealId: dealId || undefined,
        investorId: investorId || undefined,
        uploadedBy: session.user.id,
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
