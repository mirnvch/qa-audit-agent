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

export async function cancelScan(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('scan_requests')
      .update({
        status: 'failed' as const,
        error_message: 'Cancelled by admin',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('status', ['pending', 'scanning'])

    if (error) throw error
    revalidatePath('/scans')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to cancel scan' }
  }
}

export async function retryScan(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('scan_requests')
      .update({
        status: 'pending' as const,
        error_message: null,
        started_at: null,
        completed_at: null,
      })
      .eq('id', id)
      .eq('status', 'failed')

    if (error) throw error
    revalidatePath('/scans')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to retry scan' }
  }
}
