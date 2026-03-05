import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ReportStatus } from '@/lib/supabase/types'

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  draft: {
    label: 'DRAFT',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
  sent: {
    label: 'SENT',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  viewed: {
    label: 'VIEWED',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  replied: {
    label: 'REPLIED',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  expired: {
    label: 'EXPIRED',
    className: 'bg-red-500/15 text-red-400 border-red-500/20',
  },
}

type Props = {
  status: ReportStatus
  className?: string
}

export function ReportStatusBadge({ status, className }: Props) {
  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono text-[10px] tracking-wider font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
