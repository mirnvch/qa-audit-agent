import Link from 'next/link'

export default function AccessDeniedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md space-y-4">
        <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/50">
          Access Denied
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          You don't have permission to access this page
        </h1>
        <p className="text-sm text-muted-foreground">
          Contact your administrator to request access.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 px-4 py-2 text-sm font-medium rounded-md bg-muted/50 hover:bg-muted transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
