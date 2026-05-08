// Каталог диаграмм. Server-side fetch + fs-scan, client-каталог рендерит UI.

import Link from 'next/link'
import { Plus, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { listDiagrams } from '@/lib/learn/diagrams/api'
import { getDiagramUsage } from '@/lib/learn/diagrams/used-in-lessons'
import { DiagramCatalog } from '@/components/learn/diagrams/DiagramCatalog'

export default async function DiagramsPage() {
  const [diagrams, usage] = await Promise.all([listDiagrams(), getDiagramUsage()])

  // Map → plain object для передачи в client-component (Maps не сериализуются через RSC).
  const usageMap: Record<string, string[]> = {}
  for (const [slug, lessons] of usage.entries()) usageMap[slug] = lessons

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Section · Обучение / Диаграммы
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Диаграммы курса</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {diagrams.length === 0
              ? 'Пока ни одной диаграммы — создай первую.'
              : `Всего ${diagrams.length} ${pluralDiagrams(diagrams.length)}.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/learn/diagrams/new">
            <Plus className="h-4 w-4" />
            Создать диаграмму
          </Link>
        </Button>
      </div>

      {/* Empty state / каталог */}
      {diagrams.length === 0 ? (
        <EmptyState />
      ) : (
        <DiagramCatalog diagrams={diagrams} usageMap={usageMap} />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-12 text-center">
      <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground/40" />
      <p className="mt-4 text-sm font-medium">Диаграмм пока нет</p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Создай первую — она появится тут и станет доступна для вставки в уроки.
      </p>
      <Button asChild className="mt-5">
        <Link href="/learn/diagrams/new">
          <Plus className="h-4 w-4" />
          Создать первую диаграмму
        </Link>
      </Button>
    </div>
  )
}

function pluralDiagrams(n: number): string {
  if (n === 1) return 'диаграмма'
  if (n >= 2 && n <= 4) return 'диаграммы'
  return 'диаграмм'
}
