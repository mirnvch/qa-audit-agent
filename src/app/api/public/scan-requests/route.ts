import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, contactName, contactEmail } = body as {
      url?: string
      contactName?: string
      contactEmail?: string
    }

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    if (!parsed.hostname.includes('.')) {
      return NextResponse.json({ error: 'Invalid hostname' }, { status: 400 })
    }

    // Rate limit: 3 per IP per 24h
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'

    const supabase = createServiceClient()

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('scan_requests')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', oneDayAgo)

    if (count !== null && count >= 3) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 3 scans per day.' },
        { status: 429 },
      )
    }

    // Normalize domain
    const domain = parsed.hostname.replace(/^www\./, '')

    const { data, error } = await supabase
      .from('scan_requests')
      .insert({
        url: parsed.toString(),
        domain,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        ip_address: ip,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create scan request:', error)
      return NextResponse.json({ error: 'Failed to create scan request' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Scan request error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
