'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: { name: string; section?: string }[]
}

interface CopilotPanelProps {
  endpoint: string
  extraBody?: Record<string, unknown>
  placeholder?: string
  welcomeMessage?: string
}

export default function CopilotPanel({
  endpoint,
  extraBody = {},
  placeholder = 'Ask a question...',
  welcomeMessage,
}: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (welcomeMessage) {
      return [{ role: 'assistant', content: welcomeMessage }]
    }
    return []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingSources, setStreamingSources] = useState<{ name: string; section?: string }[]>([])
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText, scrollToBottom])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreamingText('')
    setStreamingSources([])

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m.role === 'user' || !m.sources)
            .map(m => ({ role: m.role, content: m.content })),
          sessionId,
          ...extraBody,
        }),
      })

      if (!res.ok) throw new Error('Copilot error')

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream') && res.body) {
        // Streaming SSE response
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullText = ''
        let sources: { name: string; section?: string }[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'sources') {
                sources = event.sources || []
                setStreamingSources(sources)
              } else if (event.type === 'text') {
                fullText += event.content
                setStreamingText(fullText)
              } else if (event.type === 'done') {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: fullText,
                  sources,
                }])
                setStreamingText('')
                setStreamingSources([])
              } else if (event.type === 'error') {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: event.message || 'An error occurred.',
                }])
                setStreamingText('')
                setStreamingSources([])
              }
            } catch {
              // Skip malformed events
            }
          }
        }

        // Handle case where stream ends without 'done' event
        if (fullText && !messages.some(m => m.content === fullText)) {
          setMessages(prev => {
            if (prev.some(m => m.content === fullText)) return prev
            return [...prev, { role: 'assistant', content: fullText, sources }]
          })
          setStreamingText('')
          setStreamingSources([])
        }
      } else {
        // Non-streaming JSON response (fallback)
        const data = await res.json()
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          sources: data.sources,
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
      setStreamingText('')
      setStreamingSources([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} {...msg} />
        ))}
        {/* Streaming message (in progress) */}
        {streamingText && (
          <MessageBubble
            role="assistant"
            content={streamingText}
            sources={streamingSources.length > 0 ? streamingSources : undefined}
          />
        )}
        {loading && !streamingText && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 rounded-lg border border-border bg-transparent text-foreground placeholder:text-[var(--color-dim)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg bg-aqua text-white hover:bg-aqua-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
