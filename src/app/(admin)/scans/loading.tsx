export default function ScansLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-3 w-48 bg-muted/40 rounded mb-2" />
          <div className="h-8 w-40 bg-muted/40 rounded" />
        </div>
        <div className="h-9 w-64 rounded-lg border border-border/50 bg-muted/20" />
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="h-10 border-b border-border/50 bg-muted/20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-border/50 bg-muted/10" />
        ))}
      </div>
    </div>
  )
}
