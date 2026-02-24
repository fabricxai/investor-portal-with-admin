interface OutreachAvatarProps {
  initials: string | null
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function OutreachAvatar({ initials, color = '#57ACAF', size = 'md' }: OutreachAvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center font-bold shrink-0`}
      style={{
        backgroundColor: `${color}22`,
        border: `1px solid ${color}55`,
        color,
      }}
    >
      {initials || '??'}
    </div>
  )
}
