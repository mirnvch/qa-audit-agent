'use client'

// Каталог диаграмм. Получает initial-список и usage-map с server-page,
// дальше всё локально: поиск, фильтр по тегам, сортировка.

import { useMemo, useState } from 'react'
import { Search, ArrowUpAZ, ArrowDownAZ, CalendarClock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { DiagramCard } from './DiagramCard'
import type { DiagramSummary } from '@/lib/learn/diagrams/api'

type SortMode = 'newest' | 'title-asc'

type Props = {
  diagrams: DiagramSummary[]
  /** slug → массив lessonId, в которых diagram используется. */
  usageMap: Record<string, string[]>
}

export function DiagramCatalog({ diagrams, usageMap }: Props) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('newest')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const d of diagrams) for (const t of d.tags) set.add(t)
    return [...set].sort()
  }, [diagrams])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let arr = diagrams.filter(d => {
      if (activeTag && !d.tags.includes(activeTag)) return false
      if (!q) return true
      return (
        d.title.toLowerCase().includes(q) ||
        (d.description ?? '').toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q)
      )
    })
    if (sortMode === 'title-asc') {
      arr = [...arr].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    }
    // 'newest' = order from server (created_at desc)
    return arr
  }, [diagrams, query, activeTag, sortMode])

  return (
    <div className="space-y-6">
      {/* Toolbar: поиск + сортировка */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, описанию, slug…"
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/50 p-0.5">
          <button
            type="button"
            onClick={() => setSortMode('newest')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-mono transition-colors',
              sortMode === 'newest'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
            )}
          >
            <CalendarClock className="h-3 w-3" />
            Новые
          </button>
          <button
            type="button"
            onClick={() => setSortMode('title-asc')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-mono transition-colors',
              sortMode === 'title-asc'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
            )}
          >
            {sortMode === 'title-asc' ? <ArrowUpAZ className="h-3 w-3" /> : <ArrowDownAZ className="h-3 w-3" />}
            A–Я
          </button>
        </div>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 mr-1">
            Теги:
          </span>
          {allTags.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-mono transition-colors',
                activeTag === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
          {activeTag && (
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 hover:text-foreground"
            >
              сбросить
            </button>
          )}
        </div>
      )}

      {/* Результаты */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {query || activeTag ? 'Ничего не нашлось — попробуй сбросить фильтры.' : 'Диаграмм пока нет.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            Показано: {filtered.length} из {diagrams.length}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(d => (
              <DiagramCard
                key={d.id}
                diagram={d}
                usedInLessons={usageMap[d.slug] ?? []}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
