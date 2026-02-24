import { cn } from '@/lib/utils'
import SourceCitation from './SourceCitation'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  sources?: { name: string; section?: string }[]
}

export default function MessageBubble({ role, content, sources }: MessageBubbleProps) {
  return (
    <div className={cn('flex', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          role === 'user'
            ? 'bg-aqua text-white rounded-br-md'
            : 'bg-white/10 text-foreground rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {role === 'assistant' && sources && <SourceCitation sources={sources} />}
      </div>
    </div>
  )
}
