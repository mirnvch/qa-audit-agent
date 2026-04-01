'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function CodeEntryPage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.toUpperCase()
    raw = raw.replace(/[^A-Z0-9-]/g, '')

    if (raw.length > 0 && !raw.startsWith('RPT-')) {
      if (raw.startsWith('R') || raw.startsWith('RP') || raw.startsWith('RPT')) {
        setValue(raw)
        return
      }
      raw = 'RPT-' + raw.replace(/^RPT-?/, '')
    }

    setValue(raw)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = value.trim()
    if (!code) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        setError(data.reason || 'Invalid access code')
        setLoading(false)
        return
      }

      router.push(`/r/${encodeURIComponent(data.code)}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-lg leading-none">Q</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            QACAMP
          </span>
        </div>

        {/* Subheading */}
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Complimentary Website Review
        </p>

        {/* Card */}
        <div className="w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-2xl shadow-black/20">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            View Your Report
          </h1>
          <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
            Enter the access code from your email to view your website quality report.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={value}
              onChange={handleChange}
              placeholder="RPT-XXXXXX"
              className="text-center font-mono tracking-widest uppercase text-base h-12"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !value.trim()}
              className="w-full h-11 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'View My Report'
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground/70">
              Your report is private and secure.
            </p>
            <p className="text-xs text-muted-foreground/50">
              Access codes expire after 14 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
