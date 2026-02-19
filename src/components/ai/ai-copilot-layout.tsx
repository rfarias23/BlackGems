'use client'

import { useAICopilot } from './ai-copilot-provider'
import { AICopilot } from './ai-copilot'

/**
 * Renders the AI panel fixed to the right side of the viewport.
 * Only mounts when AI is enabled and user has the panel open.
 */
export function AICopilotPanel() {
  const { isOpen, isEnabled } = useAICopilot()

  if (!isEnabled || !isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-40 hidden lg:flex">
      <AICopilot />
    </div>
  )
}

/**
 * Wraps main content and applies right padding when the AI panel is open.
 * This ensures the main content doesn't get obscured by the fixed panel.
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
      className="md:pl-64 flex flex-col min-h-screen transition-[padding] duration-200"
      style={{ paddingRight: showPanel ? 400 : 0 }}
    >
      {children}
    </div>
  )
}
