type StatCardProps = {
  label: string
  value: string | number
  subtitle: string
  color: 'white' | 'yellow' | 'blue' | 'green' | 'red'
}

const colorMap: Record<StatCardProps['color'], string> = {
  white: 'text-foreground',
  yellow: 'text-yellow-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
}

export function StatCard({ label, value, subtitle, color }: StatCardProps) {
  return (
    <div className="relative rounded-lg border bg-card p-5 flex flex-col justify-between min-h-[110px]">
      <span className="absolute top-4 right-4 text-[9px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
        {label}
      </span>
      <div>
        <div className={`text-4xl font-bold leading-none ${colorMap[color]}`}>
          {value}
        </div>
        <div className="mt-2 text-[11px] font-mono tracking-[0.1em] uppercase text-muted-foreground/70">
          {subtitle}
        </div>
      </div>
    </div>
  )
}
