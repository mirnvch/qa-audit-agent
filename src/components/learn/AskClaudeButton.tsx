'use client'

// Заглушка кнопки «Спросить Claude». В будущем подключим к Anthropic API
// через server action. Сейчас — toast «скоро появится».
//
// Подсказка `hint` (если задана) — короткий текст-приглашение, показывается
// рядом с кнопкой. `context` — короткая метка вроде "part-1" / "part-3"
// для будущей передачи контекста в API. `prompt` — заготовка вопроса
// (тоже на будущее).

import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Props = {
  /** Опц. подсказка-промпт, который потом полетит в API. */
  prompt?: string
  /** Короткая метка контекста ("part-1", "task-2"...) для будущей передачи в API. */
  context?: string
  /** Текст-приглашение рядом с кнопкой (mark-up из MDX или просто строка). */
  hint?: string
  /** Кастомный текст самой кнопки. */
  label?: string
  className?: string
}

export function AskClaudeButton({ context, hint, label = 'Спросить Claude', className }: Props) {
  function handleClick() {
    toast.info('Эта функция скоро появится', {
      description: context
        ? `Контекст: ${context}. Мы готовим интеграцию с Anthropic API.`
        : 'Мы готовим интеграцию с Anthropic API — пока что задавай вопросы вручную.',
    })
  }

  return (
    <div className={cn('not-prose my-6 flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/20 p-4 sm:flex-row sm:items-start', className)}>
      {hint && (
        <div className="flex-1 text-sm leading-relaxed text-muted-foreground">
          <span className="mr-1.5 text-base">🤔</span>
          {hint}
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
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
  )
}
