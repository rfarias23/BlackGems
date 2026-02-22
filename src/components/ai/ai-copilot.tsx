'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { ChevronDown, Plus, Send, Square, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAICopilot } from './ai-copilot-provider'
import { AIMessage } from './ai-message'
import {
  createConversation,
  getConversationMessages,
} from '@/lib/actions/ai-conversations'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(date: Date | string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// AICopilot — Wrapper that owns conversation state and renders ChatSession
// with a React key so useChat always receives a STATIC id prop.
// ---------------------------------------------------------------------------

export function AICopilot() {
  const {
    isOpen,
    setIsOpen,
    currentConversationId,
    setCurrentConversationId,
    conversations,
    fundId,
    refreshConversations,
  } = useAICopilot()

  const [inputValue, setInputValue] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [pendingFirstMessage, setPendingFirstMessage] = useState<string | null>(
    null
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value)
      setSendError(null)
      const el = e.target
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    },
    []
  )

  // Handle send — creates conversation if needed, then delegates to ChatSession
  const handleSend = useCallback(async () => {
    const text = inputValue.trim()
    if (!text) return

    if (!fundId) {
      setSendError('No fund configured. Go to Settings to set up your fund.')
      return
    }

    setInputValue('')
    setSendError(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // If there is already a conversation, ChatSession handles sending via its
    // own sendMessage (triggered by onSendRequest callback).
    if (currentConversationId) {
      // Signal ChatSession to send — we store it in pendingFirstMessage temporarily
      // but ChatSession picks it up via the onSendRequest prop
      sendRequestRef.current?.(text)
      return
    }

    // No conversation yet — create one, then remount ChatSession with the new id.
    // The first message text is passed as a prop so the new ChatSession sends it on mount.
    try {
      const conv = await createConversation(fundId)
      setPendingFirstMessage(text)
      setCurrentConversationId(conv.id)
    } catch (err) {
      console.error('Failed to create conversation:', err)
      setSendError('Failed to start conversation. Please try again.')
    }
  }, [inputValue, fundId, currentConversationId, setCurrentConversationId])

  // Refs to ChatSession's send and stop functions
  const sendRequestRef = useRef<((text: string) => void) | null>(null)
  const stopRequestRef = useRef<(() => void) | null>(null)

  const handleStop = useCallback(() => {
    stopRequestRef.current?.()
  }, [])

  // Handle keyboard: Enter to send, Shift+Enter for newline
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Create new conversation
  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null)
    setInputValue('')
    setSendError(null)
    setPendingFirstMessage(null)
  }, [setCurrentConversationId])

  // Switch conversation
  const handleSwitchConversation = useCallback(
    (id: string) => {
      setCurrentConversationId(id)
      setSendError(null)
      setPendingFirstMessage(null)
    },
    [setCurrentConversationId]
  )

  // Current conversation title
  const currentTitle = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)?.title ??
      'New Conversation'
    : 'New Conversation'

  // Callback when ChatSession streaming status changes (for disabling send button)
  const [isStreaming, setIsStreaming] = useState(false)
  const handleStreamingChange = useCallback((streaming: boolean) => {
    setIsStreaming(streaming)
  }, [])
  const handleFirstMessageConsumed = useCallback(() => {
    setPendingFirstMessage(null)
  }, [])

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full w-[400px] bg-[#080A0F] border-l border-[#1E293B]">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#1E293B] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-sm text-[#F8FAFC] hover:text-white truncate max-w-[240px]">
                <span className="truncate">{currentTitle}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-72 bg-[#1E293B] text-[#F8FAFC] border-[#334155]"
              align="start"
            >
              {conversations.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[#64748B]">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <DropdownMenuItem
                    key={conv.id}
                    onClick={() => handleSwitchConversation(conv.id)}
                    className={`focus:bg-[#334155] focus:text-[#F8FAFC] cursor-pointer text-sm ${
                      conv.id === currentConversationId
                        ? 'text-[#3E5CFF]'
                        : 'text-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">
                        {conv.title ?? 'Untitled'}
                      </span>
                      <span className="text-[10px] text-[#64748B] shrink-0">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewConversation}
            className="h-7 w-7 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155]"
            aria-label="New conversation"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155]"
            aria-label="Close AI panel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Chat session — keyed so useChat always gets a static id */}
      <ChatSession
        key={currentConversationId ?? 'new'}
        conversationId={currentConversationId}
        fundId={fundId}
        firstMessage={pendingFirstMessage}
        onFirstMessageConsumed={handleFirstMessageConsumed}
        onStreamingChange={handleStreamingChange}
        onRefreshConversations={refreshConversations}
        sendRequestRef={sendRequestRef}
        stopRequestRef={stopRequestRef}
      />

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        {sendError && (
          <p className="text-xs text-red-400 mb-2 px-1">{sendError}</p>
        )}
        <div className="flex items-end gap-2 bg-[#0F1218] border border-[#1E293B] rounded-lg px-3 py-2 focus-within:border-[#3E5CFF] transition-colors">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your fund..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#F8FAFC] placeholder:text-[#475569] resize-none outline-none max-h-[120px]"
          />
          {isStreaming ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStop}
              className="h-7 w-7 shrink-0 bg-[#334155] text-[#F8FAFC] hover:bg-[#475569]"
              aria-label="Stop generating"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="h-7 w-7 shrink-0 bg-[#3E5CFF] text-white hover:bg-[#3E5CFF]/90 disabled:opacity-30 disabled:bg-[#3E5CFF]/50"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChatSession — Inner component that owns a single useChat instance.
// The conversationId prop is STATIC for the lifetime of this component
// (React key in parent forces remount when conversation changes).
// ---------------------------------------------------------------------------

interface ChatSessionProps {
  conversationId: string | null
  fundId: string
  firstMessage: string | null
  onFirstMessageConsumed: () => void
  onStreamingChange: (streaming: boolean) => void
  onRefreshConversations: () => Promise<void>
  sendRequestRef: React.MutableRefObject<((text: string) => void) | null>
  stopRequestRef: React.MutableRefObject<(() => void) | null>
}

function ChatSession({
  conversationId,
  fundId,
  firstMessage,
  onFirstMessageConsumed,
  onStreamingChange,
  onRefreshConversations,
  sendRequestRef,
  stopRequestRef,
}: ChatSessionProps) {
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [messagesLoaded, setMessagesLoaded] = useState(!conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Transport — conversationId is static for this component's lifetime
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ conversationId, fundId }),
      }),
    [conversationId, fundId]
  )

  const {
    messages,
    sendMessage,
    stop,
    status,
    error,
    setMessages,
    clearError,
  } = useChat({
    // id is STATIC — never changes for this component instance
    id: conversationId ?? 'new-conversation',
    messages: initialMessages,
    transport,
    onFinish: () => {
      onRefreshConversations()
    },
    onError: (err: Error) => {
      console.error('Emma chat error:', err.message)
    },
  })

  const isStreaming = status === 'submitted' || status === 'streaming'

  // Sync streaming state to parent
  useEffect(() => {
    onStreamingChange(isStreaming)
  }, [isStreaming, onStreamingChange])

  // Expose send and stop functions to parent
  useEffect(() => {
    sendRequestRef.current = (text: string) => {
      sendMessage({ text })
    }
    stopRequestRef.current = stop
    return () => {
      sendRequestRef.current = null
      stopRequestRef.current = null
    }
  }, [sendRequestRef, stopRequestRef, sendMessage, stop])

  // Load messages for existing conversations
  useEffect(() => {
    if (!conversationId) return

    let cancelled = false

    async function loadMessages() {
      const msgs = await getConversationMessages(conversationId!)
      if (!cancelled) {
        setInitialMessages(msgs)
        setMessages(msgs)
        setMessagesLoaded(true)
      }
    }

    loadMessages()

    return () => {
      cancelled = true
    }
  }, [conversationId, setMessages])

  // Send first message on mount — waits for messagesLoaded to ensure load effect ran first
  const firstMessageSent = useRef(false)
  useEffect(() => {
    if (firstMessage && messagesLoaded && !firstMessageSent.current) {
      firstMessageSent.current = true
      sendMessage({ text: firstMessage })
      onFirstMessageConsumed()
    }
  }, [firstMessage, messagesLoaded, sendMessage, onFirstMessageConsumed])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Retry on error: re-send the last user message
  const handleRetry = useCallback(() => {
    clearError()
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'user')
    if (lastUserMsg) {
      const text = lastUserMsg.parts
        .filter(
          (p): p is Extract<UIMessage['parts'][number], { type: 'text' }> =>
            p.type === 'text'
        )
        .map((p) => p.text)
        .join('\n')
      if (text) {
        sendMessage({ text })
      }
    }
  }, [clearError, messages, sendMessage])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <span className="font-serif text-[32px] font-semibold tracking-tight text-[#F8FAFC] mb-3 select-none">
            Emma
          </span>
          <p className="text-sm text-[#64748B]">
            Your AI operating partner.
          </p>
          <p className="text-xs text-[#475569] mt-1">
            Ask about your fund, pipeline, investors, or portfolio.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <AIMessage key={message.id} message={message} />
      ))}

      {status === 'submitted' && (
        <div className="flex flex-col gap-2 max-w-[95%] animate-pulse">
          <div className="h-3 w-3/4 rounded bg-[#1E293B]" />
          <div className="h-3 w-1/2 rounded bg-[#1E293B]" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-800/30 px-3 py-2">
          <span className="text-xs text-red-400 flex-1">
            {error.message || 'Something went wrong'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
