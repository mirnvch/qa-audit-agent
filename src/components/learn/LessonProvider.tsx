'use client'

// Прокидывает lessonId всем кастомным MDX-компонентам внутри текущего урока
// без необходимости писать <Checklist lessonId="1.1" ...> в каждом MDX-файле.
//
// Используется в src/app/(admin)/learn/[moduleId]/[lessonId]/page.tsx,
// читается хуком useLessonId() внутри Checklist, TextAnswerExercise и др.

import { createContext, useContext, type ReactNode } from 'react'

const LessonContext = createContext<string | null>(null)

export function LessonProvider({
  lessonId,
  children,
}: {
  lessonId: string
  children: ReactNode
}) {
  return <LessonContext.Provider value={lessonId}>{children}</LessonContext.Provider>
}

export function useLessonId(): string {
  const value = useContext(LessonContext)
  if (!value) {
    throw new Error('useLessonId() must be used inside <LessonProvider>')
  }
  return value
}
