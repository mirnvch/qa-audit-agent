// CRUD для diagrams. Использует server-client (с cookies + RLS).
// Все методы async; ошибки возвращаются как { error: string }.

import { createClient } from '@/lib/supabase/server'
import type { Diagram } from '@/lib/supabase/types'

export type DiagramSummary = Pick<
  Diagram,
  'id' | 'slug' | 'title' | 'description' | 'tags' | 'svg_light' | 'created_at' | 'updated_at'
>

export async function listDiagrams(): Promise<DiagramSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('id, slug, title, description, tags, svg_light, created_at, updated_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('listDiagrams failed:', error)
    return []
  }
  return (data ?? []) as DiagramSummary[]
}

export async function getBySlug(slug: string): Promise<Diagram | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error(`getBySlug(${slug}) failed:`, error)
    return null
  }
  return (data as Diagram | null) ?? null
}

export async function slugExists(slug: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error(`slugExists(${slug}) failed:`, error)
    return false
  }
  return !!data
}

// ─── Create ────────────────────────────────────────────────────────────────

export type CreateDiagramInput = {
  slug: string
  title: string
  description?: string | null
  tags?: string[]
  excalidraw_data: unknown
  svg_light?: string | null
  svg_dark?: string | null
}

export async function createDiagram(input: CreateDiagramInput)
  : Promise<{ id: string; slug: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('diagrams')
    .insert({
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      tags: input.tags ?? [],
      excalidraw_data: input.excalidraw_data as never,
      svg_light: input.svg_light ?? null,
      svg_dark: input.svg_dark ?? null,
      created_by: user?.id ?? null,
    })
    .select('id, slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Диаграмма с таким slug уже существует' }
    }
    return { error: error.message }
  }
  return data
}

// ─── Update content (excalidraw_data + SVG) ────────────────────────────────

export type UpdateDiagramContent = {
  excalidraw_data: unknown
  svg_light: string | null
  svg_dark: string | null
}

export async function updateDiagram(slug: string, patch: UpdateDiagramContent)
  : Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .update({
      excalidraw_data: patch.excalidraw_data as never,
      svg_light: patch.svg_light,
      svg_dark: patch.svg_dark,
    })
    .eq('slug', slug)
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }
  return data
}

// ─── Update metadata (title/description/tags, без слога) ───────────────────

export type UpdateDiagramMetadata = {
  title?: string
  description?: string | null
  tags?: string[]
}

export async function updateDiagramMetadata(slug: string, patch: UpdateDiagramMetadata)
  : Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (patch.title !== undefined) updates.title = patch.title
  if (patch.description !== undefined) updates.description = patch.description
  if (patch.tags !== undefined) updates.tags = patch.tags

  if (Object.keys(updates).length === 0) {
    return { error: 'Нет изменений' }
  }

  const { data, error } = await supabase
    .from('diagrams')
    .update(updates)
    .eq('slug', slug)
    .select('id')
    .single()

  if (error) return { error: error.message }
  return data
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteDiagramBySlug(slug: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('diagrams').delete().eq('slug', slug)
  if (error) return { error: error.message }
  return { ok: true }
}

// ─── Duplicate ─────────────────────────────────────────────────────────────
// Создаёт копию: slug -> slug-copy, slug-copy-2, slug-copy-3 (увеличиваем
// суффикс пока не найдём свободный). Title — "Title (копия)".

export async function duplicateDiagram(sourceSlug: string)
  : Promise<{ slug: string } | { error: string }> {
  const original = await getBySlug(sourceSlug)
  if (!original) return { error: 'Источник не найден' }

  // Подбираем свободный slug.
  let candidate = `${sourceSlug}-copy`
  let n = 2
  while (await slugExists(candidate)) {
    candidate = `${sourceSlug}-copy-${n}`
    n += 1
    if (n > 50) return { error: 'Не удалось подобрать уникальный slug' }
  }

  const result = await createDiagram({
    slug: candidate,
    title: `${original.title} (копия)`,
    description: original.description ?? null,
    tags: original.tags,
    excalidraw_data: original.excalidraw_data,
    svg_light: original.svg_light,
    svg_dark: original.svg_dark,
  })

  if ('error' in result) return result
  return { slug: result.slug }
}
