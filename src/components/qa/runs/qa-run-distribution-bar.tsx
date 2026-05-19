import type { QaRunTotals } from '@/lib/qa/run-schema'

type Props = {
  totals: QaRunTotals
  /** Optional heading text rendered above the bar. */
  caption?: string
  /** Optional sub-text rendered to the right of the heading. */
  sub?: string
}

function pct(n: number, total: number): string {
  if (total === 0) return '0.0'
  return ((n / total) * 100).toFixed(1)
}

/**
 * Segmented pass/fail/skip bar with a legend. Mirrors the PC
 * "Test result distribution" card. Colors match the PC palette
 * via existing admin tailwind tokens.
 */
export function QaRunDistributionBar({ totals, caption, sub }: Props) {
  const total = totals.total
  const passW = pct(totals.passed, total)
  const failW = pct(totals.failed, total)
  const skipW = pct(totals.skipped, total)

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      {caption && (
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">{caption}</span>
          {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
        </div>
      )}

      <div
        className="h-6 rounded-md overflow-hidden flex bg-muted/30"
        role="img"
        aria-label={`${totals.passed} passed, ${totals.failed} failed, ${totals.skipped} skipped`}
      >
        {totals.passed > 0 && (
          <div
            className="bg-green-500/80"
            style={{ width: `${passW}%` }}
            title={`${totals.passed} passed · ${passW}%`}
          />
        )}
        {totals.failed > 0 && (
          <div
            className="bg-red-500/80"
            style={{ width: `${failW}%` }}
            title={`${totals.failed} failed · ${failW}%`}
          />
        )}
        {totals.skipped > 0 && (
          <div
            className="bg-muted-foreground/30"
            style={{ width: `${skipW}%` }}
            title={`${totals.skipped} skipped · ${skipW}%`}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500/80" />
          <strong className="text-foreground tabular-nums">{totals.passed}</strong>
          <span>passed · {passW}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500/80" />
          <strong className="text-foreground tabular-nums">{totals.failed}</strong>
          <span>failed · {failW}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
          <strong className="text-foreground tabular-nums">{totals.skipped}</strong>
          <span>skipped · {skipW}%</span>
        </div>
        {totals.flaky > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-500/80" />
            <strong className="text-foreground tabular-nums">{totals.flaky}</strong>
            <span>flaky</span>
          </div>
        )}
      </div>
    </div>
  )
}
