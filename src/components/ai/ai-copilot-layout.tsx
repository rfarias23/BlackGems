'use client'

import { useAICopilot } from './ai-copilot-provider'
import { AICopilot } from './ai-copilot'

/**
 * Renders the AI panel fixed to the right side of the viewport.
 * - Tablet (md–lg): overlays with a backdrop
 * - Desktop (lg+): side-by-side, content pushes left
 */
export function AICopilotPanel() {
  const { isOpen, isEnabled, setIsOpen } = useAICopilot()

  if (!isEnabled || !isOpen) return null

  return (
    <>
      {/* Tablet backdrop (md–lg only) — closes panel on click */}
      <div
        className="fixed inset-0 z-30 bg-black/50 hidden md:block lg:hidden"
        onClick={() => setIsOpen(false)}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-40 hidden md:flex">
        <AICopilot />
      </div>
    </>
  )
}

/**
 * Wraps main content and applies right padding when the AI panel is open.
 * Padding only applies at lg+ (desktop) where the panel is side-by-side.
 * On tablet (md–lg), the panel overlays without pushing content.
 */
export function AICopilotContentWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen, isEnabled } = useAICopilot()

  const showPanel = isEnabled && isOpen

  return (
    <div
      className={`md:pl-64 flex flex-col min-h-screen transition-[padding] duration-200 ${
        showPanel ? 'lg:pr-[400px]' : ''
      }`}
    >
      {children}
    </div>
  )
}
