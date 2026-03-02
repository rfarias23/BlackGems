'use client'

import type { UIMessage, DynamicToolUIPart } from 'ai'
import { AIToolResult } from './ai-tool-result'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

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
            <div key={index} className="ai-markdown text-sm text-[#E2E8F0] break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {part.text}
              </ReactMarkdown>
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
// Markdown component overrides — dark theme, institutional styling
// ---------------------------------------------------------------------------

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[#F8FAFC]">{children}</strong>,
  em: ({ children }) => <em className="italic text-[#CBD5E1]">{children}</em>,
  h1: ({ children }) => <h1 className="text-base font-semibold text-[#F8FAFC] mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-semibold text-[#F8FAFC] mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-[#F8FAFC] mt-3 mb-1">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 last:mb-0 space-y-1 pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 last:mb-0 space-y-1 pl-4 list-decimal">{children}</ol>,
  li: ({ children }) => (
    <li className="relative pl-2 before:content-['–'] before:absolute before:-left-3 before:text-[#64748B]">
      {children}
    </li>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className={`block bg-[#0D1117] rounded px-3 py-2 text-[12px] font-mono text-[#E2E8F0] overflow-x-auto ${className ?? ''}`}>
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono tabular-nums text-[#F8FAFC] bg-[#1E293B] px-1 py-0.5 rounded text-[12px]">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="mb-3 last:mb-0 overflow-x-auto">{children}</pre>,
  table: ({ children }) => (
    <div className="mb-3 last:mb-0 overflow-x-auto rounded border border-[#334155]">
      <table className="w-full text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-[#334155] bg-[#1E293B]/50">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-[#E2E8F0] border-b border-[#334155]/50">{children}</td>,
  tr: ({ children }) => <tr className="hover:bg-[#1E293B]/30">{children}</tr>,
  hr: () => <hr className="my-3 border-[#334155]" />,
  a: ({ children, href }) => (
    <a href={href} className="text-[#3E5CFF] hover:text-[#3350E0] underline underline-offset-2" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 last:mb-0 border-l-2 border-[#334155] pl-3 text-[#94A3B8] italic">
      {children}
    </blockquote>
  ),
}
