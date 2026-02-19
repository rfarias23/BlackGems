'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requireFundAccess } from '@/lib/shared/fund-access'
import { logAudit } from '@/lib/shared/audit'
import type { UIMessage } from 'ai'

// ---------------------------------------------------------------------------
// UIMessage ↔ DB Message Mapping
// ---------------------------------------------------------------------------

interface DbMessage {
  id: string
  role: string
  content: string
  toolInvocations: unknown
  createdAt: Date
}

/**
 * Converts a UIMessage (AI SDK v6 format with `parts` array) to our flat DB shape.
 *
 * UIMessage.parts can contain:
 *   - { type: 'text', text: string }
 *   - { type: 'tool-invocation', toolInvocationId, toolName, args, state, result }
 *
 * We extract text into `content` (joined) and tool invocations into `toolInvocations` (JSON).
 */
function uiMessageToDb(msg: UIMessage): {
  role: string
  content: string
  toolInvocations: unknown | null
} {
  const textContent = msg.parts
    .filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
    .map(p => p.text)
    .join('\n')

  const toolParts = msg.parts.filter(p => p.type === 'tool-invocation')
  const toolInvocations = toolParts.length > 0 ? toolParts : null

  return {
    role: msg.role,
    content: textContent,
    toolInvocations,
  }
}

/**
 * Converts a DB Message record back to a UIMessage (AI SDK v6 format).
 * This is used when loading conversation history for `useChat` initialMessages.
 */
function dbMessageToUi(msg: DbMessage): UIMessage {
  const parts: UIMessage['parts'] = []

  if (msg.content) {
    parts.push({ type: 'text' as const, text: msg.content })
  }

  if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
    for (const ti of msg.toolInvocations) {
      parts.push(ti as UIMessage['parts'][number])
    }
  }

  return {
    id: msg.id,
    role: msg.role as UIMessage['role'],
    parts,
  }
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Returns the last 20 non-archived conversations for a fund.
 * Ordered by updatedAt descending.
 */
export async function getConversations(fundId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  await requireFundAccess(session.user.id, fundId)

  const conversations = await prisma.conversation.findMany({
    where: {
      fundId,
      userId: session.user.id,
      archivedAt: null,
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return conversations
}

/**
 * Returns all messages for a conversation as UIMessage[] (AI SDK v6 format).
 * Verifies the conversation belongs to the authenticated user's fund.
 */
export async function getConversationMessages(
  conversationId: string
): Promise<UIMessage[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { fundId: true, userId: true },
  })

  if (!conversation) return []
  if (conversation.userId !== session.user.id) return []

  await requireFundAccess(session.user.id, conversation.fundId)

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      content: true,
      toolInvocations: true,
      createdAt: true,
    },
  })

  return messages.map(dbMessageToUi)
}

/**
 * Creates a new conversation for the authenticated user in the given fund.
 */
export async function createConversation(
  fundId: string,
  title?: string
): Promise<{ id: string; title: string | null }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await requireFundAccess(session.user.id, fundId)

  const conversation = await prisma.conversation.create({
    data: {
      fundId,
      userId: session.user.id,
      title: title || null,
    },
    select: { id: true, title: true },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Conversation',
    entityId: conversation.id,
  })

  return conversation
}

/**
 * Archives a conversation (soft delete). Sets archivedAt timestamp.
 */
export async function archiveConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true, fundId: true },
  })

  if (!conversation || conversation.userId !== session.user.id) {
    throw new Error('Conversation not found')
  }

  await requireFundAccess(session.user.id, conversation.fundId)

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { archivedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'Conversation',
    entityId: conversationId,
  })

  return { success: true }
}

/**
 * Updates the title of a conversation (auto-generated from first user message).
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  })

  if (!conversation || conversation.userId !== session.user.id) return

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: title.slice(0, 60) },
  })
}

/**
 * Persists UIMessage[] from the AI SDK onFinish callback to the database.
 * Fire-and-forget — errors are logged but never block the response stream.
 *
 * This is called from the API route, NOT from a client component.
 * The `'use server'` directive is needed because this file exports server actions,
 * but persistMessages is also callable from server-side code (the API route).
 */
export async function persistMessages(
  conversationId: string,
  uiMessages: UIMessage[]
): Promise<void> {
  try {
    // Get existing message IDs so we only insert new ones
    const existing = await prisma.message.findMany({
      where: { conversationId },
      select: { id: true },
    })
    const existingIds = new Set(existing.map(m => m.id))

    const newMessages = uiMessages.filter(msg => !existingIds.has(msg.id))
    if (newMessages.length === 0) return

    const dbRecords = newMessages.map(msg => {
      const { role, content, toolInvocations } = uiMessageToDb(msg)
      return {
        id: msg.id,
        conversationId,
        role,
        content,
        toolInvocations: toolInvocations ?? undefined,
        tokenCount: Math.ceil(content.length / 4), // ~4 chars per token estimate
      }
    })

    await prisma.message.createMany({
      data: dbRecords,
    })

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })
  } catch (error) {
    // Persistence must never block the primary operation
    console.error('Failed to persist messages:', error)
  }
}
