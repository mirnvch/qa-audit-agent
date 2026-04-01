import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireQaAccess(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'operator'])
    .limit(1)
    .single()

  if (!role) redirect('/access-denied')

  return user.id
}
