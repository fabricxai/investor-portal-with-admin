import type { OutreachPipelineStatus } from '@/lib/types'
import { STAGE_COLORS } from '@/lib/outreach-email'

interface StagePillProps {
  stage: OutreachPipelineStatus
}

export default function StagePill({ stage }: StagePillProps) {
  const color = STAGE_COLORS[stage] || '#3A5060'

  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1,
        padding: '2px 8px',
        borderRadius: 20,
        background: `${color}20`,
        color,
        border: `1px solid ${color}50`,
        textTransform: 'uppercase',
        display: 'inline-block',
      }}
    >
      {stage}
    </span>
  )
}
