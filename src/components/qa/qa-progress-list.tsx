import type { RecentProgress, AttentionItem } from '@/lib/qa/schema'
import { Check, AlertTriangle } from 'lucide-react'

type Props = {
  progress: RecentProgress | null
  attention: AttentionItem[]
}

export function QaProgressList({ progress, attention }: Props) {
  const hasProgress = progress && progress.items.length > 0
  const hasAttention = attention.length > 0

  if (!hasProgress && !hasAttention) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {hasProgress && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Recent progress ({progress.period_days} days)
          </h3>
          <div className="space-y-2">
            {progress.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {item.text}
                  {item.badge && (
                    <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                      {item.badge}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasAttention && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Needs attention</h3>
          <div className="space-y-2">
            {attention.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {item.text}
                  {item.badge && (
                    <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                      {item.badge}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
