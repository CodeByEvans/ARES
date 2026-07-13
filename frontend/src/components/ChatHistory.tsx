import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { Message } from '../types'

interface ChatHistoryProps {
  messages: Message[]
  isLoading?: boolean
  onSend?: (text: string) => void
}

const suggestedPrompts = [
  '¿Qué puedes hacer?',
  'Cuéntame un dato interesante',
  '¿Cómo está el clima hoy?',
]

function SkeletonBubble() {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md animate-pulse"
        style={{ background: 'var(--app-surface)', minWidth: 180 }}
      >
        <div className="flex flex-col gap-2">
          <div className="h-3 rounded w-3/4" style={{ background: 'var(--app-border)' }} />
          <div className="h-3 rounded w-1/2" style={{ background: 'var(--app-border)' }} />
          <div className="h-3 rounded w-5/6" style={{ background: 'var(--app-border)' }} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--app-primary-muted)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--app-primary)" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--app-ink)' }}>
          ARES
        </h2>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--app-muted)' }}>
          Tu asistente de voz inteligente. Haz una pregunta o usa el micrófono.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="px-4 py-2 text-sm rounded-full border transition-colors cursor-pointer"
            style={{
              borderColor: 'var(--app-border)',
              color: 'var(--app-ink-secondary)',
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChatHistory({ messages, isLoading = false, onSend }: ChatHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  useEffect(() => {
    const items = containerRef.current?.querySelectorAll('.chat-item')
    if (items && items.length > 0) {
      const lastItem = items[items.length - 1] as HTMLElement
      const mm = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mm.matches) {
        lastItem.style.opacity = '1'
        lastItem.style.transform = 'none'
      } else {
        gsap.fromTo(lastItem, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 })
      }
    }
  }, [messages.length])

  if (messages.length === 0 && !isLoading) {
    return <EmptyState onPromptClick={(prompt) => onSend?.(prompt)} />
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`chat-item flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
            style={{
              background: msg.role === 'user' ? 'var(--app-primary)' : 'var(--app-surface)',
              color: msg.role === 'user' ? 'var(--app-primary-text)' : 'var(--app-ink)',
              borderBottomRightRadius: msg.role === 'user' ? '6px' : undefined,
              borderBottomLeftRadius: msg.role === 'user' ? undefined : '6px',
            }}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isLoading && <SkeletonBubble />}
      <div ref={endRef} />
    </div>
  )
}
