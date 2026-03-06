'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { randomUUID } from 'crypto'

export async function createApiKey(name: string): Promise<{ key?: string; error?: string }> {
  if (!name.trim()) return { error: 'Name is required' }

  const supabase = createServiceClient()
  const key = `sk_${randomUUID().replace(/-/g, '')}`
  const { error } = await supabase.from('api_keys').insert({ name: name.trim(), key })
  if (error) return { error: error.message }
  return { key }
}

export async function deleteApiKey(id: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('api_keys').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}
