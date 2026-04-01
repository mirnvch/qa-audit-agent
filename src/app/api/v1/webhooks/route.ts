import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyApiKey } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  if (!await verifyApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!await verifyApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const body = await request.json()
  const { url, events } = body as { url?: string; events?: string[] }

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  // Validate webhook URL: must be HTTPS, no internal IPs
  let parsedWebhookUrl: URL
  try {
    parsedWebhookUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  if (parsedWebhookUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Webhook URL must use HTTPS' }, { status: 400 })
  }

  const hostname = parsedWebhookUrl.hostname
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('169.254.') ||
    hostname === '0.0.0.0'
  ) {
    return NextResponse.json({ error: 'Internal/private URLs are not allowed' }, { status: 400 })
  }

  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'events array is required' }, { status: 400 })
  }

  const validEvents = ['scan_completed', 'report_sent', 'report_viewed', 'report_replied']
  const invalidEvents = events.filter(e => !validEvents.includes(e))
  if (invalidEvents.length > 0) {
    return NextResponse.json({ error: `Invalid events: ${invalidEvents.join(', ')}. Valid: ${validEvents.join(', ')}` }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('webhooks')
    .insert({ url, events })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
