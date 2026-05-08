// Навигация «предыдущий / следующий урок». Server Component.

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type Lesson, lessonHref } from '@/lib/learn/course-config'

type Props = {
  prev?: Lesson
  next?: Lesson
}

export function LessonNavigation({ prev, next }: Props) {
  return (
    <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NavCard direction="prev" lesson={prev} />
      <NavCard direction="next" lesson={next} />
    </nav>
  )
}

function NavCard({ direction, lesson }: { direction: 'prev' | 'next'; lesson?: Lesson }) {
  const isPrev = direction === 'prev'

  if (!lesson) {
    return <div className="rounded-lg border border-dashed border-border/40 p-4 opacity-40" />
  }

  return (
    <Link
      href={lessonHref(lesson)}
      className={`group rounded-lg border border-border/50 p-4 transition-colors hover:border-border hover:bg-muted/30 ${isPrev ? '' : 'sm:text-right'}`}
    >
      <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 ${isPrev ? '' : 'sm:justify-end'}`}>
        {isPrev && <ChevronLeft className="h-3 w-3" />}
        {isPrev ? 'Предыдущий' : 'Следующий'}
        {!isPrev && <ChevronRight className="h-3 w-3" />}
      </div>
      <div className="text-sm font-medium leading-snug group-hover:text-foreground">
        <span className="font-mono text-muted-foreground mr-1.5">{lesson.id}</span>
        {lesson.title}
      </div>
    </Link>
  )
}
