import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function verifyApiKey(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const key = authHeader.slice(7)
  const supabase = createServiceClient()
  const { data } = await supabase.from('api_keys').select('id').eq('key', key).single()
  return !!data
}
