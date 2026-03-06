'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Search, Loader2 } from 'lucide-react'

export default function ScanPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmed = url.trim()
    if (!trimmed) return

    // Basic client-side validation
    let testUrl: string
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      if (!parsed.hostname.includes('.')) throw new Error()
      testUrl = parsed.toString()
    } catch {
      setError('Please enter a valid URL (e.g. example.com)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/public/scan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testUrl,
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      router.push(`/scan/status/${data.id}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-bold text-lg leading-none">Q</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          QualityShield
        </span>
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-2xl shadow-black/20">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          Free Website Audit
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
          Enter your website URL and get a comprehensive quality report in ~5 minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="text-base h-12"
              autoComplete="url"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Name (optional)"
              className="text-sm h-10"
              autoComplete="name"
            />
            <Input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email (optional)"
              className="text-sm h-10"
              type="email"
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full h-11 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Start Free Audit'
            )}
          </Button>
        </form>

        <Separator className="my-6" />

        <div className="space-y-1 text-center">
          <p className="text-xs text-muted-foreground/70">
            No signup required. Results in ~5 minutes.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Limited to 3 scans per day.
          </p>
        </div>
      </div>
    </div>
  )
}
