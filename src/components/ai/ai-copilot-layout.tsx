'use client'

import { useAICopilot } from './ai-copilot-provider'
import { AICopilot } from './ai-copilot'

/**
 * Renders the AI panel fixed to the right side of the viewport.
 * - Tablet (md–xl): overlays with a backdrop
 * - Desktop (xl+): side-by-side, content pushes left
 */
export function AICopilotPanel() {
  const { isOpen, isEnabled, setIsOpen } = useAICopilot()

  if (!isEnabled || !isOpen) return null

  return (
    <>
      {/* Tablet backdrop (md–xl only) — closes panel on click */}
      <div
        className="fixed inset-0 z-30 bg-black/50 hidden md:block xl:hidden"
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
 * Wraps main content with viewport-height scroll containment.
 * - Left padding: xl+ (256px for sidebar); tablet has no left offset (sidebar is a drawer).
 * - Right padding: xl+ when AI panel is open (400px side-by-side).
 * - Height: h-dvh + overflow-hidden; scrolling is delegated to the inner <main>.
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
      className={`xl:pl-64 flex flex-col h-dvh overflow-hidden transition-[padding] duration-200 ${
        showPanel ? 'xl:pr-[400px]' : ''
      }`}
    >
      {children}
    </div>
  )
}
