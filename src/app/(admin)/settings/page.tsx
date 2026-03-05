export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          Section · Coming Soon
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="flex items-center justify-center min-h-[400px] border border-dashed border-border/50 rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-lg">Coming Soon</p>
          <p className="text-muted-foreground/60 text-sm max-w-md">
            Configure your account, Supabase connection, email integration, and notification preferences.
          </p>
        </div>
      </div>
    </div>
  )
}
