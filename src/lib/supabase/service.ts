import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var')
  }

  return createClient<Database>(url, key)
}
