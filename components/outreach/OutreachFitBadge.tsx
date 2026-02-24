interface OutreachFitBadgeProps {
  score: number
}

export default function OutreachFitBadge({ score }: OutreachFitBadgeProps) {
  const color = score >= 90 ? '#10B981' : score >= 80 ? '#57ACAF' : '#EAB308'

  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: 48, height: 4, background: '#1C3042', borderRadius: 2 }}>
        <div
          style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>
        {score}%
      </span>
    </div>
  )
}
