import type { QaRunRunner } from '@/lib/qa/run-schema'

type Props = {
  runners: QaRunRunner[]
}

function fmtDuration(ms?: number): string {
  if (ms == null || ms <= 0) return ''
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/**
 * Per-runner badge row (Playwright, Vitest, etc.). Nexus-specific addition
 * to the PC layout — replaces PC's pipeline-stage SVG with a thinner element
 * that documents which test runner contributed which slice of the run.
 */
export function QaRunRunnerRow({ runners }: Props) {
  if (runners.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {runners.map((r) => {
        const health =
          r.failed === 0 ? 'border-l-green-500/60' : r.failed >= 5 ? 'border-l-red-500/70' : 'border-l-yellow-500/70'
        return (
          <div
            key={r.name}
            className={`rounded-md border bg-card p-3 border-l-4 ${health}`}
          >
            <div className="flex items-baseline justify-between">
              <div className="font-medium capitalize">{r.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
                {fmtDuration(r.duration_ms)}
              </div>
            </div>
            <div className="mt-1 flex gap-3 text-xs text-muted-foreground tabular-nums">
              <span>
                <strong className="text-green-400">{r.passed}</strong> pass
              </span>
              <span>
                <strong className={r.failed > 0 ? 'text-red-400' : 'text-foreground'}>{r.failed}</strong> fail
              </span>
              <span>
                <strong className="text-foreground">{r.skipped}</strong> skip
              </span>
              {r.flaky > 0 && (
                <span>
                  <strong className="text-yellow-400">{r.flaky}</strong> flaky
                </span>
              )}
              <span className="ml-auto text-muted-foreground/60">{r.total} total</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
