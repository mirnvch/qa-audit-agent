import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyApiKey } from '@/lib/api-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*, companies(*), findings(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
