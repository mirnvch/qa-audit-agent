// Страница модуля /learn/<moduleId>: список уроков модуля с описанием и прогрессом.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Clock, Lock } from 'lucide-react'
import {
  ALL_MODULES,
  courseForModule,
  findModule,
  lessonHref,
  type Lesson,
  type Module,
} from '@/lib/learn/course-config'
import { ModuleIcon } from '@/lib/learn/icon-map'
import { ProgressBar } from '@/components/learn/ProgressBar'
import { LessonCompletionDot } from '@/components/learn/LessonCompletionDot'
import { CourseSidebarMobileTrigger } from '@/components/learn/CourseSidebarMobileTrigger'
import { cn } from '@/lib/utils'

type Props = {
  params: Promise<{ moduleId: string }>
}

// Префетч всех модулей (всех курсов) на этапе сборки — они известны статически.
export function generateStaticParams() {
  return ALL_MODULES.map(m => ({ moduleId: m.id }))
}

export default async function ModulePage({ params }: Props) {
  const { moduleId } = await params
  const mod = findModule(moduleId)
  if (!mod) notFound()

  const lessonIds = mod.lessons.map(l => l.id)

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl">
      {/* Хлебные крошки */}
      <Breadcrumbs mod={mod} />

      {/* Шапка модуля */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ModuleIcon name={mod.icon} className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
              Модуль {String(mod.number).padStart(2, '0')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{mod.title}</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {mod.description}
        </p>
      </header>

      {/* Прогресс модуля */}
      <div className="rounded-lg border border-border/50 bg-card/30 p-4">
        <ProgressBar scopeIds={lessonIds} height={4} />
      </div>

      {/* Список уроков */}
      <ol className="space-y-2">
        {mod.lessons.map(lesson => (
          <li key={lesson.id}>
            <LessonRow lesson={lesson} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function Breadcrumbs({ mod }: { mod: Module }) {
  const courseHref = courseForModule(mod.id)?.landingHref ?? '/learn'
  return (
    <nav className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
      <CourseSidebarMobileTrigger className="mr-1" />
      <Link href={courseHref} className="hover:text-foreground transition-colors">Курс</Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
      <span className="text-foreground">Модуль {mod.number}</span>
    </nav>
  )
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const isLocked = lesson.status === 'locked'
  const isDraft = lesson.status === 'draft'

  if (isLocked) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-dashed border-border/40 px-4 py-3 opacity-50 cursor-not-allowed">
        <Lock className="h-4 w-4 text-muted-foreground/40" />
        <span className="font-mono text-xs text-muted-foreground/60 w-10">{lesson.id}</span>
        <span className="flex-1 text-sm">{lesson.title}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">Скоро</span>
      </div>
    )
  }

  return (
    <Link
      href={lessonHref(lesson)}
      className={cn(
        'group flex items-center gap-3 rounded-md border border-border/50 px-4 py-3 transition-colors',
        'hover:border-border hover:bg-muted/30',
      )}
    >
      <LessonCompletionDot lessonId={lesson.id} draft={isDraft} />
      <span className="font-mono text-xs text-muted-foreground w-10">{lesson.id}</span>
      <span className="flex-1 text-sm leading-snug">{lesson.title}</span>
      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
        <Clock className="h-3 w-3" />
        {lesson.estimatedMinutes} мин
      </span>
      {isDraft && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400">
          В разработке
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
    </Link>
  )
}
