'use client'

import { cn } from '@/lib/utils'

interface BlurredMetricCardProps {
  label: string
  value: string | number | null
  tier: 0 | 1 | 2
  alwaysShow?: boolean
  rangeValue?: string | null
  suffix?: string
  className?: string
}

export default function BlurredMetricCard({
  label,
  value,
  tier,
  alwaysShow = false,
  rangeValue,
  suffix,
  className,
}: BlurredMetricCardProps) {
  const showValue = alwaysShow || tier === 2
  const showRange = tier === 1 && rangeValue

  // Deterministic "random" width based on label to avoid hydration mismatch
  const blurWidth = 60 + ((label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 7) % 40)

  return (
    <div className={cn('rounded-xl border border-border bg-white p-5', className)}>
      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
        {label}
      </p>

      {showValue && value !== null ? (
        <p className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
          {value}{suffix && <span className="text-sm font-normal text-muted ml-1">{suffix}</span>}
        </p>
      ) : showRange ? (
        <p className="text-xl font-semibold text-navy/80" style={{ fontFamily: 'var(--font-heading)' }}>
          {rangeValue}
        </p>
      ) : (
        <div className="flex items-center gap-1 mt-1">
          <div className="h-7 bg-navy/10 rounded" style={{ width: `${blurWidth}%` }} />
        </div>
      )}
    </div>
  )
}
