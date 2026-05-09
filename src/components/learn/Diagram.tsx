'use client'

// <Diagram id="..." /> — компонент для встраивания в MDX-уроки.
// Client component (RSC через MDX-провайдер не работает с async server fn'ами).
//
// Поведение:
//  - mount → fetch по slug через browser-Supabase
//  - пока грузится — DiagramSkeleton (пульсирующий 3:2 серый блок)
//  - не нашли → DiagramNotFound (плашка с CTA создать)
//  - нашли   → DiagramFrame с DiagramSvgRenderer (обе SVG в DOM, переключение
//             через CSS по теме — без перерисовки)

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ImagePlus, AlertCircle } from 'lucide-react'
import { fetchDiagramForRender, type DiagramForRender } from '@/lib/learn/diagrams/client'
import { renderInlineMarkdown } from '@/lib/learn/inline-markdown'

type DiagramProps = {
  /** slug диаграммы (как в БД и в URL /learn/diagrams/<slug>/edit). */
  id: string
  /** Опц. подпись под диаграммой. По умолчанию — description из БД. */
  caption?: string
  /** Опц. переопределение title. По умолчанию — title из БД. */
  title?: string
}

export function Diagram({ id, caption, title }: DiagramProps) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'ok'; data: DiagramForRender }
    | { kind: 'missing' }
  >({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сбрасываем состояние при смене slug перед fetch'ем; альтернатив через useSyncExternalStore нет.
    setState({ kind: 'loading' })
    fetchDiagramForRender(id)
      .then(d => {
        if (cancelled) return
        if (d) setState({ kind: 'ok', data: d })
        else setState({ kind: 'missing' })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'missing' })
      })
    return () => { cancelled = true }
  }, [id])

  if (state.kind === 'loading') return <DiagramSkeleton />
  if (state.kind === 'missing') return <DiagramNotFound slug={id} />

  return (
    <DiagramFrame
      title={title ?? state.data.title}
      caption={caption ?? state.data.description ?? undefined}
    >
      <DiagramSvgRenderer svgLight={state.data.svg_light} svgDark={state.data.svg_dark} />
    </DiagramFrame>
  )
}

// ─── Frame ──────────────────────────────────────────────────────────────────

function DiagramFrame({
  title,
  caption,
  children,
}: {
  title?: string
  caption?: string
  children: React.ReactNode
}) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-lg border border-border/60 bg-card/30 lg:-mx-10 lg:w-[calc(100%+5rem)]">
      {title && (
        <div className="border-b border-border/40 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground/70">
          {title}
        </div>
      )}
      <div className="bg-muted/10 p-3 sm:p-4">
        {children}
      </div>
      {caption && (
        <figcaption className="border-t border-border/40 px-4 py-2 text-xs leading-relaxed text-muted-foreground">
          {renderInlineMarkdown(caption)}
        </figcaption>
      )}
    </figure>
  )
}

// ─── SVG renderer (обе темы в DOM, переключение через CSS) ──────────────────

function DiagramSvgRenderer({
  svgLight,
  svgDark,
}: {
  svgLight: string | null
  svgDark: string | null
}) {
  // Если хоть одна из тем не сохранена — показываем то, что есть.
  const hasLight = !!svgLight
  const hasDark = !!svgDark

  if (!hasLight && !hasDark) {
    return (
      <div className="flex h-32 items-center justify-center text-xs font-mono text-muted-foreground/60">
        SVG диаграммы не сгенерирован
      </div>
    )
  }

  // SVG занимает 100% ширины родителя, высоту считает по viewBox (preserveAspectRatio
  // у Excalidraw по умолчанию = xMidYMid meet → пропорциональный скейл, не растягивает).
  return (
    <div className="w-full">
      {hasLight && (
        <div
          className="diagram-svg-light [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:dark:hidden"
          dangerouslySetInnerHTML={{ __html: svgLight! }}
        />
      )}
      {hasDark && (
        <div
          className="diagram-svg-dark [&>svg]:hidden [&>svg]:h-auto [&>svg]:w-full [&>svg]:dark:block"
          dangerouslySetInnerHTML={{ __html: svgDark! }}
        />
      )}
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function DiagramSkeleton() {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-lg border border-border/60 bg-card/30 lg:-mx-10 lg:w-[calc(100%+5rem)]">
      <div className="aspect-[12/5] w-full bg-muted/30 animate-pulse" />
    </div>
  )
}

// ─── Not found ──────────────────────────────────────────────────────────────

function DiagramNotFound({ slug }: { slug: string }) {
  return (
    <div className="not-prose my-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-amber-400">
            Диаграмма «{slug}» не найдена
          </p>
          <p className="text-xs text-muted-foreground">
            Эта диаграмма ещё не создана. Открой каталог и нажми «Создать», использовав slug{' '}
            <code className="rounded bg-muted/40 px-1 py-0.5 font-mono text-[11px]">{slug}</code>.
          </p>
          <Link
            href="/learn/diagrams/new"
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-mono text-amber-400 hover:bg-amber-500/20"
          >
            <ImagePlus className="h-3 w-3" />
            Создать диаграмму
          </Link>
        </div>
      </div>
    </div>
  )
}
