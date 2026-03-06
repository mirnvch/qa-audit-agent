'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

type ScanStatus = 'idle' | 'submitting' | 'pending' | 'scanning' | 'completed' | 'failed'

function ScanWidget() {
  const searchParams = useSearchParams()
  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light'
  const accent = searchParams.get('accent') ?? '#6366f1'
  const ref = searchParams.get('ref') ?? ''

  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [error, setError] = useState('')
  const [scanId, setScanId] = useState<string | null>(null)
  const [reportCode, setReportCode] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)

  const isDark = theme === 'dark'
  const bg = isDark ? '#0a0a0f' : '#ffffff'
  const textPrimary = isDark ? '#f0f0f5' : '#1a1a2e'
  const textSecondary = isDark ? '#8888a0' : '#6b7280'
  const borderColor = isDark ? '#1f1f30' : '#e5e7eb'
  const inputBg = isDark ? '#12121d' : '#f9fafb'

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/public/scan-requests/${id}`)
      if (!res.ok) return

      const data = await res.json() as {
        status: string
        error?: string
        reportCode?: string
        score?: number
      }

      if (data.status === 'scanning') {
        setStatus('scanning')
      } else if (data.status === 'completed') {
        setStatus('completed')
        if (data.reportCode) setReportCode(data.reportCode)
        if (data.score != null) setScore(data.score)
        return
      } else if (data.status === 'failed') {
        setStatus('failed')
        setError(data.error ?? 'Scan failed. Please try again.')
        return
      }

      setTimeout(() => pollStatus(id), 3000)
    } catch {
      setTimeout(() => pollStatus(id), 5000)
    }
  }, [])

  useEffect(() => {
    if (scanId && (status === 'pending' || status === 'scanning')) {
      const timer = setTimeout(() => pollStatus(scanId), 3000)
      return () => clearTimeout(timer)
    }
  }, [scanId, status, pollStatus])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('submitting')

    try {
      const res = await fetch('/api/public/scan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          contactName: name || undefined,
          contactEmail: email || undefined,
          ref: ref || undefined,
        }),
      })

      const data = await res.json() as { id?: string; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        setStatus('idle')
        return
      }

      if (data.id) {
        setScanId(data.id)
        setStatus('pending')
      }
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div
      style={{ backgroundColor: bg, color: textPrimary, minHeight: '100vh' }}
      className="flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accent }}
          >
            <span className="text-white font-bold text-sm leading-none">Q</span>
          </div>
          <span className="text-base font-semibold tracking-tight" style={{ color: textPrimary }}>
            QA Camp
          </span>
        </div>

        {/* Form / Status */}
        {status === 'idle' || status === 'submitting' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  color: textPrimary,
                }}
              />
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  color: textPrimary,
                }}
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  color: textPrimary,
                }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: accent }}
            >
              {status === 'submitting' ? 'Submitting...' : 'Run Free Audit'}
            </button>
          </form>
        ) : (
          <div
            className="rounded-xl p-6 text-center space-y-4"
            style={{ border: `1px solid ${borderColor}` }}
          >
            {status === 'pending' && (
              <>
                <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: accent }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: textPrimary }}>
                    Queued for scanning
                  </p>
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>
                    Your site will be audited shortly...
                  </p>
                </div>
              </>
            )}

            {status === 'scanning' && (
              <>
                <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: accent }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: textPrimary }}>
                    Scanning in progress
                  </p>
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>
                    Checking pages, SEO, accessibility, performance...
                  </p>
                </div>
              </>
            )}

            {status === 'completed' && (
              <>
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
                <div>
                  <p className="font-medium text-sm" style={{ color: textPrimary }}>
                    Audit Complete
                  </p>
                  {score != null && (
                    <p className="text-2xl font-bold mt-2" style={{ color: accent }}>
                      {score}/100
                    </p>
                  )}
                </div>
                {reportCode && (
                  <a
                    href={`${origin}/r/${reportCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    View Full Report
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </>
            )}

            {status === 'failed' && (
              <>
                <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                <div>
                  <p className="font-medium text-sm" style={{ color: textPrimary }}>
                    Scan Failed
                  </p>
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStatus('idle')
                    setError('')
                    setScanId(null)
                  }}
                  className="text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: accent }}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs" style={{ color: textSecondary }}>
          Powered by{' '}
          <a
            href="https://qacamp.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
            style={{ color: accent }}
          >
            QA Camp
          </a>
        </p>
      </div>
    </div>
  )
}

export default function EmbedScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <ScanWidget />
    </Suspense>
  )
}
