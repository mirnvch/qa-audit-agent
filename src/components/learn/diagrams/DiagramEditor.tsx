'use client'

// Excalidraw-редактор. Два режима:
//  - 'create' — кнопка «Сохранить» открывает DiagramSaveDialog с метаданными,
//    submit → createDiagram, редирект на каталог.
//  - 'edit'   — кнопка «Сохранить изменения» обновляет excalidraw_data + SVG
//    напрямую, без диалога. Отдельная кнопка «Свойства» открывает тот же
//    диалог в режиме редактирования метаданных (slug в edit-режиме immutable).
//
// Загружаем Excalidraw через next/dynamic с ssr: false — у него зависимость
// от window/Canvas + бандл больше 2MB.

import dynamic from 'next/dynamic'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Save, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagramSaveDialog, type DiagramSavePayload } from './DiagramSaveDialog'
import { updateDiagramAction } from '@/app/(admin)/learn/diagrams/actions'
import '@excalidraw/excalidraw/index.css'
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types'

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  {
    ssr: false,
    loading: () => <DiagramEditorSkeleton />,
  },
)

// Discriminated union — режимы с разной обвязкой props.
type CreateMode = {
  mode: 'create'
}
type EditMode = {
  mode: 'edit'
  existingSlug: string
  existingTitle: string
  existingDescription: string | null
  existingTags: string[]
}

type Props = (CreateMode | EditMode) & {
  /** initialData передаём в Excalidraw (на edit-странице — это elements/appState/files из БД). */
  initialData?: ExcalidrawInitialDataState
  /** Заголовок над редактором (по умолчанию — title диаграммы или «Новая диаграмма»). */
  heading?: string
}

export function DiagramEditor(props: Props) {
  const router = useRouter()
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const [pendingPayload, setPendingPayload] = useState<DiagramSavePayload | null>(null)
  const [showMetaDialog, setShowMetaDialog] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { resolvedTheme } = useTheme()
  const editorTheme: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light'

  /** Собирает elements/appState/files и экспортирует обе SVG. */
  const exportPayload = useCallback(async (): Promise<DiagramSavePayload | null> => {
    const api = apiRef.current
    if (!api) return null

    const elements = api.getSceneElements()
    const appState = api.getAppState()
    const files = api.getFiles()

    const { exportToSvg } = await import('@excalidraw/excalidraw')

    const lightSvgEl = await exportToSvg({
      elements: [...elements],
      appState: { ...appState, theme: 'light', exportBackground: false } as never,
      files,
    })
    const darkSvgEl = await exportToSvg({
      elements: [...elements],
      appState: { ...appState, theme: 'dark', exportBackground: false } as never,
      files,
    })

    return {
      excalidraw_data: { elements, appState, files },
      svg_light: lightSvgEl.outerHTML,
      svg_dark: darkSvgEl.outerHTML,
    }
  }, [])

  /** Create: открывает диалог с метаданными. */
  const handleCreateSave = useCallback(async () => {
    setExporting(true)
    try {
      const payload = await exportPayload()
      if (!payload) return
      setPendingPayload(payload)
    } catch (err) {
      console.error('Excalidraw export failed:', err)
      toast.error('Не удалось экспортировать SVG')
    } finally {
      setExporting(false)
    }
  }, [exportPayload])

  /** Edit: сразу пишет в БД, без диалога. */
  const handleEditSave = useCallback(async () => {
    if (props.mode !== 'edit') return
    setExporting(true)
    try {
      const payload = await exportPayload()
      if (!payload) return

      const result = await updateDiagramAction(props.existingSlug, {
        excalidraw_data: payload.excalidraw_data,
        svg_light: payload.svg_light,
        svg_dark: payload.svg_dark,
      })
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Изменения сохранены')
        router.refresh()
      }
    } catch (err) {
      console.error('Save failed:', err)
      toast.error('Не удалось сохранить')
    } finally {
      setExporting(false)
    }
  }, [props, exportPayload, router])

  const isEdit = props.mode === 'edit'

  return (
    <div className="flex h-full flex-col">
      {/* Кастомный топбар */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-2">
        <div className="text-sm font-medium tracking-tight truncate">
          {props.heading ?? (isEdit ? props.existingTitle : 'Новая диаграмма')}
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetaDialog(true)}
              disabled={exporting}
            >
              <Settings2 className="h-4 w-4" />
              Свойства
            </Button>
          )}
          <Button
            onClick={isEdit ? handleEditSave : handleCreateSave}
            disabled={exporting}
            size="sm"
          >
            <Save className="h-4 w-4" />
            {exporting
              ? 'Экспорт SVG…'
              : isEdit
                ? 'Сохранить изменения'
                : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Сам редактор. */}
      <div className="min-h-0 flex-1">
        <Excalidraw
          excalidrawAPI={(api) => { apiRef.current = api }}
          initialData={props.initialData}
          theme={editorTheme}
          UIOptions={{
            canvasActions: {
              // Прячем встроенный Save-в-файл — у нас своя логика записи в БД.
              saveToActiveFile: false,
            },
          }}
        />
      </div>

      {/* Save dialog (create mode): открывается после успешного экспорта. */}
      {props.mode === 'create' && pendingPayload && (
        <DiagramSaveDialog
          mode="create"
          payload={pendingPayload}
          onClose={() => setPendingPayload(null)}
        />
      )}

      {/* Metadata dialog (edit mode): только метаданные, без excalidraw_data. */}
      {props.mode === 'edit' && showMetaDialog && (
        <DiagramSaveDialog
          mode="edit-meta"
          existingSlug={props.existingSlug}
          existingTitle={props.existingTitle}
          existingDescription={props.existingDescription}
          existingTags={props.existingTags}
          onClose={() => setShowMetaDialog(false)}
        />
      )}
    </div>
  )
}

function DiagramEditorSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-muted/20">
      <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
        Загружаем редактор…
      </div>
    </div>
  )
}
