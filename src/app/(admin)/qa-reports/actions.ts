'use server'

import { createClient } from '@/lib/supabase/server'
import { requireQaAccess } from '@/lib/auth/require-qa-access'
import { qaReportPayloadSchema } from '@/lib/qa/schema'
import { MAX_UPLOAD_SIZE } from '@/lib/qa/constants'
import { revalidatePath } from 'next/cache'

export async function uploadQaReport(
  formData: FormData
): Promise<{ success: boolean; slug?: string; error?: string }> {
  await requireQaAccess()

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'No file provided' }
  }

  if (!file.name.endsWith('.json')) {
    return { success: false, error: 'File must be a .json file' }
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return { success: false, error: 'File size exceeds 512 KB limit' }
  }

  let rawText: string
  try {
    rawText = await file.text()
  } catch {
    return { success: false, error: 'Failed to read file' }
  }

  let rawJson: unknown
  try {
    rawJson = JSON.parse(rawText)
  } catch {
    return { success: false, error: 'Invalid JSON' }
  }

  const parsed = qaReportPayloadSchema.safeParse(rawJson)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return {
      success: false,
      error: `Invalid report format: ${firstError.path.join('.')} - ${firstError.message}`,
    }
  }

  // Compute checksum server-side
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawText))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const checksum = 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Build payload with server-side metadata
  const payload = {
    ...parsed.data,
    _meta: {
      schema_version: 1,
      source_filename: file.name,
      source_checksum: checksum,
    },
  }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('ingest_qa_report', {
    p_payload: payload,
  }) as { data: { project_id: string; report_id: string } | null; error: { message: string } | null }

  if (error || !data) {
    return { success: false, error: error?.message || 'Unknown error' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project } = await (supabase.from as any)('qa_projects')
    .select('slug')
    .eq('id', data.project_id)
    .single() as { data: { slug: string } | null }

  const slug = project?.slug
  revalidatePath('/qa-reports')
  if (slug) revalidatePath(`/qa-reports/${slug}`)
  return { success: true, slug }
}

export async function updatePublicAccess(
  projectId: string,
  updates: {
    is_active?: boolean
    show_history?: boolean
    expires_at?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  await requireQaAccess()

  // Convert date-only string (YYYY-MM-DD) to end-of-day UTC
  const dbUpdates = { ...updates }
  if (dbUpdates.expires_at !== undefined && dbUpdates.expires_at !== null) {
    dbUpdates.expires_at = `${dbUpdates.expires_at}T23:59:59.999Z`
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)('qa_project_access')
    .update(dbUpdates)
    .eq('project_id', projectId) as { error: { message: string } | null }

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate project list + detail page
  revalidatePath('/qa-reports')

  // Resolve slug to revalidate the detail page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proj } = await (supabase.from as any)('qa_projects')
    .select('slug')
    .eq('id', projectId)
    .single() as { data: { slug: string } | null }

  if (proj?.slug) revalidatePath(`/qa-reports/${proj.slug}`)

  return { success: true }
}
