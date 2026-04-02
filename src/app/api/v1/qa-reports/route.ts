import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { MAX_UPLOAD_SIZE } from '@/lib/qa/constants'
import { normalizeAutomationQaPayload, qaAutomationPayloadSchema } from '@/lib/qa/automation'

export async function POST(request: NextRequest) {
  if (!await verifyApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  let rawText: string
  try {
    rawText = await request.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 })
  }

  const bodySize = new TextEncoder().encode(rawText).length
  if (bodySize > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: `Payload exceeds ${Math.floor(MAX_UPLOAD_SIZE / 1024)} KB limit` },
      { status: 413 }
    )
  }

  let rawJson: unknown
  try {
    rawJson = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = qaAutomationPayloadSchema.safeParse(rawJson)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return NextResponse.json(
      {
        error: `Invalid automation payload: ${firstError.path.join('.')} - ${firstError.message}`,
      },
      { status: 400 }
    )
  }

  const checksum = 'sha256:' + createHash('sha256').update(rawText).digest('hex')
  const normalizedPayload = normalizeAutomationQaPayload(parsed.data, {
    sourceChecksum: checksum,
  })

  const supabase = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('ingest_qa_report_service', {
    p_payload: normalizedPayload,
  }) as {
    data: { project_id: string; report_id: string } | null
    error: { message: string } | null
  }

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to ingest QA report' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      project_id: data.project_id,
      report_id: data.report_id,
      checksum,
    },
    { status: 200 }
  )
}
