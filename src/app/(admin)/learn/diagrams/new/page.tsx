// Страница создания новой диаграммы.
// Excalidraw занимает всё доступное пространство main (между Header'ом
// админки и нижним краем). На /learn/diagrams* CourseSidebar спрятан,
// так что слева — только основной admin-Sidebar.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DiagramEditor } from '@/components/learn/diagrams/DiagramEditor'

export default function NewDiagramPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Тонкая шапка с back-link — поверх редактора */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-background px-4 py-2">
        <Link
          href="/learn/diagrams"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          К каталогу
        </Link>
      </div>

      <div className="min-h-0 flex-1">
        <DiagramEditor mode="create" heading="Новая диаграмма" />
      </div>
    </div>
  )
}
