'use client'

// Диалог сохранения метаданных. Два режима:
//  - 'create'    — открывается из DiagramEditor с уже подготовленным payload
//                  (excalidraw_data + обе SVG); submit вызывает saveDiagramAction.
//  - 'edit-meta' — открывается из edit-страницы (кнопка «Свойства»);
//                  меняет только title/description/tags. Slug в этом режиме
//                  immutable — иначе ломаются вставки <Diagram id="..." />
//                  во всех уроках.

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { isValidSlug, slugError, suggestSlug } from '@/lib/learn/diagrams/validate-slug'
import {
  saveDiagramAction,
  updateDiagramMetadataAction,
} from '@/app/(admin)/learn/diagrams/actions'

export type DiagramSavePayload = {
  excalidraw_data: unknown
  svg_light: string
  svg_dark: string
}

type CreateProps = {
  mode: 'create'
  payload: DiagramSavePayload
  onClose: () => void
}

type EditMetaProps = {
  mode: 'edit-meta'
  existingSlug: string
  existingTitle: string
  existingDescription: string | null
  existingTags: string[]
  onClose: () => void
}

type Props = CreateProps | EditMetaProps

export function DiagramSaveDialog(props: Props) {
  const router = useRouter()
  const isEdit = props.mode === 'edit-meta'

  const [title, setTitle] = useState(isEdit ? props.existingTitle : '')
  const [slug, setSlug] = useState(isEdit ? props.existingSlug : '')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState(isEdit ? (props.existingDescription ?? '') : '')
  const [tagsRaw, setTagsRaw] = useState(isEdit ? props.existingTags.join(', ') : '')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Auto-suggest slug в create-режиме, пока пользователь его руками не правил.
  useEffect(() => {
    if (isEdit || slugTouched) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизируем slug со внешним полем (title); legitimate derived-state pattern до touch.
    setSlug(suggestSlug(title))
  }, [title, slugTouched, isEdit])

  const tags = useMemo(
    () => tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
    [tagsRaw],
  )

  const localSlugError = !isEdit && slug ? slugError(slug) : null
  const canSubmit = title.trim().length > 0 && (isEdit || isValidSlug(slug)) && !isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setServerError(null)

    startTransition(async () => {
      if (props.mode === 'create') {
        const result = await saveDiagramAction({
          slug,
          title: title.trim(),
          description: description.trim() || null,
          tags,
          excalidraw_data: props.payload.excalidraw_data,
          svg_light: props.payload.svg_light,
          svg_dark: props.payload.svg_dark,
        })

        if ('error' in result) {
          setServerError(result.error)
          toast.error(result.error)
          return
        }

        toast.success('Диаграмма сохранена', { description: result.slug })
        props.onClose()
        router.push('/learn/diagrams')
        router.refresh()
      } else {
        // edit-meta: меняем только метаданные, slug immutable
        const result = await updateDiagramMetadataAction(props.existingSlug, {
          title: title.trim(),
          description: description.trim() || null,
          tags,
        })

        if ('error' in result) {
          setServerError(result.error)
          toast.error(result.error)
          return
        }

        toast.success('Метаданные обновлены')
        props.onClose()
        router.refresh()
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) props.onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Свойства диаграммы' : 'Сохранить диаграмму'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? <>Slug нельзя менять — иначе сломаются вставки <code className="font-mono text-xs">{`<Diagram id="${slug}" />`}</code> в уроках.</>
              : <>Slug — это id, по которому диаграмма вставляется в MDX:{' '}
                <code className="font-mono text-xs">{`<Diagram id="${slug || 'your-slug'}" />`}</code></>}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="diagram-title" className="text-sm font-medium">
              Название <span className="text-destructive">*</span>
            </label>
            <Input
              id="diagram-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Маленькое кафе vs большой ресторан"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="diagram-slug" className="text-sm font-medium">
              Slug {!isEdit && <span className="text-destructive">*</span>}
              {isEdit && <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">readonly</span>}
            </label>
            <Input
              id="diagram-slug"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
              placeholder="cafe-vs-restaurant"
              className="font-mono"
              required
              readOnly={isEdit}
              disabled={isEdit}
            />
            {localSlugError && (
              <p className="text-xs text-destructive">{localSlugError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="diagram-tags" className="text-sm font-medium">
              Теги
            </label>
            <Input
              id="diagram-tags"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="architecture, lesson-1.1, intro"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Через запятую. {tags.length > 0 && <>Получится: {tags.map(t => <code key={t} className="mx-0.5 rounded bg-muted/40 px-1 font-mono text-[10px]">{t}</code>)}</>}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="diagram-description" className="text-sm font-medium">
              Описание
            </label>
            <textarea
              id="diagram-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Что показывает эта диаграмма (1–2 предложения)…"
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            />
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={props.onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Сохранить' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
