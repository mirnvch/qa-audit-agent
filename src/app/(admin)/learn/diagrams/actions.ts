'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createDiagram,
  deleteDiagramBySlug,
  duplicateDiagram,
  slugExists,
  updateDiagram,
  updateDiagramMetadata,
  type CreateDiagramInput,
  type UpdateDiagramContent,
  type UpdateDiagramMetadata,
} from '@/lib/learn/diagrams/api'
import { isValidSlug } from '@/lib/learn/diagrams/validate-slug'

// ─── Create ────────────────────────────────────────────────────────────────

export async function saveDiagramAction(input: CreateDiagramInput)
  : Promise<{ id: string; slug: string } | { error: string }> {

  if (!input.slug || !isValidSlug(input.slug)) {
    return { error: 'Невалидный slug' }
  }
  if (!input.title || input.title.trim().length === 0) {
    return { error: 'Название обязательно' }
  }
  if (!input.excalidraw_data) {
    return { error: 'Пустой excalidraw_data — нельзя сохранить' }
  }

  if (await slugExists(input.slug)) {
    return { error: `Диаграмма с slug "${input.slug}" уже существует` }
  }

  const result = await createDiagram(input)
  if ('error' in result) return result

  revalidatePath('/learn/diagrams')
  return result
}

// ─── Update excalidraw_data + SVG ──────────────────────────────────────────

export async function updateDiagramAction(slug: string, patch: UpdateDiagramContent)
  : Promise<{ id: string } | { error: string }> {
  if (!isValidSlug(slug)) return { error: 'Невалидный slug' }
  if (!patch.excalidraw_data) return { error: 'Пустой excalidraw_data' }

  const result = await updateDiagram(slug, patch)
  if ('error' in result) return result

  revalidatePath('/learn/diagrams')
  revalidatePath(`/learn/diagrams/${slug}/edit`)
  return result
}

// ─── Update metadata ───────────────────────────────────────────────────────

export async function updateDiagramMetadataAction(slug: string, patch: UpdateDiagramMetadata)
  : Promise<{ id: string } | { error: string }> {
  if (!isValidSlug(slug)) return { error: 'Невалидный slug' }
  if (patch.title !== undefined && patch.title.trim().length === 0) {
    return { error: 'Название не может быть пустым' }
  }

  const result = await updateDiagramMetadata(slug, patch)
  if ('error' in result) return result

  revalidatePath('/learn/diagrams')
  revalidatePath(`/learn/diagrams/${slug}/edit`)
  return result
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteDiagramAction(slug: string): Promise<{ ok: true } | { error: string }> {
  if (!isValidSlug(slug)) return { error: 'Невалидный slug' }

  const result = await deleteDiagramBySlug(slug)
  if ('error' in result) return result

  revalidatePath('/learn/diagrams')
  return result
}

// ─── Duplicate ─────────────────────────────────────────────────────────────
// Возвращает новый slug. UI делает client-side router.push по нему.

export async function duplicateDiagramAction(slug: string)
  : Promise<{ slug: string } | { error: string }> {
  if (!isValidSlug(slug)) return { error: 'Невалидный slug' }

  const result = await duplicateDiagram(slug)
  if ('error' in result) return result

  revalidatePath('/learn/diagrams')
  return result
}

// ─── Server-side redirect helper для duplicate-form ────────────────────────
// Используется как form action (см. карточки в каталоге): submit формы
// → redirect на /edit копии. Используем redirect из next/navigation.

export async function duplicateAndRedirect(formData: FormData) {
  const slug = formData.get('slug') as string
  if (!slug) return
  const result = await duplicateDiagram(slug)
  if ('error' in result) {
    // Без UI feedback в этом варианте — упадём в консоль и покажем что не получилось.
    console.error('duplicate failed:', result.error)
    return
  }
  revalidatePath('/learn/diagrams')
  redirect(`/learn/diagrams/${result.slug}/edit`)
}
