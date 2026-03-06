export default function AnalyticsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <div className="h-3 w-32 bg-muted/40 rounded animate-pulse mb-2" />
        <div className="h-8 w-48 bg-muted/40 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-6 space-y-4"
          >
            <div className="h-4 w-36 bg-muted/40 rounded animate-pulse" />
            <div className="h-[300px] bg-muted/20 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
