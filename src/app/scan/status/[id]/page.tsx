'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

type ScanStatus = {
  status: 'pending' | 'scanning' | 'completed' | 'failed'
  reportCode?: string
  error?: string
}

export default function ScanStatusPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ScanStatus | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [pollLimitReached, setPollLimitReached] = useState(false)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/scan-requests/${id}`)
      if (!res.ok) {
        setFetchError(true)
        return
      }
      const json: ScanStatus = await res.json()
      setData(json)
      return json.status
    } catch {
      setFetchError(true)
    }
  }, [id])

  useEffect(() => {
    const MAX_POLLS = 150

    poll()
    setPollCount(1)

    const interval = setInterval(async () => {
      setPollCount((prev) => {
        const next = prev + 1
        if (next >= MAX_POLLS) {
          clearInterval(interval)
          setPollLimitReached(true)
        }
        return next
      })

      const status = await poll()
      if (status === 'completed' || status === 'failed') {
        clearInterval(interval)
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [poll])

  if (fetchError) {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Logo />
        <StatusCard>
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Scan Not Found</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            This scan request doesn&apos;t exist or has expired.
          </p>
          <Button className="w-full" onClick={() => router.push('/scan')}>
            Start New Scan
          </Button>
        </StatusCard>
      </div>
    )
  }

  if (!data || data.status === 'pending' || data.status === 'scanning') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Logo />
        <StatusCard>
          <div className="flex justify-center mb-6">
            <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-center mb-2">
            {data?.status === 'scanning' ? 'Scanning Your Website...' : 'In Queue...'}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {data?.status === 'scanning'
              ? 'Our AI is analyzing your website. This usually takes ~5 minutes.'
              : 'Your scan is queued and will start shortly.'}
          </p>
          {pollLimitReached ? (
            <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-200 text-center">
                Scan is taking longer than expected. Please refresh the page.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Auto-refreshing every 8 seconds
            </div>
          )}
        </StatusCard>
      </div>
    )
  }

  if (data.status === 'failed') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Logo />
        <StatusCard>
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Scan Failed</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {data.error || 'Something went wrong during the scan. Please try again.'}
          </p>
          <Button className="w-full" onClick={() => router.push('/scan')}>
            Try Again
          </Button>
        </StatusCard>
      </div>
    )
  }

  // completed
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      <Logo />
      <StatusCard>
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-center mb-2">Scan Complete!</h2>
        <p className="text-sm text-muted-foreground text-center mb-2">
          Your report is ready. Access code:
        </p>
        <p className="text-2xl font-mono font-bold text-center text-foreground mb-6">
          {data.reportCode}
        </p>
        <Button
          className="w-full h-11 font-medium"
          onClick={() => router.push(`/r/${data.reportCode}`)}
        >
          View Report
        </Button>
      </StatusCard>
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <span className="text-white font-bold text-lg leading-none">Q</span>
      </div>
      <span className="text-xl font-semibold tracking-tight text-foreground">
        QualityShield
      </span>
    </div>
  )
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-2xl shadow-black/20">
      {children}
    </div>
  )
}
