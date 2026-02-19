'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getConversations } from '@/lib/actions/ai-conversations'

const STORAGE_KEY = 'blackgem-ai-open'

export interface Conversation {
  id: string
  title: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

interface AICopilotContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  currentConversationId: string | null
  setCurrentConversationId: (id: string | null) => void
  conversations: Conversation[]
  isFirstTime: boolean
  isEnabled: boolean
  fundId: string
  refreshConversations: () => Promise<void>
}

const AICopilotContext = createContext<AICopilotContextValue | null>(null)

export function useAICopilot(): AICopilotContextValue {
  const context = useContext(AICopilotContext)
  if (!context) {
    throw new Error('useAICopilot must be used within AICopilotProvider')
  }
  return context
}

interface AICopilotProviderProps {
  children: ReactNode
  isEnabled: boolean
  fundId: string
}

export function AICopilotProvider({
  children,
  isEnabled,
  fundId,
}: AICopilotProviderProps) {
  const [isOpen, setIsOpenState] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(open))
    } catch {
      // localStorage may not be available
    }
  }, [])

  const refreshConversations = useCallback(async () => {
    if (!isEnabled) return
    try {
      const result = await getConversations(fundId)
      setConversations(result)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }, [isEnabled, fundId])

  // Restore open state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setIsOpenState(JSON.parse(stored) === true)
      }
    } catch {
      // localStorage may not be available
    }
  }, [])

  // Fetch conversations on mount
  useEffect(() => {
    if (!isEnabled) return

    refreshConversations().then(() => {
      setHasLoaded(true)
    })
  }, [isEnabled, refreshConversations])

  // Auto-open for first-time users once conversations are loaded
  const isFirstTime = hasLoaded && conversations.length === 0

  useEffect(() => {
    if (isFirstTime) {
      setIsOpen(true)
    }
  }, [isFirstTime, setIsOpen])

  const value = useMemo<AICopilotContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      currentConversationId,
      setCurrentConversationId,
      conversations,
      isFirstTime,
      isEnabled,
      fundId,
      refreshConversations,
    }),
    [
      isOpen,
      setIsOpen,
      currentConversationId,
      conversations,
      isFirstTime,
      isEnabled,
      fundId,
      refreshConversations,
    ]
  )

  return (
    <AICopilotContext.Provider value={value}>
      {children}
    </AICopilotContext.Provider>
  )
}
