// Метаблок урока: модуль, время, главная мысль.
// Server Component — никакого state, чисто отображение.

import { MapPin, Clock, Quote } from 'lucide-react'
import type { Module, Lesson } from '@/lib/learn/course-config'

type Props = {
  module: Module
  lesson: Lesson
  /** Главная мысль урока — короткий ёмкий тезис, выделяется визуально. */
  mainIdea?: string
}

export function LessonHeader({ module, lesson, mainIdea }: Props) {
  return (
    <div className="space-y-6">
      {/* Метаблок: модуль · время */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          Модуль {module.number} · {module.title}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          ~{lesson.estimatedMinutes} мин
        </span>
        {lesson.status === 'draft' && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400">
            В разработке
          </span>
        )}
      </div>

      {/* Заголовок */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          Урок {lesson.id}
        </p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">{lesson.title}</h1>
      </div>

      {/* Главная мысль */}
      {mainIdea && (
        <blockquote className="not-prose flex gap-3 rounded-lg border-l-4 border-primary/60 bg-primary/5 px-4 py-3">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary/80 mb-0.5">
              Главная мысль
            </div>
            <p className="text-sm leading-relaxed">{mainIdea}</p>
          </div>
        </blockquote>
      )}
    </div>
  )
}
