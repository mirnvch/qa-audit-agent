import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyApiKey } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  if (!await verifyApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const body = await request.json()
  const { url, contact_name, contact_email } = body as {
    url?: string
    contact_name?: string
    contact_email?: string
  }

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  let parsedUrl = url.trim()
  if (!parsedUrl.startsWith('http')) parsedUrl = `https://${parsedUrl}`

  let domain: string
  try {
    domain = new URL(parsedUrl).hostname.replace(/^www\./, '')
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scan_requests')
    .insert({ url: parsedUrl, domain, contact_name: contact_name || null, contact_email: contact_email || null })
    .select('id, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, status: data.status }, { status: 201 })
}
