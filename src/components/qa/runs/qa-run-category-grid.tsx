import type { QaRunCategory } from '@/lib/qa/run-schema'

type Props = {
  categories: QaRunCategory[]
}

function pct(n: number, total: number): number {
  if (total === 0) return 0
  return (n / total) * 100
}

function healthClass(c: QaRunCategory): string {
  if (c.failed === 0) return 'border-l-green-500/60'
  if (c.failed >= 5 || c.failed / Math.max(c.total, 1) >= 0.25) return 'border-l-red-500/70'
  return 'border-l-yellow-500/70'
}

function failBadgeClass(c: QaRunCategory): string {
  if (c.failed === 0) return 'bg-green-500/10 text-green-400'
  return 'bg-red-500/10 text-red-400'
}

/**
 * Per-category grid card — direct port of PC Test Results
 * "Categories at a glance" cards. Each card links to its
 * `#cat-<id>` anchor section further down the page.
 */
export function QaRunCategoryGrid({ categories }: Props) {
  if (categories.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {categories.map((c) => (
        <a
          key={c.id}
          href={`#cat-${c.id}`}
          className={`rounded-md border bg-card p-4 border-l-4 transition hover:bg-muted/30 ${healthClass(c)} block`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-medium truncate">{c.label}</div>
            <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${failBadgeClass(c)}`}>
              {c.failed}
            </span>
          </div>

          <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-muted/30">
            {c.passed > 0 && (
              <div className="bg-green-500/80" style={{ width: `${pct(c.passed, c.total)}%` }} />
            )}
            {c.failed > 0 && (
              <div className="bg-red-500/80" style={{ width: `${pct(c.failed, c.total)}%` }} />
            )}
            {c.skipped > 0 && (
              <div className="bg-muted-foreground/30" style={{ width: `${pct(c.skipped, c.total)}%` }} />
            )}
          </div>

          <div className="mt-2 flex gap-3 text-xs text-muted-foreground tabular-nums">
            <span>
              <strong className="text-foreground">{c.passed}</strong> pass
            </span>
            <span>
              <strong className="text-foreground">{c.failed}</strong> fail
            </span>
            <span>
              <strong className="text-foreground">{c.skipped}</strong> skip
            </span>
            <span className="ml-auto text-muted-foreground/60">{c.total} tests</span>
          </div>
        </a>
      ))}
    </div>
  )
}
