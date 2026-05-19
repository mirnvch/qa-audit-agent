'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, ChevronDown, Search } from 'lucide-react'
import type { QaRunCategory, QaRunTest, QaRunTestStatus } from '@/lib/qa/run-schema'
import { QaRunStatusPill } from './qa-run-status-pill'

type Props = {
  categories: QaRunCategory[]
  tests: QaRunTest[]
}

type StatusFilter = 'all' | 'failed' | 'passed' | 'skipped'

function fmtDuration(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return ''
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function pct(n: number, total: number): number {
  if (total <= 0) return 0
  return (n / total) * 100
}

/**
 * Stable per-test identity used as React key and open-state map key.
 * Hashes file + title so expansion state survives search/filter changes
 * and category re-ordering. Index-based ids would drift as the visible
 * test list shrinks under a filter.
 */
function stableTestId(t: QaRunTest): string {
  return `${t.file}::${t.title}`
}

function statusMatchesFilter(status: QaRunTestStatus, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'failed') return status === 'failed'
  if (filter === 'passed') return status === 'passed'
  if (filter === 'skipped') return status === 'skipped' || status === 'pending' || status === 'todo'
  return true
}

/**
 * Client-side interactive shell — search + filter pills + per-category
 * collapsible sections with expandable failure-detail rows.
 * Mirrors the PC `render-test-results.ts` Part 2 interactivity in React.
 */
export function QaRunDetailShell({ categories, tests }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [openTests, setOpenTests] = useState<Record<string, boolean>>({})
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({})

  const testsByCategory = useMemo(() => {
    const map = new Map<string, QaRunTest[]>()
    for (const t of tests) {
      const arr = map.get(t.category_id) ?? []
      arr.push(t)
      map.set(t.category_id, arr)
    }
    return map
  }, [tests])

  const visibleCounts = useMemo(() => {
    const q = query.trim().toLowerCase()
    let shown = 0
    for (const t of tests) {
      const text = `${t.title} ${t.sub_area ?? ''} ${t.testrail_ids.join(' ')} ${t.failure_messages.join(' ')}`.toLowerCase()
      if (!statusMatchesFilter(t.status, filter)) continue
      if (q && !text.includes(q)) continue
      shown++
    }
    return shown
  }, [tests, query, filter])

  const toggleTest = (id: string) =>
    setOpenTests((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleCat = (id: string) =>
    setCollapsedCats((prev) => ({ ...prev, [id]: !prev[id] }))

  const filterBtnBase =
    'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors'
  const filterBtnInactive = 'bg-card border-border text-muted-foreground hover:text-foreground'
  const filterBtnActive: Record<StatusFilter, string> = {
    all: 'bg-foreground text-background border-foreground',
    failed: 'bg-red-500/10 border-red-500/30 text-red-400',
    passed: 'bg-green-500/10 border-green-500/30 text-green-400',
    skipped: 'bg-muted text-foreground border-border',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="search"
            placeholder="Filter by test name, sub-area, TestRail id, or error message…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border rounded-md outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'failed', 'passed', 'skipped'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`${filterBtnBase} ${filter === f ? filterBtnActive[f] : filterBtnInactive}`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          <strong className="text-foreground">{visibleCounts}</strong> shown
        </div>
      </div>

      {categories.map((cat) => {
        const catTests = testsByCategory.get(cat.id) ?? []
        const collapsed = collapsedCats[cat.id] ?? false
        const filteredTests = catTests.filter((t) => {
          if (!statusMatchesFilter(t.status, filter)) return false
          const q = query.trim().toLowerCase()
          if (!q) return true
          const text = `${t.title} ${t.sub_area ?? ''} ${t.testrail_ids.join(' ')} ${t.failure_messages.join(' ')}`.toLowerCase()
          return text.includes(q)
        })
        if (filteredTests.length === 0 && (query || filter !== 'all')) return null

        return (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            className="scroll-mt-4 space-y-2"
          >
            <button
              type="button"
              onClick={() => toggleCat(cat.id)}
              aria-expanded={!collapsed}
              className="w-full flex items-baseline gap-3 pb-2 border-b text-left group"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 mt-1" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground/60 mt-1" />
              )}
              <h2
                className="text-lg md:text-xl font-semibold flex-1"
                style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
              >
                {cat.label}{' '}
                <span className="text-xs font-mono text-muted-foreground/60 ml-1 tabular-nums">
                  {cat.total} tests
                </span>
              </h2>
              <div className="hidden sm:flex h-1 w-32 rounded-full overflow-hidden bg-muted/30 mt-2">
                {cat.passed > 0 && (
                  <div
                    className="bg-green-500/80"
                    style={{ width: `${pct(cat.passed, cat.total)}%` }}
                  />
                )}
                {cat.failed > 0 && (
                  <div
                    className="bg-red-500/80"
                    style={{ width: `${pct(cat.failed, cat.total)}%` }}
                  />
                )}
                {cat.skipped > 0 && (
                  <div
                    className="bg-muted-foreground/30"
                    style={{ width: `${pct(cat.skipped, cat.total)}%` }}
                  />
                )}
              </div>
            </button>

            {!collapsed && (
              <div className="rounded-md border bg-card overflow-hidden">
                {filteredTests.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">
                    No tests match the current filter.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {filteredTests.map((t) => {
                      const id = stableTestId(t)
                      const hasFailure = t.failure_messages.length > 0
                      const open = openTests[id] ?? false
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => hasFailure && toggleTest(id)}
                            className={`w-full px-3 py-2 flex items-start gap-3 text-left text-sm ${
                              hasFailure ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default'
                            }`}
                            aria-expanded={hasFailure ? open : undefined}
                          >
                            <div className="w-4 flex-shrink-0 mt-1">
                              {hasFailure ? (
                                open ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                )
                              ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-foreground break-words">{t.title}</div>
                              {(t.sub_area || t.testrail_ids.length > 0) && (
                                <div
                                  className="text-[11px] text-muted-foreground/70 mt-0.5"
                                  style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
                                >
                                  {t.sub_area}
                                  {t.sub_area && t.testrail_ids.length > 0 ? ' · ' : ''}
                                  {t.testrail_ids.join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <QaRunStatusPill status={t.status} />
                            </div>
                            <div
                              className="w-16 text-right text-[11px] text-muted-foreground tabular-nums flex-shrink-0"
                              style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
                            >
                              {fmtDuration(t.duration_ms)}
                            </div>
                          </button>
                          {hasFailure && open && (
                            <div
                              className="px-3 pb-3 pl-10 text-xs text-foreground bg-red-500/[0.03] border-t border-red-500/10"
                              style={{ fontFamily: 'var(--font-jb-mono, var(--font-mono))' }}
                            >
                              <pre className="whitespace-pre-wrap break-words max-h-96 overflow-auto py-2">
                                {t.failure_messages.join('\n\n')}
                              </pre>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
