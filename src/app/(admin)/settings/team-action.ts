'use server'

import { createServiceClient } from '@/lib/supabase/service'
import type { UserRole } from '@/lib/supabase/types'

export async function updateUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  return {}
}
