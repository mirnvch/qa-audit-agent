'use client'

// Кнопка «✅ Я прошёл урок». Тоггл — кликнул ещё раз, снимется отметка.
// Состояние читается из localStorage, при смене вызываем emitProgressChanged()
// чтобы прогресс-бар и сайдбар обновились без перезагрузки.

import { useEffect, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import {
  isLessonCompleted,
  markLessonCompleted,
  unmarkLessonCompleted,
  emitProgressChanged,
} from '@/lib/learn/progress'
import { cn } from '@/lib/utils'

export function CompleteLessonButton({ lessonId }: { lessonId: string }) {
  const [completed, setCompleted] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- стандартный hydration-паттерн для localStorage: нет источника, который можно подключить через useSyncExternalStore без overhead.
    setCompleted(isLessonCompleted(lessonId))
    setHydrated(true)
  }, [lessonId])

  function toggle() {
    if (completed) {
      unmarkLessonCompleted(lessonId)
      setCompleted(false)
    } else {
      markLessonCompleted(lessonId)
      setCompleted(true)
    }
    emitProgressChanged()
  }

  // SSR-safe placeholder — не показываем неправильное состояние до гидратации.
  if (!hydrated) {
    return <div className="h-9 w-44 rounded-md bg-muted/40 animate-pulse" />
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
        completed
          ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
          : 'bg-foreground text-background hover:opacity-90',
      )}
    >
      {completed ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      {completed ? 'Урок пройден — снять отметку' : 'Я прошёл урок'}
    </button>
  )
}
