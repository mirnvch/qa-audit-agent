// Layout раздела /learn:
//  - вложенный сайдбар курса (CourseSidebar) слева
//  - основной контент справа (главная курса, страница модуля или страница урока)
//
// Сидбар админки уже отрисован родительским (admin)/layout.tsx — здесь только
// добавляем «второй уровень» навигации, относящийся к курсу.

import { CourseSidebar } from '@/components/learn/CourseSidebar'

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <CourseSidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
