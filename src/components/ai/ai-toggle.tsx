'use client'

import { useEffect } from 'react'
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
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`hidden lg:flex items-center h-8 px-2 rounded-md transition-colors hover:bg-[#334155] ${
        isOpen ? 'opacity-100' : 'opacity-60 hover:opacity-100'
      }`}
      aria-label="Toggle Emma AI"
    >
      <span
        className="font-serif text-[15px] tracking-tight select-none"
        style={{ color: isOpen ? '#3E5CFF' : '#F8FAFC' }}
      >
        <span className="font-semibold">Emma</span>
      </span>
    </button>
  )
}
