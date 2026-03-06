'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function createScanRequest(formData: FormData): Promise<{ id?: string; error?: string }> {
  const rawUrl = formData.get('url') as string
  const contactName = formData.get('contact_name') as string | null
  const contactEmail = formData.get('contact_email') as string | null

  if (!rawUrl) {
    return { error: 'URL is required' }
  }

  let url = rawUrl.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }

  let domain: string
  try {
    domain = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return { error: 'Invalid URL' }
  }

  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('scan_requests')
      .insert({
        url,
        domain,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/scans')
    return { id: data.id }
  } catch {
    return { error: 'Failed to create scan request' }
  }
}
