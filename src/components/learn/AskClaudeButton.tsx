'use client'

// Кнопка «Спросить Claude» — живая: разворачивает поле вопроса и ходит в
// /api/learn/ask (сервер-прокси к OpenRouter; ключ только на сервере).
//
// Подсказка `hint` (если задана) — короткий текст-приглашение рядом с кнопкой.
// `context` — метка вроде "part-1" / "part-3"; вместе с pathname урока уходит
// в систем-контекст модели, чтобы ответ был про читаемое место курса.
// `prompt` — заготовка вопроса, предзаполняет поле.

import { useState } from 'react'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { renderInlineMarkdown } from '@/lib/learn/inline-markdown'

type Props = {
  /** Опц. заготовка вопроса — предзаполняет поле ввода. */
  prompt?: string
  /** Короткая метка контекста ("part-1", "task-2"...) — уходит в API вместе с pathname. */
  context?: string
  /** Текст-приглашение рядом с кнопкой (mark-up из MDX или просто строка). */
  hint?: string
  /** Кастомный текст самой кнопки. */
  label?: string
  className?: string
}

export function AskClaudeButton({ prompt, context, hint, label = 'Спросить Claude', className }: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState(prompt ?? '')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    const q = question.trim()
    if (!q || loading) return
    setLoading(true)
    setAnswer(null)
    try {
      const lesson = typeof window !== 'undefined' ? window.location.pathname : ''
      const res = await fetch('/api/learn/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: [lesson, context].filter(Boolean).join(' · ') }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.answer) {
        toast.error(data?.error ?? 'Не получилось получить ответ, попробуй ещё раз.')
        return
      }
      setAnswer(data.answer)
    } catch {
      toast.error('Сеть недоступна — попробуй ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('not-prose my-6 flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/20 p-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {hint && (
          <div className="flex-1 text-sm leading-relaxed text-muted-foreground">
            <span className="mr-1.5 text-base">🤔</span>
            {renderInlineMarkdown(hint)}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-md border border-primary/40 bg-primary/5',
            'px-3 py-1.5 text-xs font-mono font-medium text-primary',
            'hover:bg-primary/10 hover:border-primary/60 transition-colors',
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {label}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
            }}
            placeholder="Твой вопрос по этой части урока… (Cmd+Enter — отправить)"
            rows={3}
            className={cn(
              'w-full resize-y rounded-md border border-border/60 bg-background p-2.5',
              'text-sm leading-relaxed outline-none focus:border-primary/50',
            )}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !question.trim()}
              className={cn(
                'inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5',
                'text-xs font-medium text-primary-foreground transition-opacity',
                'disabled:opacity-50',
              )}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {loading ? 'Думает…' : 'Отправить'}
            </button>
            {answer && (
              <button
                type="button"
                onClick={() => setAnswer(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Очистить ответ
              </button>
            )}
          </div>

          {answer && (
            <div className="whitespace-pre-wrap rounded-md border border-primary/20 bg-primary/[0.03] p-3 text-sm leading-relaxed">
              {answer}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
