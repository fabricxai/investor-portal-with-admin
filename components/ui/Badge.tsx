import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'tier0' | 'tier1' | 'tier2'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-white/10 text-white/70': variant === 'default',
          'bg-green-500/15 text-green-400': variant === 'success',
          'bg-yellow-500/15 text-yellow-400': variant === 'warning',
          'bg-red-500/15 text-red-400': variant === 'danger',
          'bg-blue-500/15 text-blue-400': variant === 'info',
          'bg-white/5 text-muted': variant === 'tier0',
          'bg-aqua/10 text-aqua': variant === 'tier1',
          'bg-green-500/15 text-green-400 ring-1 ring-green-500/20': variant === 'tier2',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
