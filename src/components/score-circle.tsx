type ScoreCircleProps = {
  score: number
  size?: number
}

function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444'
  if (score <= 70) return '#f59e0b'
  return '#10b981'
}

export function ScoreCircle({ score, size = 80 }: ScoreCircleProps) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        {/* Foreground arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute font-bold tabular-nums"
        style={{ color, fontSize: size * 0.28, lineHeight: 1 }}
      >
        {score}
      </span>
    </div>
  )
}
