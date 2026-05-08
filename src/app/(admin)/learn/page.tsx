// Главная страница раздела /learn — обложка курса + список модулей.

import Link from 'next/link'
import { ChevronRight, Clock, BookOpen } from 'lucide-react'
import {
  COURSE_MODULES,
  TOTAL_LESSONS,
  TOTAL_HOURS_ROUNDED,
  moduleHref,
  type Module,
} from '@/lib/learn/course-config'
import { ModuleIcon } from '@/lib/learn/icon-map'
import { ProgressBar } from '@/components/learn/ProgressBar'
import { ModuleProgressBadge } from '@/components/learn/ModuleProgressBadge'
import { CourseSidebarMobileTrigger } from '@/components/learn/CourseSidebarMobileTrigger'

export default function LearnHomePage() {
  return (
    <div className="p-6 lg:p-8 space-y-10 max-w-5xl">
      {/* Обложка */}
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <CourseSidebarMobileTrigger />
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase">
            Section · Обучение
          </p>
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          Архитектура QA-проекта Nexus
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Подробный курс по тому, как устроен production-grade Playwright-фреймворк:
          слои, фикстуры, page-objects, фабрики данных, обработка ошибок, CI/CD и техдолг.
          Подходит QA-инженерам, которые хотят понять, как из набора тестов вырастает архитектура.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {TOTAL_LESSONS} уроков
          </span>
          <span>·</span>
          <span>{COURSE_MODULES.length} модулей</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            ~{TOTAL_HOURS_ROUNDED} часов чистого времени
          </span>
        </div>
      </header>

      {/* Прогресс-бар сверху */}
      <div className="rounded-lg border border-border/50 bg-card/40 p-5">
        <ProgressBar height={6} />
      </div>

      {/* Модули */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground/40">
            МОДУЛИ
          </span>
          <div className="flex-1 h-px bg-border" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COURSE_MODULES.map(mod => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ModuleCard({ mod }: { mod: Module }) {
  const lessonIds = mod.lessons.map(l => l.id)
  const publishedCount = mod.lessons.filter(l => l.status === 'published').length
  const allDraft = publishedCount === 0

  return (
    <Link
      href={moduleHref(mod)}
      className="group rounded-lg border border-border/50 bg-card/30 p-5 hover:border-border hover:bg-card/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ModuleIcon name={mod.icon} className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
              Модуль {String(mod.number).padStart(2, '0')}
            </p>
            <h2 className="text-base font-semibold leading-tight">{mod.title}</h2>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {mod.description}
      </p>

      <div className="flex items-center justify-between gap-3 text-xs font-mono">
        <span className="text-muted-foreground/60">
          {mod.lessons.length} {pluralLessons(mod.lessons.length)}
        </span>
        <ModuleProgressBadge lessonIds={lessonIds} totalCount={mod.lessons.length} draft={allDraft} />
      </div>
    </Link>
  )
}

function pluralLessons(n: number): string {
  if (n === 1) return 'урок'
  if (n >= 2 && n <= 4) return 'урока'
  return 'уроков'
}
