'use client'

// Левое меню раздела /learn:
//  - desktop: collapsed/expanded (collapsed = узкая полоска с иконками модулей)
//  - mobile (<lg): overlay по событию `course-sidebar:toggle` (см. CourseSidebarMobileTrigger)
//  - дефолт по pathname:
//      /learn/<mod>/<slug>          → collapsed (даём место уроку и диаграммам)
//      /learn, /learn/<mod>         → expanded
//  - localStorage[STATE_KEY] хранит явное user-override; если null — используется дефолт.
//
// Мультикурсовость: панель показывает ВСЕ курсы (COURSES) как заголовки-ссылки на их
// обложки. Модули раскрыты у активного курса (courseForPath по pathname); клик по
// заголовку другого курса переключает панель на него. Так в панели видны оба курса.

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Lock,
  Circle,
  CircleDashed,
  GraduationCap,
  X,
} from 'lucide-react'
import {
  COURSES,
  courseForPath,
  courseLessonCount,
  lessonHref,
  moduleHref,
  type Course,
  type Module,
  type Lesson,
} from '@/lib/learn/course-config'
import { ModuleIcon } from '@/lib/learn/icon-map'
import { getCompletedLessons, PROGRESS_EVENT } from '@/lib/learn/progress'
import { ProgressBar } from './ProgressBar'
import { cn } from '@/lib/utils'

const STATE_KEY = 'nexus-course:sidebar-collapsed'
const EXPAND_KEY = 'nexus-course:sidebar-expanded-modules'

// ─── Дефолт по типу страницы ────────────────────────────────────────────────

function defaultCollapsedFor(pathname: string): boolean {
  // /learn/<moduleId>/<lessonSlug> = страница урока (3 сегмента после слэша)
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'learn') return false
  if (segments[1] === 'diagrams') return false
  return segments.length >= 3
}

// Какой модуль раскрыть по умолчанию: текущий (если это реальный модуль) либо
// первый модуль активного курса (напр. на обложке /learn/testing-types).
function defaultExpandedModuleId(pathname: string): string {
  const current = currentModuleIdFromPath(pathname)
  const course = courseForPath(pathname)
  if (current && course.modules.some(m => m.id === current)) return current
  return course.modules[0]?.id ?? ''
}

// ─── Главный компонент ──────────────────────────────────────────────────────

export function CourseSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // SSR-safe инициализация из pathname; localStorage читаем после mount.
  const [collapsed, setCollapsed] = useState<boolean>(() => defaultCollapsedFor(pathname))
  const [expandedSet, setExpandedSet] = useState<Set<string>>(
    () => new Set([defaultExpandedModuleId(pathname)]),
  )
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set())
  const [mobileOpen, setMobileOpen] = useState(false)
  // Курс, свёрнутый пользователем вручную (прячет свои модули). Активный курс
  // раскрыт по умолчанию; повторный клик по его заголовку сворачивает дерево.
  const [collapsedCourseId, setCollapsedCourseId] = useState<string | null>(null)

  // Гидратация collapsed из localStorage (с fallback на pathname-default).
  // Зависим от pathname, чтобы при навигации между типами страниц
  // (если у пользователя нет override) дефолт переключался.
  useEffect(() => {
    const raw = window.localStorage.getItem(STATE_KEY)
    if (raw === '0') setCollapsed(false)
    else if (raw === '1') setCollapsed(true)
    else setCollapsed(defaultCollapsedFor(pathname))
  }, [pathname])

  // Гидратация expanded modules из localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EXPAND_KEY)
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      setExpandedSet(new Set(
        arr.length > 0 ? arr : [defaultExpandedModuleId(pathname)],
      ))
    } catch {
      setExpandedSet(new Set([defaultExpandedModuleId(pathname)]))
    }
  }, [pathname])

  // Прогресс subscription.
  useEffect(() => {
    function recalc() {
      setCompletedSet(new Set(getCompletedLessons()))
    }
    recalc()
    window.addEventListener(PROGRESS_EVENT, recalc)
    window.addEventListener('storage', recalc)
    return () => {
      window.removeEventListener(PROGRESS_EVENT, recalc)
      window.removeEventListener('storage', recalc)
    }
  }, [])

  // Mobile open/close через custom events + ESC.
  useEffect(() => {
    const open = () => setMobileOpen(true)
    const close = () => setMobileOpen(false)
    const toggle = () => setMobileOpen(prev => !prev)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('course-sidebar:open', open)
    window.addEventListener('course-sidebar:close', close)
    window.addEventListener('course-sidebar:toggle', toggle)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('course-sidebar:open', open)
      window.removeEventListener('course-sidebar:close', close)
      window.removeEventListener('course-sidebar:toggle', toggle)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // При смене URL — закрываем mobile overlay, чтобы клик по уроку не оставлял открытым.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      window.localStorage.setItem(STATE_KEY, next ? '1' : '0')
      return next
    })
  }
  function toggleModule(id: string) {
    setExpandedSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      window.localStorage.setItem(EXPAND_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  const currentModuleId = useMemo(() => currentModuleIdFromPath(pathname), [pathname])
  const activeCourse = useMemo(() => courseForPath(pathname), [pathname])

  // Клик по заголовку курса: другой курс → переключаемся на него; тот же
  // (активный) курс → сворачиваем/разворачиваем его дерево модулей на месте.
  function handleCourseClick(course: Course) {
    if (course.id === activeCourse.id) {
      setCollapsedCourseId(prev => (prev === course.id ? null : course.id))
    } else {
      router.push(course.landingHref)
    }
  }

  // На страницах /learn/diagrams — sidebar мешает, прячем.
  // Ранний return — ПОСЛЕ всех hooks (rules of hooks).
  if (pathname.startsWith('/learn/diagrams')) return null

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          // Mobile: overlay, slide-in.
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border/50 bg-background',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: в потоке (static), переход по width при collapse/expand.
          'lg:static lg:z-auto lg:translate-x-0',
          'lg:transition-[width] lg:duration-200 lg:ease-out',
          collapsed ? 'lg:w-16' : 'lg:w-[280px]',
        )}
        aria-label="Меню курсов"
      >
        {/* Mobile view: всегда expanded + кнопка close */}
        <div className="flex flex-1 flex-col lg:hidden">
          <ExpandedHeader mode="mobile" onAction={() => setMobileOpen(false)} />
          <ProgressSection course={activeCourse} />
          <CourseList
            courses={COURSES}
            activeCourseId={activeCourse.id}
            collapsedCourseId={collapsedCourseId}
            onCourseClick={handleCourseClick}
            currentPath={pathname}
            expandedSet={expandedSet}
            toggleModule={toggleModule}
            completedSet={completedSet}
          />
        </div>

        {/* Desktop view: collapsed/expanded */}
        <div className="hidden flex-1 flex-col lg:flex">
          {collapsed ? (
            <CollapsedDesktop
              courses={COURSES}
              currentModuleId={currentModuleId}
              completedSet={completedSet}
              onExpand={toggleCollapsed}
            />
          ) : (
            <>
              <ExpandedHeader mode="desktop" onAction={toggleCollapsed} />
              <ProgressSection course={activeCourse} />
              <CourseList
                courses={COURSES}
                activeCourseId={activeCourse.id}
                collapsedCourseId={collapsedCourseId}
                onCourseClick={handleCourseClick}
                currentPath={pathname}
                expandedSet={expandedSet}
                toggleModule={toggleModule}
                completedSet={completedSet}
              />
            </>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Components: Expanded view ──────────────────────────────────────────────

function ExpandedHeader({
  mode,
  onAction,
}: {
  mode: 'mobile' | 'desktop'
  onAction: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-4">
      <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
        Курсы
      </span>
      <button
        type="button"
        onClick={onAction}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        aria-label={mode === 'mobile' ? 'Закрыть меню' : 'Свернуть меню'}
      >
        {mode === 'mobile' ? <X className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </div>
  )
}

function ProgressSection({ course }: { course: Course }) {
  const scopeIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
  return (
    <div className="border-b border-border/50 px-4 pt-4 pb-3">
      <ProgressBar scopeIds={scopeIds} />
      <p className="mt-2 text-[10px] font-mono text-muted-foreground/50 truncate">
        {course.title} · {courseLessonCount(course)} уроков
      </p>
    </div>
  )
}

// ─── Список курсов → модулей → уроков ───────────────────────────────────────

function CourseList({
  courses,
  activeCourseId,
  collapsedCourseId,
  onCourseClick,
  currentPath,
  expandedSet,
  toggleModule,
  completedSet,
}: {
  courses: Course[]
  activeCourseId: string
  collapsedCourseId: string | null
  onCourseClick: (course: Course) => void
  currentPath: string
  expandedSet: Set<string>
  toggleModule: (id: string) => void
  completedSet: Set<string>
}) {
  return (
    <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
      {courses.map(course => {
        const isActive = course.id === activeCourseId
        // Дерево модулей видно, только если курс активен И не свёрнут вручную.
        const isOpen = isActive && collapsedCourseId !== course.id
        return (
          <div key={course.id}>
            <CourseHeader
              course={course}
              isActive={isActive}
              isOpen={isOpen}
              completed={completedSet}
              onClick={() => onCourseClick(course)}
            />
            {isOpen && (
              <div className="mt-1 space-y-0.5">
                {course.modules.map(module => (
                  <ModuleNode
                    key={module.id}
                    module={module}
                    expanded={expandedSet.has(module.id)}
                    onToggle={() => toggleModule(module.id)}
                    completed={completedSet}
                    currentPath={currentPath}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function CourseHeader({
  course,
  isActive,
  isOpen,
  completed,
  onClick,
}: {
  course: Course
  isActive: boolean
  isOpen: boolean
  completed: Set<string>
  onClick: () => void
}) {
  const total = courseLessonCount(course)
  const done = course.modules.flatMap(m => m.lessons).filter(l => completed.has(l.id)).length

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      title={isActive ? (isOpen ? 'Свернуть курс' : 'Развернуть курс') : `Перейти к курсу: ${course.title}`}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] font-semibold transition-colors',
        isActive
          ? 'bg-primary/10 text-foreground'
          : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted/30',
      )}
    >
      <span className="text-muted-foreground/50 shrink-0">
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </span>
      <GraduationCap className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/50')} />
      <span className="flex-1 truncate leading-tight">{course.title}</span>
      <span className={cn(
        'text-[10px] font-mono shrink-0',
        done === total && total > 0 ? 'text-emerald-400' : 'text-muted-foreground/50',
      )}>
        {done}/{total}
      </span>
    </button>
  )
}

function ModuleNode({
  module,
  expanded,
  onToggle,
  completed,
  currentPath,
}: {
  module: Module
  expanded: boolean
  onToggle: () => void
  completed: Set<string>
  currentPath: string
}) {
  const isModuleActive = currentPath === moduleHref(module) || currentPath.startsWith(moduleHref(module) + '/')
  const moduleCompletedCount = module.lessons.filter(l => completed.has(l.id)).length
  const isFullyDone = moduleCompletedCount === module.lessons.length

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
          isModuleActive ? 'bg-muted/40 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
        )}
      >
        <span className="text-muted-foreground/50">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground/70 w-5 shrink-0">
          {String(module.number).padStart(2, '0')}
        </span>
        <span className="flex-1 truncate">{module.title}</span>
        <span className={cn(
          'text-[10px] font-mono shrink-0',
          isFullyDone ? 'text-emerald-400' : 'text-muted-foreground/50',
        )}>
          {moduleCompletedCount}/{module.lessons.length}
        </span>
      </button>

      {expanded && (
        <ul className="ml-7 mt-0.5 space-y-0.5 border-l border-border/30 pl-3">
          {module.lessons.map(lesson => (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              isActive={currentPath === lessonHref(lesson)}
              isCompleted={completed.has(lesson.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function LessonNode({
  lesson,
  isActive,
  isCompleted,
}: {
  lesson: Lesson
  isActive: boolean
  isCompleted: boolean
}) {
  const isLocked = lesson.status === 'locked'

  const Icon = isLocked ? Lock
             : isCompleted ? CheckCircle2
             : lesson.status === 'draft' ? CircleDashed
             : Circle

  const iconClass = isLocked ? 'text-muted-foreground/40'
                  : isCompleted ? 'text-emerald-400'
                  : lesson.status === 'draft' ? 'text-amber-400/70'
                  : 'text-muted-foreground/50'

  if (isLocked) {
    return (
      <li>
        <div className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px] text-muted-foreground/40 cursor-not-allowed">
          <Icon className={cn('h-3 w-3 shrink-0', iconClass)} />
          <span className="font-mono text-[10px]">{lesson.id}</span>
          <span className="truncate">{lesson.title}</span>
        </div>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={lessonHref(lesson)}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1 text-[12px] transition-colors',
          isActive
            ? 'bg-primary/10 text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
        )}
      >
        <Icon className={cn('h-3 w-3 shrink-0', iconClass)} />
        <span className="font-mono text-[10px] text-muted-foreground/70">{lesson.id}</span>
        <span className="truncate">{lesson.title}</span>
      </Link>
    </li>
  )
}

// ─── Components: Collapsed desktop view ────────────────────────────────────

function CollapsedDesktop({
  courses,
  currentModuleId,
  completedSet,
  onExpand,
}: {
  courses: Course[]
  currentModuleId: string | undefined
  completedSet: Set<string>
  onExpand: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center py-3">
      <button
        type="button"
        onClick={onExpand}
        className="mb-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        aria-label="Развернуть меню"
        title="Развернуть меню"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>

      <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto" aria-label="Курсы и модули">
        {courses.map((course, ci) => (
          <div key={course.id} className="flex flex-col items-center gap-1">
            {ci > 0 && <div className="my-1 h-px w-6 bg-border/50" aria-hidden="true" />}
            <Link
              href={course.landingHref}
              title={`Курс: ${course.title}`}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground"
            >
              <GraduationCap className="h-[18px] w-[18px]" />
            </Link>
            {course.modules.map(module => {
              const isActive = currentModuleId === module.id
              const completedCount = module.lessons.filter(l => completedSet.has(l.id)).length
              const isFullyDone = completedCount === module.lessons.length
              return (
                <Link
                  key={module.id}
                  href={moduleHref(module)}
                  title={`Модуль ${module.number}: ${module.title}`}
                  className={cn(
                    'group relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/15 text-foreground'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                  )}
                >
                  <ModuleIcon name={module.icon} className="h-[18px] w-[18px]" />
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-2 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                    />
                  )}
                  {isFullyDone && !isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400"
                    />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function currentModuleIdFromPath(pathname: string): string | undefined {
  const m = pathname.match(/^\/learn\/([^/]+)/)
  if (!m) return undefined
  if (m[1] === 'diagrams') return undefined
  if (m[1] === 'testing-types') return undefined
  return m[1]
}
