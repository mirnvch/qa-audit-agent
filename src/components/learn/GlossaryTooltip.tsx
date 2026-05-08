'use client'

// Глоссарий. Два режима:
//  - <Glossary terms={[...]} /> — таблица терминов на странице.
//  - <GlossaryTooltip term="X" definition="..." /> — inline-термин с popup'ом по hover/focus.

import { useState } from 'react'
import { cn } from '@/lib/utils'

export type GlossaryTerm = {
  term: string
  definition: string
}

export function Glossary({ terms }: { terms: GlossaryTerm[] }) {
  return (
    <div className="not-prose my-6 rounded-lg border border-border/60 bg-muted/20 p-5">
      <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/70 mb-3">
        Глоссарий
      </div>
      <dl className="space-y-3">
        {terms.map(t => (
          <div key={t.term} className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
            <dt className="font-mono text-sm font-medium text-foreground">{t.term}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function GlossaryTooltip({ term, definition }: GlossaryTerm) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="cursor-help border-b border-dotted border-primary/60 text-primary hover:border-primary"
      >
        {term}
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2',
          'rounded-md border border-border/60 bg-popover p-3 text-xs leading-relaxed shadow-lg',
          'transition-opacity duration-150',
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        <strong className="font-mono">{term}</strong> — {definition}
      </span>
    </span>
  )
}
