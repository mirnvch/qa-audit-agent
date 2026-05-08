'use client'

// Маленький "X / Y" в шапке Checklist. Слушает события от ChecklistRow.

import { useEffect, useState } from 'react'
import { getChecklistState } from '@/lib/learn/progress'

const ROW_EVENT = 'nexus-course:checklist-row-changed'

type Props = {
  lessonId: string
  checklistId: string
  totalCount: number
}

export function ChecklistCounter({ lessonId, checklistId, totalCount }: Props) {
  const [done, setDone] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    function recalc() {
      const state = getChecklistState(lessonId, checklistId)
      setDone(state ? state.filter(Boolean).length : 0)
      setHydrated(true)
    }
    recalc()

    function handler(e: Event) {
      const ev = e as CustomEvent<{ lessonId: string; checklistId: string }>
      if (ev.detail?.lessonId === lessonId && ev.detail?.checklistId === checklistId) recalc()
    }
    window.addEventListener(ROW_EVENT, handler)
    window.addEventListener('storage', recalc)
    return () => {
      window.removeEventListener(ROW_EVENT, handler)
      window.removeEventListener('storage', recalc)
    }
  }, [lessonId, checklistId])

  return (
    <span className="text-xs font-mono text-muted-foreground">
      {hydrated ? done : 0} / {totalCount}
    </span>
  )
}
