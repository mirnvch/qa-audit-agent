'use client'

// Один вопрос викторины. Получает только примитивы — это позволяет
// надёжно использовать его как client-остров внутри RSC-страниц
// (см. комментарий в Quiz.tsx).

import { useState } from 'react'
import { Check, X, ChevronDown, Circle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  index: number
  question: string
  options: string[]
  correct: number
  explanation?: string
}

export function QuizItem({ index, question, options, correct, explanation }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const isCorrect = revealed && picked === correct

  return (
    <li className="space-y-3">
      <div className="text-sm font-medium">
        <span className="font-mono text-muted-foreground mr-2">Q{index}.</span>
        {question}
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isPicked = picked === idx
          const isAnswer = revealed && idx === correct
          const isWrong = revealed && isPicked && idx !== correct
          const letter = String.fromCharCode(65 + idx)

          return (
            <button
              key={idx}
              type="button"
              onClick={() => !revealed && setPicked(idx)}
              disabled={revealed}
              className={cn(
                'w-full flex items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                'disabled:cursor-default',
                isAnswer && 'border-emerald-500/50 bg-emerald-500/10',
                isWrong  && 'border-red-500/50 bg-red-500/10',
                !revealed && isPicked && 'border-primary/50 bg-primary/5',
                !revealed && !isPicked && 'border-border/50 hover:border-border hover:bg-muted/40',
              )}
            >
              <span className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-semibold',
                isAnswer ? 'bg-emerald-500/20 text-emerald-400' :
                isWrong  ? 'bg-red-500/20 text-red-400' :
                isPicked ? 'bg-primary/20 text-primary' :
                           'bg-muted/50 text-muted-foreground',
              )}>
                {revealed && idx === correct ? <Check className="h-3 w-3" /> :
                 isWrong ? <X className="h-3 w-3" /> :
                 isPicked ? <CheckCircle2 className="h-3 w-3" /> :
                 letter}
              </span>
              <span className="leading-relaxed">{opt}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={picked === null}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-colors',
              picked === null
                ? 'bg-muted/40 text-muted-foreground/50 cursor-not-allowed'
                : 'bg-foreground text-background hover:opacity-90',
            )}
          >
            Проверить
          </button>
        ) : (
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono',
            isCorrect ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400',
          )}>
            {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {isCorrect ? 'Верно' : 'Неверно'}
          </span>
        )}

        {revealed && explanation && (
          <button
            type="button"
            onClick={() => setShowExplanation(v => !v)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform', showExplanation && 'rotate-180')} />
            {showExplanation ? 'Скрыть разбор' : 'Показать разбор'}
          </button>
        )}
      </div>

      {revealed && showExplanation && explanation && (
        <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <div className="mb-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            <Circle className="h-2 w-2 fill-current" /> Разбор
          </div>
          {explanation}
        </div>
      )}
    </li>
  )
}
