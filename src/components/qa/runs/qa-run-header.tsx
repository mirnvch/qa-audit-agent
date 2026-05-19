import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { QaRunRow } from '@/lib/qa/run-schema'

type Props = {
  run: QaRunRow
  projectName: string
}

function fmtDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

const kindStyles = {
  daily: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  nightly: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'ad-hoc': 'bg-muted/40 text-muted-foreground border-border',
} as const

/**
 * PC-style report header: eyebrow + serif title + meta strip with
 * environment, kind, branch, commit, build URL, and totals. Back link
 * returns to the runs list.
 */
export function QaRunHeader({ run, projectName }: Props) {
  const startTime = fmtDateTime(run.started_at)
  return (
    <header className="border-b pb-5 space-y-3">
      <Link
        href="/qa-reports/runs"
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-3 w-3" /> Back to runs
      </Link>

      <div className="flex items-baseline gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
        <span>{projectName}</span>
        <span>·</span>
        <span>{run.env}</span>
        <span>·</span>
        <span
          className={`px-2 py-0.5 rounded-full border font-semibold ${kindStyles[run.kind]}`}
        >
          {run.kind}
        </span>
      </div>

      <h1
        className="text-3xl md:text-4xl font-semibold tracking-tight"
        style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
      >
        {projectName} {run.kind} test run
      </h1>

      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Executed
          </span>
          <span className="font-medium">{startTime} UTC</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Duration
          </span>
          <span className="font-medium tabular-nums">{fmtDuration(run.duration_ms)}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Branch
          </span>
          <span
            className="font-medium"
            style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
          >
            {run.branch}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Commit
          </span>
          <span
            className="font-medium tabular-nums"
            style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
          >
            {run.commit_sha.slice(0, 7)}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Pipeline
          </span>
          <span
            className="font-medium"
            style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
          >
            {run.pipeline}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Run ID
          </span>
          <span
            className="font-medium text-muted-foreground"
            style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
          >
            {run.run_id}
          </span>
        </div>
        {run.build_url && (
          <a
            href={run.build_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          >
            Pipeline <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <span className="tabular-nums">{run.total}</span> checks ·{' '}
        <span className="tabular-nums text-green-400">{run.passed} passed</span> ·{' '}
        <span className={`tabular-nums ${run.failed > 0 ? 'text-red-400' : ''}`}>
          {run.failed} failed
        </span>{' '}
        · <span className="tabular-nums">{run.skipped} skipped</span> ·{' '}
        <span className="tabular-nums">{run.flaky} flaky</span>
      </div>
    </header>
  )
}
