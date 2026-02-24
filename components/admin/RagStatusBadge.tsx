import { cn } from '@/lib/utils'
import { Check, Loader2, X } from 'lucide-react'

interface RagStatusBadgeProps {
  isInRag: boolean
  chunkCount: number
  className?: string
}

export default function RagStatusBadge({ isInRag, chunkCount, className }: RagStatusBadgeProps) {
  if (isInRag && chunkCount > 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-green-600', className)}>
        <Check className="h-3.5 w-3.5" />
        {chunkCount} chunks
      </span>
    )
  }

  if (!isInRag && chunkCount === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-muted', className)}>
        <X className="h-3.5 w-3.5" />
        Not indexed
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-yellow-600', className)}>
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Indexing...
    </span>
  )
}
