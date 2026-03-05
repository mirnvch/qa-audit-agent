import { cn } from '@/lib/utils'

type Props = {
  critical: number
  moderate: number
  minor: number
  className?: string
}

export function SeverityChips({ critical, moderate, minor, className }: Props) {
  const total = critical + moderate + minor

  if (total === 0) {
    return <span className="text-muted-foreground/40 text-xs">—</span>
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1 flex-wrap">
        {critical > 0 && (
          <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/20 leading-none">
            {critical}C
          </span>
        )}
        {moderate > 0 && (
          <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 leading-none">
            {moderate}M
          </span>
        )}
        {minor > 0 && (
          <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border leading-none">
            {minor}
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-mono">
        {total} total
      </span>
    </div>
  )
}
