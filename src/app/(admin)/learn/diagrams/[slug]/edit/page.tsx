// Страница редактирования существующей диаграммы.
// Server-side getBySlug → если null, 404; иначе грузим Excalidraw с initialData.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getBySlug } from '@/lib/learn/diagrams/api'
import { DiagramEditor } from '@/components/learn/diagrams/DiagramEditor'
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function EditDiagramPage({ params }: Props) {
  const { slug } = await params
  const diagram = await getBySlug(slug)
  if (!diagram) notFound()

  // excalidraw_data в БД — это jsonb (`unknown`). Cast нужен, потому что
  // на этапе записи у нас был тот же shape `{ elements, appState, files }`,
  // но в TS он не сохраняется через jsonb.
  const initialData = diagram.excalidraw_data as ExcalidrawInitialDataState

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-background px-4 py-2">
        <Link
          href="/learn/diagrams"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          К каталогу
        </Link>
        <span className="text-muted-foreground/40">·</span>
        <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {diagram.slug}
        </code>
      </div>

      <div className="min-h-0 flex-1">
        <DiagramEditor
          mode="edit"
          existingSlug={diagram.slug}
          existingTitle={diagram.title}
          existingDescription={diagram.description}
          existingTags={diagram.tags}
          initialData={initialData}
        />
      </div>
    </div>
  )
}
