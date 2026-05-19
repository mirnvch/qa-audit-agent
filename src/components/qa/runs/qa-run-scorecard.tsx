import type { QaRunTotals } from '@/lib/qa/run-schema'

type Props = {
  totals: QaRunTotals
}

type Cell = {
  label: string
  value: number
  description: string
  color: string
}

/**
 * Five big-number cards (Total / Passed / Failed / Skipped / Flaky) — direct
 * port of the PC Data Health Scorecard at the top of the integrity report.
 * Numbers are large, serif-styled via Fraunces (scoped via the runs layout
 * font CSS var).
 */
export function QaRunScorecard({ totals }: Props) {
  const cells: Cell[] = [
    { label: 'Total', value: totals.total, description: 'Tests executed in this run', color: 'text-foreground' },
    { label: 'Passed', value: totals.passed, description: 'Met expected behavior', color: 'text-green-400' },
    { label: 'Failed', value: totals.failed, description: 'One or more assertions failed', color: 'text-red-400' },
    { label: 'Skipped', value: totals.skipped, description: 'Not executed in this run', color: 'text-muted-foreground' },
    { label: 'Flaky', value: totals.flaky, description: 'Recovered after retry', color: 'text-yellow-400' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cells.map((c) => (
        <div key={c.label} className="rounded-lg border bg-card p-4 space-y-1.5">
          <div
            className={`text-3xl md:text-4xl font-semibold tabular-nums tracking-tight ${c.color}`}
            style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
          >
            {c.value}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground/70">
            {c.label}
          </div>
          <div className="text-xs text-muted-foreground/80 leading-snug">{c.description}</div>
        </div>
      ))}
    </div>
  )
}
