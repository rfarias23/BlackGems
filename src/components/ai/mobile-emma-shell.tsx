'use client'

import { useCallback } from 'react'
import { Plus, MoreVertical, ChevronDown, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAICopilot } from './ai-copilot-provider'
import { AICopilot } from './ai-copilot'
import { formatRelativeTime } from './ai-copilot'

export function MobileEmmaShell() {
  const {
    currentConversationId,
    setCurrentConversationId,
    conversations,
  } = useAICopilot()

  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null)
  }, [setCurrentConversationId])

  const handleSwitchConversation = useCallback(
    (id: string) => {
      setCurrentConversationId(id)
    },
    [setCurrentConversationId]
  )

  const currentTitle = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)?.title ??
      'New Conversation'
    : 'New Conversation'

  return (
    <div
      className="flex flex-col h-dvh w-full bg-[#080A0F]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Mobile header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#1E293B] shrink-0">
        {/* Left: Emma wordmark */}
        <span className="font-serif text-[20px] font-semibold tracking-tight text-[#F8FAFC] select-none">
          Emma
        </span>

        {/* Center: Conversation picker */}
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right: New conversation + overflow menu */}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155]"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 bg-[#1E293B] text-[#F8FAFC] border-[#334155]"
              align="end"
            >
              <DropdownMenuItem
                asChild
                className="focus:bg-[#334155] focus:text-[#F8FAFC] cursor-pointer"
              >
                <a href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#334155]" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-[#F8FAFC] focus:bg-[#334155] focus:text-[#F8FAFC] cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chat body — fills remaining height */}
      <div className="flex-1 min-h-0">
        <AICopilot variant="mobile" />
      </div>
    </div>
  )
}
