'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ReportStatus, ActivityAction } from '@/lib/supabase/types'

// Untyped client to avoid Database type conflicts with strict update/insert
async function getRawClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // safe to ignore
          }
        },
      },
    }
  )
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  try {
    const supabase = await getRawClient()
    const action: ActivityAction = status === 'sent' ? 'sent' : (status as ActivityAction)

    await supabase.from('reports').update({ status }).eq('id', reportId)
    await supabase.from('activity_log').insert({
      report_id: reportId,
      action,
      details: `Report status changed to ${status}`,
    })

    revalidatePath('/reports')
  } catch {
    // Silently fail when DB not connected
  }
}

export async function deleteReport(reportId: string) {
  try {
    const supabase = await getRawClient()
    await supabase.from('reports').delete().eq('id', reportId)
    revalidatePath('/reports')
  } catch {
    // Silently fail when DB not connected
  }
}
