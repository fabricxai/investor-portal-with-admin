import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  accent?: string  // color for top accent bar
  glow?: boolean   // enable hover glow in admin dark theme
}

export default function Card({ children, className, padding = true, accent, glow }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        glow && 'admin-card',
        className
      )}
    >
      {accent && (
        <div className="h-[2px]" style={{ background: accent }} />
      )}
      <div className={cn(padding && 'p-6')}>
        {children}
      </div>
    </div>
  )
}
