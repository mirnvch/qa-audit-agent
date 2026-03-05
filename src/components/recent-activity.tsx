type ActivityEntry = {
  id: string
  action: string
  details: string
  created_at: string
}

const dotColorMap: Record<string, string> = {
  replied: 'bg-green-400',
  viewed: 'bg-blue-400',
  sent: 'bg-amber-400',
  scanned: 'bg-muted-foreground/50',
  expired: 'bg-red-400',
  converted: 'bg-purple-400',
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function RecentActivity({ activities }: { activities: ActivityEntry[] }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60 mb-5">
        Recent Activity
      </h2>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
      ) : (
        <div className="space-y-4">
          {activities.map((entry) => {
            const dotColor = dotColorMap[entry.action] ?? 'bg-muted-foreground/50'
            return (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="mt-1.5 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90 leading-snug">{entry.details}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-[11px] font-mono text-muted-foreground/60 whitespace-nowrap">
                    {relativeTime(entry.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
