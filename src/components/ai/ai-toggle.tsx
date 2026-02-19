'use client'

import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAICopilot } from './ai-copilot-provider'

export function AIToggle() {
  const { isOpen, setIsOpen, isEnabled } = useAICopilot()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

  if (!isEnabled) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsOpen(!isOpen)}
      className={`hidden lg:flex h-8 w-8 hover:bg-[#334155] ${
        isOpen ? 'text-[#3E5CFF]' : 'text-[#94A3B8]'
      }`}
      aria-label="Toggle AI copilot"
    >
      <MessageSquare className="h-4 w-4" />
    </Button>
  )
}
