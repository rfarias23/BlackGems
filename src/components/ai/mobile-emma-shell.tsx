'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, ChevronDown, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAICopilot } from './ai-copilot-provider'
import { AICopilot, formatRelativeTime } from './ai-copilot'
import type { AICopilotHandlers } from './ai-copilot'

export function MobileEmmaShell() {
  const {
    currentConversationId,
    conversations,
  } = useAICopilot()

  // Toggle html class for scoped iOS overscroll lock
  useEffect(() => {
    document.documentElement.classList.add('mobile-emma-active')
    return () => document.documentElement.classList.remove('mobile-emma-active')
  }, [])

  // Handlers owned by AICopilot (includes state resets + title editing)
  const handlersRef = useRef<AICopilotHandlers | null>(null)

  // Local mirror of editing state for re-renders
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const onExposeHandlers = useCallback((handlers: AICopilotHandlers) => {
    handlersRef.current = handlers
    // Sync editing state from AICopilot
    setIsEditingTitle(handlers.isEditingTitle)
    setEditTitleValue(handlers.editTitleValue)
  }, [])

  const handleNewConversation = useCallback(() => {
    handlersRef.current?.handleNewConversation()
  }, [])

  const handleSwitchConversation = useCallback(
    (id: string) => {
      handlersRef.current?.handleSwitchConversation(id)
    },
    []
  )

  const handleStartEditTitle = useCallback(() => {
    handlersRef.current?.handleStartEditTitle()
    setIsEditingTitle(true)
    setEditTitleValue(handlersRef.current?.editTitleValue ?? '')
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }, [])

  const handleSaveTitle = useCallback(async () => {
    // Sync local value to AICopilot before saving
    if (handlersRef.current) {
      handlersRef.current.setEditTitleValue(editTitleValue)
    }
    await handlersRef.current?.handleSaveTitle()
    setIsEditingTitle(false)
  }, [editTitleValue])

  const handleCancelEditTitle = useCallback(() => {
    handlersRef.current?.handleCancelEditTitle()
    setIsEditingTitle(false)
  }, [])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle()
    }
    if (e.key === 'Escape') {
      handleCancelEditTitle()
    }
  }, [handleSaveTitle, handleCancelEditTitle])

  const currentTitle = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)?.title ??
      'New Conversation'
    : 'New Conversation'

  return (
    <div
      className="flex flex-col h-dvh w-full bg-[#080A0F] overflow-hidden overscroll-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Mobile header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#1E293B] shrink-0">
        {/* Left: BlackGem wordmark */}
        <span className="font-serif text-[20px] font-semibold tracking-tight text-[#F8FAFC] select-none shrink-0">
          BlackGem
        </span>

        {/* Center: Conversation picker or inline title edit */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editTitleValue}
            onChange={(e) => {
              setEditTitleValue(e.target.value)
              handlersRef.current?.setEditTitleValue(e.target.value)
            }}
            onBlur={() => handleSaveTitle()}
            onKeyDown={handleTitleKeyDown}
            maxLength={100}
            className="text-sm text-[#F8FAFC] bg-[#1E293B] border border-[#3E5CFF] rounded px-2 py-2 outline-none flex-1 mx-3 min-w-0"
          />
        ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#F8FAFC] truncate max-w-[180px]">
              <span className="truncate">{currentTitle}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 bg-[#1E293B] text-[#F8FAFC] border-[#334155]"
            align="center"
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
            {currentConversationId && (
              <DropdownMenuItem
                onClick={handleStartEditTitle}
                className="focus:bg-[#334155] focus:text-[#F8FAFC] cursor-pointer text-xs text-[#64748B] border-t border-[#334155] mt-1 pt-2"
              >
                Rename conversation
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {/* Right: New conversation + sign out */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewConversation}
            className="h-8 w-8 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155]"
            aria-label="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="h-8 w-8 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat body — fills remaining height */}
      <div className="flex-1 min-h-0">
        <AICopilot variant="mobile" exposeHandlers={onExposeHandlers} />
      </div>
    </div>
  )
}
