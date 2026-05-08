// Клиентский (browser) фетч диаграммы по slug. Используется компонентом
// <Diagram /> внутри MDX-уроков. Server-side `getBySlug` из api.ts здесь
// не используется — он async server fn и не работает внутри Client tree.

import { createClient } from '@/lib/supabase/client'

export type DiagramForRender = {
  slug: string
  title: string
  description: string | null
  svg_light: string | null
  svg_dark: string | null
}

export async function fetchDiagramForRender(slug: string): Promise<DiagramForRender | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('slug, title, description, svg_light, svg_dark')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.warn(`<Diagram id="${slug}" /> fetch failed:`, error.message)
    return null
  }
  return (data as DiagramForRender | null) ?? null
}
