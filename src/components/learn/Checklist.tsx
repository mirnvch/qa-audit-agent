'use client'

// Checklist — Client Component, принимает массив строк-пунктов как обычный prop.
// lessonId берётся через useLessonId() из контекста LessonProvider, чтобы
// автору урока не приходилось дублировать его в каждом MDX-теге.
//
// Каждый пункт делегирует чек-логику в ChecklistRow (client-остров с localStorage).

import { ChecklistRow } from './ChecklistRow'
import { ChecklistCounter } from './ChecklistCounter'
import { useLessonId } from './LessonProvider'

type Props = {
  /** id чек-листа внутри урока (на случай нескольких в одном уроке). */
  checklistId: string
  title?: string
  items: string[]
}

export function Checklist({ checklistId, title, items }: Props) {
  const lessonId = useLessonId()

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="my-4 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs font-mono text-amber-400">
        [Checklist: missing or empty `items` prop]
      </div>
    )
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-border/60 bg-muted/20 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/70 mb-0.5">
            Чек-лист
          </div>
          {title && <p className="text-sm font-medium">{title}</p>}
        </div>
        <ChecklistCounter
          lessonId={lessonId}
          checklistId={checklistId}
          totalCount={items.length}
        />
      </div>

      <ul className="space-y-1.5">
        {items.map((text, idx) => (
          <li key={idx}>
            <ChecklistRow
              lessonId={lessonId}
              checklistId={checklistId}
              index={idx}
              totalCount={items.length}
              text={text}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
