export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-pulse">
      <div>
        <div className="h-3 w-48 bg-muted/40 rounded mb-2" />
        <div className="h-8 w-64 bg-muted/40 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-border/50 bg-muted/20" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-lg border border-border/50 bg-muted/20" />
        <div className="h-64 rounded-lg border border-border/50 bg-muted/20" />
      </div>
    </div>
  )
}
