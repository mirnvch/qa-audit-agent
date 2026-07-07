'use client'

// Задание со свободным ответом. После «Отправить»:
//  - сохраняется в localStorage,
//  - показывается «Твой ответ» (read-only),
//  - открывается «Разбор» (children/solution из MDX).
//
// lessonId берётся из LessonProvider через хук useLessonId() —
// автору MDX дублировать его в каждом теге не надо.

import { useEffect, useRef, useState } from 'react'
import { Send, RotateCcw, BookOpen, Loader2, Sparkles, RefreshCcw } from 'lucide-react'
import {
  saveExerciseAnswer,
  getExerciseAnswer,
  getExerciseFeedback,
  saveExerciseFeedback,
  type ExerciseFeedback,
} from '@/lib/learn/progress'
import { useLessonId } from './LessonProvider'
import { cn } from '@/lib/utils'
import { renderInlineMarkdown } from '@/lib/learn/inline-markdown'

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
  const solutionRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // На клиенте после mount — подтягиваем сохранённый ответ.
  useEffect(() => {
    const saved = getExerciseAnswer(lessonId, exerciseId)
    if (saved) {
      setSubmitted(saved)
      setDraft(saved)
      const savedFeedback = getExerciseFeedback(lessonId, exerciseId)
      if (savedFeedback) {
        setFeedback(savedFeedback)
      }
    }
    setHydrated(true)
  }, [lessonId, exerciseId])

  async function getAnswerKeyText() {
    if (typeof window === 'undefined') return ''

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve())
    })

    return solutionRef.current?.innerText.replace(/\s+/g, ' ').trim() ?? ''
  }

  async function requestFeedback(answer: string) {
    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const lessonPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const answerKey = await getAnswerKeyText()
      const res = await fetch('/api/learn/analyze-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          exerciseId,
          prompt,
          answer,
          answerKey,
          context: lessonPath,
        }),
      })
      const contentType = res.headers.get('content-type') ?? ''
      const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null

      if (res.redirected || !contentType.includes('application/json')) {
        setFeedbackError(
          'AI-запрос ушёл на страницу входа. Войди в курс или включи DISABLE_AUTH/ALLOW_PUBLIC_ACCESS для локального режима.',
        )
        return
      }

      if (!res.ok || !data?.feedback) {
        setFeedbackError(data?.error ?? 'AI-разбор сейчас недоступен, попробуй ещё раз.')
        return
      }

      setFeedback(data.feedback)
      saveExerciseFeedback(lessonId, exerciseId, data.feedback)
    } catch {
      setFeedbackError('Сеть недоступна — AI-разбор не получился. Попробуй ещё раз.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  function handleSubmit() {
    const text = draft.trim()
    if (!text) return
    saveExerciseAnswer(lessonId, exerciseId, text)
    setSubmitted(text)
    setFeedback(null)
    saveExerciseFeedback(lessonId, exerciseId, null)
    void requestFeedback(text)
  }

  function handleReset() {
    setSubmitted(null)
    setDraft('')
    setFeedback(null)
    setFeedbackError(null)
    saveExerciseAnswer(lessonId, exerciseId, '')
    saveExerciseFeedback(lessonId, exerciseId, null)
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-border/60 bg-muted/20 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/70 mb-1">
            Задание
          </div>
          <div className="text-sm leading-relaxed space-y-2">
            {prompt.split(/\n\n+/).map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">{renderInlineMarkdown(para)}</p>
            ))}
          </div>
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
            <p className="text-xs text-muted-foreground/70 italic">💡 {renderInlineMarkdown(hint)}</p>
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

          <AiFeedbackPanel
            feedback={feedback}
            loading={feedbackLoading}
            error={feedbackError}
            onRetry={() => {
              if (submitted) void requestFeedback(submitted)
            }}
          />

          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400/80">
              <BookOpen className="h-3 w-3" />
              Эталонный разбор
            </div>
            <div
              ref={solutionRef}
              className="text-sm leading-relaxed [&>p]:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
            >
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

function AiFeedbackPanel({
  feedback,
  loading,
  error,
  onRetry,
}: {
  feedback: ExerciseFeedback | null
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  const score = getScoreMeta(feedback?.scoreLabel)

  return (
    <div className="rounded-md border border-primary/25 bg-primary/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-primary/80">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          AI-разбор ответа
        </div>
        {feedback && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-mono', score.className)}>
            {score.label}
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Проверяю ответ: ищу сильные места, пробелы и конкретные ошибки.
        </p>
      )}

      {!loading && error && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCcw className="h-3 w-3" />
            Повторить AI-разбор
          </button>
        </div>
      )}

      {!loading && !error && feedback && (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>{feedback.summary}</p>
          <FeedbackList title="Что засчитано" items={feedback.strengths} />
          <FeedbackList title="Чего не хватает" items={feedback.gaps} />
          <FeedbackList title="Как поправить формулировки" items={feedback.corrections} />
          <FeedbackList title="Что дописать" items={feedback.nextSteps} />
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCcw className="h-3 w-3" />
            Обновить разбор
          </button>
        </div>
      )}

      {!loading && !error && !feedback && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            AI-разбор ещё не сохранён для этого ответа.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCcw className="h-3 w-3" />
            Запустить AI-разбор
          </button>
        </div>
      )}
    </div>
  )
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <div>
      <h4 className="mb-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <ul className="space-y-1 pl-4">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="list-disc">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function getScoreMeta(scoreLabel?: ExerciseFeedback['scoreLabel']) {
  if (scoreLabel === 'strong') {
    return {
      label: 'уверенный зачёт',
      className: 'bg-emerald-500/10 text-emerald-500',
    }
  }
  if (scoreLabel === 'needs_work') {
    return {
      label: 'нужно дописать',
      className: 'bg-amber-500/10 text-amber-500',
    }
  }
  return {
    label: 'частичный зачёт',
    className: 'bg-primary/10 text-primary',
  }
}
