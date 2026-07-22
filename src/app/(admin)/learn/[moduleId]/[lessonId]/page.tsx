// Страница урока /learn/<moduleId>/<lessonId>:
//  - крошки (Курс → Модуль → Урок)
//  - LessonHeader с метаблоком и «главной мыслью»
//  - сам контент урока — MDX, импортируется через явный реестр (см. lessons-registry.ts)
//  - LessonProvider пробрасывает lessonId в Checklist/TextAnswerExercise через контекст
//  - кнопка «Я прошёл урок»
//  - LessonNavigation (предыдущий/следующий)

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import {
  ALL_MODULES,
  courseForModule,
  findLesson,
  getLessonNeighbours,
} from '@/lib/learn/course-config'
import { getLessonImporter } from '@/lib/learn/lessons-registry'
import { LessonHeader } from '@/components/learn/LessonHeader'
import { LessonNavigation } from '@/components/learn/LessonNavigation'
import { CompleteLessonButton } from '@/components/learn/CompleteLessonButton'
import { LessonProvider } from '@/components/learn/LessonProvider'
import { CourseSidebarMobileTrigger } from '@/components/learn/CourseSidebarMobileTrigger'

type Props = {
  params: Promise<{ moduleId: string; lessonId: string }>
}

// Префетчим все известные пары (все курсы) на этапе сборки.
export function generateStaticParams() {
  return ALL_MODULES.flatMap(m =>
    m.lessons.map(l => ({ moduleId: m.id, lessonId: l.slug })),
  )
}

export default async function LessonPage({ params }: Props) {
  const { moduleId, lessonId } = await params
  const found = findLesson(moduleId, lessonId)
  if (!found) notFound()

  const { module: mod, lesson } = found
  const neighbours = getLessonNeighbours(moduleId, lessonId)
  const courseHref = courseForModule(mod.id)?.landingHref ?? '/learn'

  // Импорт MDX через явный реестр — см. lessons-registry.ts.
  const importer = getLessonImporter(lesson.mdxPath)
  const LessonContent = importer ? (await importer()).default : null

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10 max-w-3xl mx-auto space-y-10">
      {/* Хлебные крошки + mobile-меню */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-muted-foreground">
        <CourseSidebarMobileTrigger className="mr-1" />
        <Link href={courseHref} className="hover:text-foreground transition-colors">Курс</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <Link href={`/learn/${mod.id}`} className="hover:text-foreground transition-colors">
          Модуль {mod.number}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-foreground">Урок {lesson.id}</span>
      </nav>

      {/* Шапка урока */}
      <LessonHeader module={mod} lesson={lesson} mainIdea={lesson.mainIdea} />

      {/* Контент MDX */}
      {LessonContent ? (
        <LessonProvider lessonId={lesson.id}>
          <article className="learn-prose prose prose-sm dark:prose-invert max-w-none
                              prose-headings:font-semibold prose-headings:tracking-tight
                              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
                              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                              prose-p:leading-relaxed
                              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                              prose-code:before:content-none prose-code:after:content-none
                              prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0">
            <LessonContent />
          </article>
        </LessonProvider>
      ) : (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-amber-400 mb-2">
            Контент урока пока не готов
          </p>
          <p className="text-sm text-muted-foreground">
            Урок не зарегистрирован в <code className="font-mono">lessons-registry.ts</code>.
            Это заглушка — добавь импорт <code className="font-mono">{lesson.mdxPath}</code> в реестр,
            когда .mdx-файл будет готов.
          </p>
        </div>
      )}

      {/* Отметить пройденным */}
      <div className="flex justify-center pt-2">
        <CompleteLessonButton lessonId={lesson.id} />
      </div>

      {/* Сепаратор */}
      <div className="h-px bg-border/50" />

      {/* Навигация */}
      <LessonNavigation prev={neighbours.prev} next={neighbours.next} />
    </div>
  )
}
