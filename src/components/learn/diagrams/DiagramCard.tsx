'use client'

// Карточка диаграммы в каталоге.
// Hover: показываем три action-кнопки: Edit (Link), Duplicate (form action),
// Delete (AlertDialog → action).

import Link from 'next/link'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Copy, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  deleteDiagramAction,
  duplicateDiagramAction,
} from '@/app/(admin)/learn/diagrams/actions'
import type { DiagramSummary } from '@/lib/learn/diagrams/api'
import { cn } from '@/lib/utils'

type Props = {
  diagram: DiagramSummary
  usedInLessons: string[]
}

export function DiagramCard({ diagram, usedInLessons }: Props) {
  const router = useRouter()
  const [isDuplicating, startDuplicate] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDuplicate() {
    startDuplicate(async () => {
      const result = await duplicateDiagramAction(diagram.slug)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Создана копия', { description: result.slug })
      router.push(`/learn/diagrams/${result.slug}/edit`)
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteDiagramAction(diagram.slug)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Диаграмма удалена')
      setConfirmOpen(false)
      router.refresh()
    })
  }

  const usedCount = usedInLessons.length

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card/30 transition-colors hover:border-border hover:bg-card/50">
      {/* Превью */}
      <Link
        href={`/learn/diagrams/${diagram.slug}/edit`}
        className="relative block aspect-[3/2] w-full bg-muted/20"
      >
        {diagram.svg_light ? (
          <div
            className="absolute inset-0 flex items-center justify-center p-3 [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:w-auto [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: diagram.svg_light }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImagePlus className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}

        {/* Hover overlay с действиями */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
      </Link>

      {/* Action toolbar — поверх превью, виден только при hover */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/learn/diagrams/${diagram.slug}/edit`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background/95 text-muted-foreground shadow-sm hover:text-foreground"
          title="Редактировать"
        >
          <Pencil className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isDuplicating}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background/95 text-muted-foreground shadow-sm hover:text-foreground disabled:opacity-50"
          title="Дублировать"
        >
          {isDuplicating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
        </button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background/95 text-muted-foreground shadow-sm hover:text-destructive hover:border-destructive/40"
              title="Удалить"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить «{diagram.title}»?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  {usedCount > 0 ? (
                    <>
                      <p className="text-amber-400">
                        ⚠ Используется в {usedCount} {pluralLessons(usedCount)}:
                      </p>
                      <ul className="ml-2 list-disc list-inside font-mono text-xs">
                        {usedInLessons.map(l => <li key={l}>{l}</li>)}
                      </ul>
                      <p>После удаления вставки <code className="font-mono text-xs">{`<Diagram id="${diagram.slug}" />`}</code> в этих уроках сломаются.</p>
                    </>
                  ) : (
                    <p>Диаграмма не используется ни в одном уроке. Удалить безопасно.</p>
                  )}
                  <p className="text-xs text-muted-foreground/70">Это действие нельзя отменить.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Метаданные */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-medium leading-snug">{diagram.title}</h3>
        </div>
        <code className="self-start rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {diagram.slug}
        </code>
        {diagram.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {diagram.description}
          </p>
        )}
        {diagram.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {diagram.tags.map(t => (
              <span
                key={t}
                className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[10px] font-mono text-muted-foreground/60">
          <span>{relativeDate(diagram.created_at)}</span>
          <span className={cn(
            'inline-flex items-center gap-1',
            usedCount > 0 ? 'text-emerald-400/80' : 'text-muted-foreground/40',
          )}>
            {usedCount > 0
              ? `Используется в ${usedCount} ${pluralLessons(usedCount)}`
              : 'Не используется'}
          </span>
        </div>
      </div>
    </div>
  )
}

function pluralLessons(n: number): string {
  if (n === 1) return 'уроке'
  if (n >= 2 && n <= 4) return 'уроках'
  return 'уроках'
}

/** «N дней назад» / «вчера» / «сегодня» — упрощённый relativeTime без зависимостей. */
function relativeDate(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = now - then
  const day = 24 * 60 * 60 * 1000
  if (diffMs < day) return 'сегодня'
  if (diffMs < 2 * day) return 'вчера'
  const days = Math.floor(diffMs / day)
  if (days < 7) return `${days} ${pluralDays(days)} назад`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} ${pluralWeeks(weeks)} назад`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} ${pluralMonths(months)} назад`
  }
  const years = Math.floor(days / 365)
  return `${years} ${pluralYears(years)} назад`
}

function pluralDays(n: number): string {
  if (n === 1) return 'день'
  if (n >= 2 && n <= 4) return 'дня'
  return 'дней'
}
function pluralWeeks(n: number): string {
  if (n === 1) return 'неделю'
  if (n >= 2 && n <= 4) return 'недели'
  return 'недель'
}
function pluralMonths(n: number): string {
  if (n === 1) return 'месяц'
  if (n >= 2 && n <= 4) return 'месяца'
  return 'месяцев'
}
function pluralYears(n: number): string {
  if (n === 1) return 'год'
  if (n >= 2 && n <= 4) return 'года'
  return 'лет'
}
