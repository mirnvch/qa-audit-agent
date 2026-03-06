import { createClient } from '@/lib/supabase/server'
import { PasswordForm } from '@/components/password-form'
import { ThemeSelector } from '@/components/theme-selector'
import { EmbedCode } from '@/components/embed-code'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-2xl">
      <div>
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          Section 06 · Settings
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        <div className="rounded-lg border border-border/50 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono text-xs">{user?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{user?.id ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Sign In</span>
            <span className="font-mono text-xs">
              {user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : '—'}
            </span>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Security</h2>
        <div className="rounded-lg border border-border/50 p-4">
          <PasswordForm />
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
        <div className="rounded-lg border border-border/50 p-4">
          <ThemeSelector />
        </div>
      </section>

      {/* Embed Widget */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Embed Widget</h2>
        <div className="rounded-lg border border-border/50 p-4">
          <EmbedCode />
        </div>
      </section>
    </div>
  )
}
