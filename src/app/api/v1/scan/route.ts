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

  let parsed: URL
  try {
    parsed = new URL(parsedUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
  }

  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  const domain = parsed.hostname.replace(/^www\./, '')

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
