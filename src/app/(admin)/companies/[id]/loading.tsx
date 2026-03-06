export default function CompanyDetailLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-24 bg-muted rounded" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
        <div className="h-6 w-20 bg-muted rounded" />
      </div>

      <div className="border-t border-border/50" />

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timeline skeleton */}
        <div className="space-y-4">
          <div className="h-3 w-16 bg-muted rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="h-4 w-4 bg-muted rounded" />
              <div className="flex-1 h-4 bg-muted rounded" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>

        {/* Reports skeleton */}
        <div className="space-y-4">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/30 last:border-b-0">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-5 w-14 bg-muted rounded" />
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="h-4 w-16 bg-muted rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
