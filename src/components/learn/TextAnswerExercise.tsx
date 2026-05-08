'use client'

// Задание со свободным ответом. После «Отправить»:
//  - сохраняется в localStorage,
//  - показывается «Твой ответ» (read-only),
//  - открывается «Разбор» (children/solution из MDX).
//
// lessonId берётся из LessonProvider через хук useLessonId() —
// автору MDX дублировать его в каждом теге не надо.

import { useEffect, useState } from 'react'
import { Send, RotateCcw, BookOpen } from 'lucide-react'
import { saveExerciseAnswer, getExerciseAnswer } from '@/lib/learn/progress'
import { useLessonId } from './LessonProvider'
import { cn } from '@/lib/utils'

type Props = {
  /** id задания внутри урока (на случай нескольких) */
  exerciseId: string
  /** Текст задания (1–3 предложения, можно с переносами через \n\n) */
  prompt: string
  /** Подсказка под textarea, опц. */
  hint?: string
  /** Кастомный placeholder для textarea. По умолчанию «Запиши свой ответ...». */
  placeholder?: string
  /** Разбор — рендерится после отправки (любой JSX из MDX). */
  solution: React.ReactNode
}

export function TextAnswerExercise({ exerciseId, prompt, hint, placeholder, solution }: Props) {
  const lessonId = useLessonId()
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // На клиенте после mount — подтягиваем сохранённый ответ.
  useEffect(() => {
    const saved = getExerciseAnswer(lessonId, exerciseId)
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration из localStorage; альтернатива через useSyncExternalStore не оправдывает оверхеда.
      setSubmitted(saved)
      setDraft(saved)
    }
    setHydrated(true)
  }, [lessonId, exerciseId])

  function handleSubmit() {
    const text = draft.trim()
    if (!text) return
    saveExerciseAnswer(lessonId, exerciseId, text)
    setSubmitted(text)
  }

  function handleReset() {
    setSubmitted(null)
    setDraft('')
    saveExerciseAnswer(lessonId, exerciseId, '')
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-border/60 bg-muted/20 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/70 mb-1">
            Задание
          </div>
          <p className="text-sm leading-relaxed">{prompt}</p>
        </div>
      </div>

      {!submitted && hydrated && (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder ?? 'Запиши свой ответ...'}
            rows={6}
            className={cn(
              'w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm leading-relaxed',
              'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-y',
            )}
          />
          {hint && (
            <p className="text-xs text-muted-foreground/70 italic">💡 {hint}</p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!draft.trim()}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-colors',
                draft.trim()
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-muted/40 text-muted-foreground/50 cursor-not-allowed',
              )}
            >
              <Send className="h-3 w-3" />
              Отправить
            </button>
          </div>
        </>
      )}

      {submitted && (
        <>
          <div className="rounded-md border border-border/40 bg-card/40 p-3">
            <div className="mb-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Твой ответ
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{submitted}</p>
          </div>

          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400/80">
              <BookOpen className="h-3 w-3" />
              Разбор
            </div>
            <div className="text-sm leading-relaxed [&>p]:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
              {solution}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Ответить заново
            </button>
          </div>
        </>
      )}

      {!hydrated && (
        <div className="h-32 rounded-md border border-border/30 bg-muted/10 animate-pulse" />
      )}
    </div>
  )
}
