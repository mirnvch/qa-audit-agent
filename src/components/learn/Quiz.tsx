// Quiz — Server Component-обёртка. Принимает массив вопросов как обычный prop
// и рендерит каркас. Каждый вопрос — client-остров QuizItem с примитивами.
//
// С @next/mdx массивы и объекты в JSX-атрибутах MDX штатно проходят как props,
// никаких JSON-обёрток не нужно (раньше с next-mdx-remote было иначе).

import { QuizItem } from './QuizItem'

export type QuizQuestion = {
  question: string
  options: string[]
  correct: number
  explanation?: string
}

type Props = {
  questions: QuizQuestion[]
}

export function Quiz({ questions }: Props) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="my-4 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs font-mono text-amber-400">
        [Quiz: missing or empty `questions` prop]
      </div>
    )
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-border/60 bg-muted/20 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/70">
          Quiz · {questions.length} {questions.length === 1 ? 'вопрос' : 'вопроса'}
        </div>
      </div>
      <ol className="space-y-6">
        {questions.map((q, i) => (
          <QuizItem
            key={i}
            index={i + 1}
            question={q.question}
            options={q.options}
            correct={q.correct}
            explanation={q.explanation}
          />
        ))}
      </ol>
    </div>
  )
}
