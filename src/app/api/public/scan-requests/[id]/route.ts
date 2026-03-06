import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('scan_requests')
      .select('status, error_message, report_id')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Scan request not found' }, { status: 404 })
    }

    const result: {
      status: string
      error?: string
      reportCode?: string
    } = { status: data.status }

    if (data.status === 'failed' && data.error_message) {
      result.error = data.error_message
    }

    if (data.status === 'completed' && data.report_id) {
      const { data: report } = await supabase
        .from('reports')
        .select('code')
        .eq('id', data.report_id)
        .single()

      if (report) {
        result.reportCode = report.code
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Scan status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
