'use client'

// Маленькая «точка» статуса урока в списке: ✅ если пройден, иначе кружок
// (для draft — пунктирный, для published — обычный).
//
// ВАЖНО: пропсы — только примитивы. Передавать функции-компоненты из Server
// в Client Component нельзя (RSC сериализация падает).

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, CircleDashed } from 'lucide-react'
import { isLessonCompleted, PROGRESS_EVENT } from '@/lib/learn/progress'

type Props = {
  lessonId: string
  /** true — урок-заглушка, рисуем CircleDashed вместо обычного Circle. */
  draft?: boolean
}

export function LessonCompletionDot({ lessonId, draft }: Props) {
  const [completed, setCompleted] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    function recalc() {
      setCompleted(isLessonCompleted(lessonId))
      setHydrated(true)
    }
    recalc()
    window.addEventListener(PROGRESS_EVENT, recalc)
    window.addEventListener('storage', recalc)
    return () => {
      window.removeEventListener(PROGRESS_EVENT, recalc)
      window.removeEventListener('storage', recalc)
    }
  }, [lessonId])

  if (hydrated && completed) {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
  }
  const Icon = draft ? CircleDashed : Circle
  return <Icon className="h-4 w-4 shrink-0 text-muted-foreground/40" />
}
