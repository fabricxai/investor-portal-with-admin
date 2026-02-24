export default function HunterLoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-aqua">HUNTER generating</span>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-aqua"
            style={{
              animation: 'hunter-pulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
