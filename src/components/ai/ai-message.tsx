'use client'

import type { UIMessage, DynamicToolUIPart } from 'ai'
import { AIToolResult } from './ai-tool-result'

interface AIMessageProps {
  message: UIMessage
}

export function AIMessage({ message }: AIMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} />
  }

  if (message.role === 'assistant') {
    return <AssistantMessage message={message} />
  }

  return null
}

// ---------------------------------------------------------------------------
// User message
// ---------------------------------------------------------------------------

function UserMessage({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter(
      (p): p is Extract<UIMessage['parts'][number], { type: 'text' }> =>
        p.type === 'text'
    )
    .map((p) => p.text)
    .join('\n')

  if (!text) return null

  return (
    <div className="flex justify-end">
      <div className="bg-[#1E2432] rounded-lg px-4 py-3 max-w-[85%]">
        <p className="text-sm text-[#F8FAFC] whitespace-pre-wrap break-words">
          {text}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assistant message
// ---------------------------------------------------------------------------

function AssistantMessage({ message }: { message: UIMessage }) {
  return (
    <div className="flex flex-col gap-1 max-w-[95%]">
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          if (!part.text) return null
          return (
            <div key={index} className="text-sm text-[#E2E8F0] whitespace-pre-wrap break-words">
              <FormattedText text={part.text} />
            </div>
          )
        }

        if (part.type === 'dynamic-tool') {
          return (
            <AIToolResult
              key={(part as DynamicToolUIPart).toolCallId}
              part={part as DynamicToolUIPart}
            />
          )
        }

        // Skip other part types (reasoning, source-url, step-start, etc.)
        return null
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Simple text formatter for financial values
// ---------------------------------------------------------------------------

const CURRENCY_REGEX = /\$[\d,]+(?:\.\d{1,2})?(?:[KMB])?/g
const PERCENT_REGEX = /\d+(?:\.\d{1,2})?%/g
const MULTIPLE_REGEX = /\d+(?:\.\d{1,2})?x\b/g

function FormattedText({ text }: { text: string }) {
  // Split text into segments, wrapping financial values in monospace spans
  const parts: Array<{ key: string; content: string; isMono: boolean }> = []
  let lastIndex = 0

  const allMatches: Array<{ start: number; end: number; text: string }> = []

  for (const regex of [CURRENCY_REGEX, PERCENT_REGEX, MULTIPLE_REGEX]) {
    regex.lastIndex = 0
    let match: RegExpExecArray | null = regex.exec(text)
    while (match !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      })
      match = regex.exec(text)
    }
  }

  // Sort by position and remove overlaps
  allMatches.sort((a, b) => a.start - b.start)
  const filtered: typeof allMatches = []
  for (const m of allMatches) {
    const prev = filtered[filtered.length - 1]
    if (!prev || m.start >= prev.end) {
      filtered.push(m)
    }
  }

  for (const m of filtered) {
    if (m.start > lastIndex) {
      parts.push({
        key: `text-${lastIndex}`,
        content: text.slice(lastIndex, m.start),
        isMono: false,
      })
    }
    parts.push({
      key: `mono-${m.start}`,
      content: m.text,
      isMono: true,
    })
    lastIndex = m.end
  }

  if (lastIndex < text.length) {
    parts.push({
      key: `text-${lastIndex}`,
      content: text.slice(lastIndex),
      isMono: false,
    })
  }

  if (parts.length === 0) {
    return <>{text}</>
  }

  return (
    <>
      {parts.map((p) =>
        p.isMono ? (
          <span key={p.key} className="font-mono tabular-nums text-[#F8FAFC]">
            {p.content}
          </span>
        ) : (
          <span key={p.key}>{p.content}</span>
        )
      )}
    </>
  )
}
