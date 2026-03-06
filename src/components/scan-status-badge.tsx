import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ScanRequestStatus } from '@/lib/supabase/types'

const statusConfig: Record<ScanRequestStatus, { label: string; className: string }> = {
  pending: {
    label: 'PENDING',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  scanning: {
    label: 'SCANNING',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  },
  completed: {
    label: 'COMPLETED',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  failed: {
    label: 'FAILED',
    className: 'bg-red-500/15 text-red-400 border-red-500/20',
  },
}

type Props = {
  status: ScanRequestStatus
  className?: string
}

export function ScanStatusBadge({ status, className }: Props) {
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
