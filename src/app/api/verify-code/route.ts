import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const code = typeof body.code === 'string' ? body.code.trim() : ''

  if (!code) {
    return NextResponse.json(
      { valid: false, reason: 'Please enter an access code.' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Lookup report by access code
  const { data: report, error } = await supabase
    .from('reports')
    .select('id, status, expires_at, view_count')
    .eq('code', code)
    .single()

  if (error || !report) {
    return NextResponse.json(
      { valid: false, reason: 'We couldn\'t find a report matching this access code. Please check the code from your email and try again.' },
      { status: 404 }
    )
  }

  // Check expiration
  if (report.expires_at && new Date(report.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, reason: 'This report has expired. Access codes expire after 14 days. Please contact us if you need access.' },
      { status: 410 }
    )
  }

  // Track view — all updates fire-and-forget
  const newCount = (report.view_count || 0) + 1
  const isFirstView = report.view_count === 0
  const newStatus = report.status === 'sent' ? 'viewed' : report.status

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
  const userAgent = request.headers.get('user-agent') || null

  await Promise.all([
    // Update report
    supabase
      .from('reports')
      .update({
        view_count: newCount,
        status: newStatus,
        ...(isFirstView ? { first_viewed_at: new Date().toISOString() } : {}),
      })
      .eq('id', report.id),

    // Log activity
    supabase.from('activity_log').insert({
      report_id: report.id,
      action: 'viewed' as const,
      details: `Report viewed (${newCount}x) — IP: ${ip ?? 'unknown'}; UA: ${userAgent?.slice(0, 100) ?? 'unknown'}`,
    }),
  ])

  return NextResponse.json({ valid: true, code })
}
