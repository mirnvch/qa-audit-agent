import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type LeadStatus = 'need_followup' | 'active' | 'converted' | 'stale'

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  need_followup: {
    label: 'FOLLOW UP',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  active: {
    label: 'ACTIVE',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  converted: {
    label: 'CONVERTED',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  stale: {
    label: 'STALE',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
}

type Props = {
  status: LeadStatus
  className?: string
}

export function LeadStatusBadge({ status, className }: Props) {
  const config = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn('font-mono text-[10px] tracking-wider font-semibold', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
