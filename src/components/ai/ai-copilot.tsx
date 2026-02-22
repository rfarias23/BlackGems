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
import { ChevronDown, Plus, Send, X, RotateCcw } from 'lucide-react'
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

  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const conversationIdRef = useRef(currentConversationId)

  // Keep the ref in sync
  useEffect(() => {
    conversationIdRef.current = currentConversationId
  }, [currentConversationId])

  // Build transport with conversation context
  // Using a function for body so it reads the latest conversationId at send time
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ conversationId: conversationIdRef.current, fundId }),
      }),
    [fundId]
  )

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
    clearError,
  } = useChat({
    id: currentConversationId ?? undefined,
    messages: initialMessages,
    transport,
    onFinish: () => {
      refreshConversations()
    },
    onError: (err: Error) => {
      console.error('[AI:DIAG:CLIENT] Chat error:', {
        message: err.message,
        name: err.name,
        cause: (err as unknown as Record<string, unknown>).cause,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      })
    },
  })

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversationId) {
      setInitialMessages([])
      setMessages([])
      return
    }

    let cancelled = false

    async function loadMessages() {
      const msgs = await getConversationMessages(currentConversationId!)
      if (!cancelled) {
        setInitialMessages(msgs)
        setMessages(msgs)
      }
    }

    loadMessages()

    return () => {
      cancelled = true
    }
  }, [currentConversationId, setMessages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to complete
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

  // Handle send
  const handleSend = useCallback(async () => {
    const text = inputValue.trim()
    if (!text) return
    if (status !== 'ready') return

    if (!fundId) {
      setSendError('No fund configured. Go to Settings to set up your fund.')
      return
    }

    // If no conversation exists, create one first
    let conversationId = currentConversationId
    if (!conversationId) {
      try {
        const conv = await createConversation(fundId)
        conversationId = conv.id
        conversationIdRef.current = conversationId
        setCurrentConversationId(conversationId)
      } catch (err) {
        console.error('Failed to create conversation:', err)
        setSendError('Failed to start conversation. Please try again.')
        return
      }
    }

    setInputValue('')
    setSendError(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    sendMessage({ text })
    console.log('[AI:DIAG:CLIENT] Message sent', {
      conversationId: conversationIdRef.current,
      fundId,
      textLength: text.length,
    })
  }, [
    inputValue,
    status,
    currentConversationId,
    fundId,
    setCurrentConversationId,
    sendMessage,
  ])

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
    setInitialMessages([])
    setMessages([])
    setInputValue('')
    setSendError(null)
  }, [setCurrentConversationId, setMessages])

  // Switch conversation
  const handleSwitchConversation = useCallback(
    (id: string) => {
      setCurrentConversationId(id)
      setSendError(null)
    },
    [setCurrentConversationId]
  )

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

  // Current conversation title
  const currentTitle = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)?.title ??
      'New Conversation'
    : 'New Conversation'

  const isStreaming = status === 'submitted' || status === 'streaming'

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
                    <span className="truncate">
                      {conv.title ?? 'Untitled'}
                    </span>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <span className="font-serif text-[32px] font-semibold tracking-tight text-[#F8FAFC] mb-3 select-none">
              Gema
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] animate-pulse">
              Thinking...
            </span>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="h-7 w-7 shrink-0 bg-[#3E5CFF] text-white hover:bg-[#3E5CFF]/90 disabled:opacity-30 disabled:bg-[#3E5CFF]/50"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
