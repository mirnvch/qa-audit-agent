'use client'

// Маленький бейдж «X / Y пройдено» для карточек модулей на главной курса.
// Подписывается на PROGRESS_EVENT, чтобы обновляться без перезагрузки страницы.

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getCompletedLessons, PROGRESS_EVENT } from '@/lib/learn/progress'
import { cn } from '@/lib/utils'

type Props = {
  lessonIds: string[]
  totalCount: number
  /** Если в модуле все уроки в статусе draft — показываем «Скоро» вместо счётчика. */
  draft?: boolean
}

export function ModuleProgressBadge({ lessonIds, totalCount, draft }: Props) {
  const [done, setDone] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    function recalc() {
      const completed = new Set(getCompletedLessons())
      setDone(lessonIds.filter(id => completed.has(id)).length)
      setHydrated(true)
    }
    recalc()
    window.addEventListener(PROGRESS_EVENT, recalc)
    window.addEventListener('storage', recalc)
    return () => {
      window.removeEventListener(PROGRESS_EVENT, recalc)
      window.removeEventListener('storage', recalc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonIds.join(',')])

  if (draft && (!hydrated || done === 0)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400">
        Скоро
      </span>
    )
  }

  const isFullyDone = hydrated && done === totalCount

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
      isFullyDone
        ? 'bg-emerald-500/15 text-emerald-400'
        : 'bg-muted/40 text-muted-foreground',
    )}>
      {isFullyDone && <CheckCircle2 className="h-3 w-3" />}
      {done} / {totalCount}
    </span>
  )
}
