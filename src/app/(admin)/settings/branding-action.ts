'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function updateBranding(formData: FormData): Promise<{ error?: string }> {
  const companyName = formData.get('company_name') as string | null
  const logoUrl = formData.get('logo_url') as string | null
  const primaryColor = formData.get('primary_color') as string | null
  const accentColor = formData.get('accent_color') as string | null

  try {
    const supabase = createServiceClient()

    // Upsert — single row for branding
    const { data: existing } = await supabase.from('branding').select('id').limit(1).single()

    if (existing) {
      await supabase.from('branding').update({
        company_name: companyName || null,
        logo_url: logoUrl || null,
        primary_color: primaryColor || null,
        accent_color: accentColor || null,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabase.from('branding').insert({
        company_name: companyName || null,
        logo_url: logoUrl || null,
        primary_color: primaryColor || null,
        accent_color: accentColor || null,
      })
    }

    revalidatePath('/settings')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update branding' }
  }
}
