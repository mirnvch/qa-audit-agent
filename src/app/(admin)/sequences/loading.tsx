export default function SequencesLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-40 rounded bg-muted/40 animate-pulse" />
          <div className="h-8 w-48 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted/40 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="border-b border-border/50 px-4 py-3">
          <div className="flex gap-8">
            <div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted/30 animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-border/30 px-4 py-4">
            <div className="flex items-center gap-8">
              <div className="h-4 w-40 rounded bg-muted/30 animate-pulse" />
              <div className="h-4 w-8 rounded bg-muted/30 animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted/30 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
