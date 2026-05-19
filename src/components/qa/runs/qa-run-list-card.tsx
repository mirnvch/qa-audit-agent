import Link from 'next/link'
import type { QaRunListItem } from '@/lib/qa/run-schema'

type Props = {
  run: QaRunListItem
}

function fmtDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.max(1, Math.floor(ms / 1000))
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(iso).toISOString().slice(0, 10)
}

const kindStyles = {
  daily: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  nightly: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'ad-hoc': 'bg-muted/40 text-muted-foreground border-border',
} as const

/**
 * List-view card for a single qa_run. Links to `/qa-reports/runs/<DB-UUID>`
 * — uses the database id, NOT the producer-supplied run_id (which is only
 * unique per project, not globally).
 */
function pct(n: number, total: number): number {
  if (total <= 0) return 0
  return (n / total) * 100
}

export function QaRunListCard({ run }: Props) {
  const failed = run.failed > 0
  const passRate = pct(run.passed, run.total)
  return (
    <Link
      href={`/qa-reports/runs/${run.id}`}
      className={`block rounded-md border bg-card p-4 hover:bg-muted/30 transition-colors ${
        failed ? 'border-l-4 border-l-red-500/60' : 'border-l-4 border-l-green-500/50'
      }`}
    >
      <div className="flex items-baseline gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
        <span className="font-semibold text-foreground/90">{run.project_name}</span>
        <span>·</span>
        <span>{run.env}</span>
        <span>·</span>
        <span
          className={`px-1.5 py-0.5 rounded border font-semibold ${kindStyles[run.kind]}`}
        >
          {run.kind}
        </span>
        <span className="ml-auto text-muted-foreground/60 normal-case tracking-normal">
          {relativeTime(run.started_at)}
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div
          className="text-sm font-medium truncate"
          style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
        >
          {run.run_id}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
          {fmtDuration(run.duration_ms)}
        </div>
      </div>

      <div className="mt-2 flex h-1 rounded-full overflow-hidden bg-muted/30">
        {run.passed > 0 && (
          <div className="bg-green-500/80" style={{ width: `${pct(run.passed, run.total)}%` }} />
        )}
        {run.failed > 0 && (
          <div className="bg-red-500/80" style={{ width: `${pct(run.failed, run.total)}%` }} />
        )}
        {run.skipped > 0 && (
          <div
            className="bg-muted-foreground/30"
            style={{ width: `${pct(run.skipped, run.total)}%` }}
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
        <span>
          <strong className="text-foreground">{run.total}</strong> total
        </span>
        <span className="text-green-400">
          <strong>{run.passed}</strong> passed
        </span>
        <span className={failed ? 'text-red-400' : ''}>
          <strong>{run.failed}</strong> failed
        </span>
        <span>
          <strong className="text-foreground">{run.skipped}</strong> skipped
        </span>
        {run.flaky > 0 && (
          <span className="text-yellow-400">
            <strong>{run.flaky}</strong> flaky
          </span>
        )}
        <span className="ml-auto text-muted-foreground/60">{passRate.toFixed(0)}% pass</span>
      </div>

      <div
        className="mt-2 text-[11px] text-muted-foreground/70"
        style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
      >
        {run.branch} @ {run.commit_sha.slice(0, 7)} · {run.pipeline}
      </div>
    </Link>
  )
}
