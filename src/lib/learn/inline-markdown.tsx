// Лёгкий inline-markdown парсер для UI-компонентов учебного раздела.
//
// Поддерживает: **bold**, *italic*, `code`. Без сторонних либ —
// для одной строки этого достаточно, MDX-grade парсер был бы overkill.
//
// Используется во всех местах, где компонент принимает строку с возможным
// inline-форматированием: Quiz (вопросы / опции / разборы), Checklist (items),
// Glossary (term/definition), AskClaudeButton (hint), TextAnswerExercise (prompt),
// Diagram (caption).

import * as React from 'react'

const RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g

export function renderInlineMarkdown(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = RE.exec(text)) !== null) {
    if (match.index > last) tokens.push(text.slice(last, match.index))
    const m = match[0]
    if (m.startsWith('**')) {
      tokens.push(
        <strong key={key++} className="font-semibold text-foreground">
          {m.slice(2, -2)}
        </strong>,
      )
    } else if (m.startsWith('`')) {
      tokens.push(
        <code key={key++} className="rounded bg-muted/40 px-1 py-0.5 font-mono text-[0.85em]">
          {m.slice(1, -1)}
        </code>,
      )
    } else {
      tokens.push(<em key={key++}>{m.slice(1, -1)}</em>)
    }
    last = RE.lastIndex
  }
  if (last < text.length) tokens.push(text.slice(last))
  return <>{tokens}</>
}
