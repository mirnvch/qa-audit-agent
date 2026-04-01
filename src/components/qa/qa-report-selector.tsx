'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { QaReportHistoryItem } from '@/lib/qa/schema'

type Props = {
  history: QaReportHistoryItem[]
  currentReportId: string
}

export function QaReportSelector({ history, currentReportId }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  if (history.length <= 1) return null

  return (
    <select
      value={currentReportId}
      onChange={(e) => {
        const id = e.target.value
        // First item = latest, navigate to clean URL
        if (id === history[0]?.id) {
          router.push(pathname)
        } else {
          router.push(`${pathname}?report=${id}`)
        }
      }}
      className="text-sm bg-card border border-border rounded-md px-3 py-1.5 text-foreground"
    >
      {history.map((h) => (
        <option key={h.id} value={h.id}>
          {formatPeriod(h.period_from, h.period_to)}
        </option>
      ))}
    </select>
  )
}

function formatPeriod(from: string, to: string): string {
  const f = new Date(from)
  const t = new Date(to)
  const fmtOpts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }
  const fromStr = f.toLocaleDateString('en-US', fmtOpts)
  const toStr = t.toLocaleDateString('en-US', { ...fmtOpts, day: 'numeric' })
  return `${fromStr} - ${toStr}`
}
