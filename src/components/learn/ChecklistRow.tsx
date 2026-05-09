'use client'

// Один пункт чек-листа. Получает примитивы (lessonId, checklistId, index, text).
// Хранит чекнутость в localStorage. Шлёт CustomEvent при смене, чтобы счётчик
// рядом мог обновиться.

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { getChecklistState, saveChecklistState } from '@/lib/learn/progress'
import { cn } from '@/lib/utils'
import { renderInlineMarkdown } from '@/lib/learn/inline-markdown'

const ROW_EVENT = 'nexus-course:checklist-row-changed'

type Props = {
  lessonId: string
  checklistId: string
  /** Индекс пункта 0..N-1 — позиция в массиве items внутри checklist. */
  index: number
  /** Длина массива items — нужна, чтобы при первом сохранении создать массив корректной длины. */
  totalCount: number
  text: string
}

export function ChecklistRow({ lessonId, checklistId, index, totalCount, text }: Props) {
  const [checked, setChecked] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = getChecklistState(lessonId, checklistId)
    if (saved && saved.length === totalCount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration из localStorage без external source.
      setChecked(saved[index] ?? false)
    }
    setHydrated(true)

    function handler(e: Event) {
      const ev = e as CustomEvent<{ lessonId: string; checklistId: string }>
      if (ev.detail?.lessonId !== lessonId || ev.detail?.checklistId !== checklistId) return
      const fresh = getChecklistState(lessonId, checklistId)
      if (fresh && fresh.length === totalCount) {
        setChecked(fresh[index] ?? false)
      }
    }
    window.addEventListener(ROW_EVENT, handler)
    return () => window.removeEventListener(ROW_EVENT, handler)
  }, [lessonId, checklistId, index, totalCount])

  function toggle() {
    const current = getChecklistState(lessonId, checklistId) ?? new Array(totalCount).fill(false)
    if (current.length !== totalCount) current.length = totalCount
    const next = [...current]
    next[index] = !next[index]
    saveChecklistState(lessonId, checklistId, next)
    setChecked(next[index])
    // Уведомляем соседей и счётчик о смене.
    window.dispatchEvent(new CustomEvent(ROW_EVENT, { detail: { lessonId, checklistId } }))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-full flex items-start gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/40 transition-colors"
    >
      <span className={cn(
        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
        hydrated && checked
          ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-400'
          : 'border-border/60',
      )}>
        {hydrated && checked && <Check className="h-3 w-3" />}
      </span>
      <span className={cn(
        'leading-relaxed transition-colors',
        hydrated && checked && 'text-muted-foreground line-through',
      )}>
        {renderInlineMarkdown(text)}
      </span>
    </button>
  )
}
