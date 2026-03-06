import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export async function getCurrentUserRole(): Promise<UserRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 'viewer'

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return (data?.role as UserRole) ?? 'admin' // Default to admin for first user
}

export function canManageSettings(role: UserRole): boolean {
  return role === 'admin'
}

export function canSendEmails(role: UserRole): boolean {
  return role === 'admin' || role === 'operator'
}

export function canModifyData(role: UserRole): boolean {
  return role === 'admin' || role === 'operator'
}
