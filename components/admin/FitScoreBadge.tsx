import { cn } from '@/lib/utils'

interface FitScoreBadgeProps {
  score: number | null
  className?: string
}

export default function FitScoreBadge({ score, className }: FitScoreBadgeProps) {
  if (score === null) {
    return (
      <span className={cn('text-xs text-muted', className)}>Pending</span>
    )
  }

  const color = score >= 7 ? 'text-green-400 bg-green-500/15' :
                score >= 5 ? 'text-yellow-400 bg-yellow-500/15' :
                'text-red-400 bg-red-500/15'

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold',
      color,
      className
    )}>
      {score}/10
    </span>
  )
}
