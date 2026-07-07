// localStorage-хранилище прогресса по курсу.
// Все ключи под префиксом nexus-course:* — позже легко мигрировать в Supabase.
//
// SSR-безопасность: каждая функция сначала проверяет, что typeof window !== 'undefined'.
// На сервере чтение возвращает безопасный дефолт, запись no-op.

const NS = 'nexus-course'

const K_COMPLETED = `${NS}:completed-lessons`            // string[] — id уроков
const K_ANSWERS   = `${NS}:exercise-answers`             // { [`${lessonId}/${exerciseId}`]: string }
const K_FEEDBACK  = `${NS}:exercise-feedback`            // { [`${lessonId}/${exerciseId}`]: ExerciseFeedback }
const K_CHECK     = `${NS}:checklist`                    // { [`${lessonId}/${checklistId}`]: boolean[] }

function isClient() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readJson<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isClient()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // QuotaExceeded и т.п. — молча игнорируем
  }
}

// ─── Пройденные уроки ──────────────────────────────────────

export function getCompletedLessons(): string[] {
  return readJson<string[]>(K_COMPLETED, [])
}

export function isLessonCompleted(lessonId: string): boolean {
  return getCompletedLessons().includes(lessonId)
}

export function markLessonCompleted(lessonId: string) {
  const list = getCompletedLessons()
  if (list.includes(lessonId)) return
  writeJson(K_COMPLETED, [...list, lessonId])
}

export function unmarkLessonCompleted(lessonId: string) {
  const list = getCompletedLessons()
  writeJson(K_COMPLETED, list.filter(id => id !== lessonId))
}

export function getCompletedCount(): number {
  return getCompletedLessons().length
}

// ─── Ответы на упражнения ──────────────────────────────────

type AnswersMap = Record<string, string>

export type ExerciseFeedback = {
  summary: string
  scoreLabel: 'strong' | 'ok' | 'needs_work'
  strengths: string[]
  gaps: string[]
  corrections: string[]
  nextSteps: string[]
}

type FeedbackMap = Record<string, ExerciseFeedback>

export function getExerciseAnswer(lessonId: string, exerciseId: string): string | null {
  const all = readJson<AnswersMap>(K_ANSWERS, {})
  return all[`${lessonId}/${exerciseId}`] ?? null
}

export function saveExerciseAnswer(lessonId: string, exerciseId: string, answer: string) {
  const all = readJson<AnswersMap>(K_ANSWERS, {})
  all[`${lessonId}/${exerciseId}`] = answer
  writeJson(K_ANSWERS, all)
}

export function getExerciseFeedback(lessonId: string, exerciseId: string): ExerciseFeedback | null {
  const all = readJson<FeedbackMap>(K_FEEDBACK, {})
  return all[`${lessonId}/${exerciseId}`] ?? null
}

export function saveExerciseFeedback(
  lessonId: string,
  exerciseId: string,
  feedback: ExerciseFeedback | null,
) {
  const all = readJson<FeedbackMap>(K_FEEDBACK, {})
  const key = `${lessonId}/${exerciseId}`
  if (feedback) {
    all[key] = feedback
  } else {
    delete all[key]
  }
  writeJson(K_FEEDBACK, all)
}

// ─── Чек-листы ────────────────────────────────────────────

type ChecklistMap = Record<string, boolean[]>

export function getChecklistState(lessonId: string, checklistId: string): boolean[] | null {
  const all = readJson<ChecklistMap>(K_CHECK, {})
  return all[`${lessonId}/${checklistId}`] ?? null
}

export function saveChecklistState(lessonId: string, checklistId: string, items: boolean[]) {
  const all = readJson<ChecklistMap>(K_CHECK, {})
  all[`${lessonId}/${checklistId}`] = items
  writeJson(K_CHECK, all)
}

// ─── События для синхронизации UI между вкладками/компонентами ──

export const PROGRESS_EVENT = 'nexus-course:progress-changed'

export function emitProgressChanged() {
  if (!isClient()) return
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT))
}
