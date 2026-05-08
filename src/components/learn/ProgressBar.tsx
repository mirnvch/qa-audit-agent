'use client'

// Прогресс-бар. Берёт данные из localStorage и подписывается на CustomEvent
// 'nexus-course:progress-changed' — чтобы обновляться при отметке урока в другом
// месте дерева компонентов на той же странице.

import { useEffect, useState } from 'react'
import { getCompletedCount, PROGRESS_EVENT } from '@/lib/learn/progress'
import { TOTAL_LESSONS } from '@/lib/learn/course-config'

type Props = {
  /** Если задан — считаем прогресс только по этому списку id уроков (модуль). */
  scopeIds?: string[]
  /** Высота полоски в пикселях. */
  height?: number
  /** Показывать подпись «X / Y». */
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ scopeIds, height = 4, showLabel = true, className = '' }: Props) {
  const [done, setDone] = useState(0)
  const total = scopeIds?.length ?? TOTAL_LESSONS

  function recalc() {
    if (!scopeIds) {
      setDone(getCompletedCount())
    } else {
      // Локально импортируем, чтобы не таскать всю функцию в зависимости useEffect
      const completed = JSON.parse(window.localStorage.getItem('nexus-course:completed-lessons') ?? '[]')
      setDone(scopeIds.filter(id => completed.includes(id)).length)
    }
  }

  useEffect(() => {
    recalc()
    const handler = () => recalc()
    window.addEventListener(PROGRESS_EVENT, handler)
    window.addEventListener('storage', handler) // sync между вкладками
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
    // scopeIds — массив, по ссылке меняется редко; передаём stringified
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeIds?.join(',')])

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/70 mb-1.5">
          <span>Прогресс</span>
          <span>{done} / {total}</span>
        </div>
      )}
      <div
        className="relative w-full overflow-hidden rounded-full bg-muted/40"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
