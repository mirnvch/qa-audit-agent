'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSequence(formData: FormData): Promise<{ error?: string } | void> {
  const name = formData.get('name') as string
  const stepsJson = formData.get('steps') as string

  if (!name) return { error: 'Name is required' }

  let steps: { delay_days: number; template_id: string }[]
  try {
    steps = JSON.parse(stepsJson || '[]')
  } catch {
    return { error: 'Invalid steps data' }
  }

  if (steps.length === 0) return { error: 'At least one step is required' }

  const supabase = await createClient()
  const { error } = await supabase.from('email_sequences').insert({
    name,
    steps,
  })

  if (error) return { error: error.message }

  revalidatePath('/sequences')
  redirect('/sequences')
}

export async function updateSequence(id: string, formData: FormData): Promise<{ error?: string } | void> {
  const name = formData.get('name') as string
  const stepsJson = formData.get('steps') as string

  if (!name) return { error: 'Name is required' }

  let steps: { delay_days: number; template_id: string }[]
  try {
    steps = JSON.parse(stepsJson || '[]')
  } catch {
    return { error: 'Invalid steps data' }
  }

  if (steps.length === 0) return { error: 'At least one step is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('email_sequences')
    .update({
      name,
      steps,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/sequences')
  redirect('/sequences')
}

export async function deleteSequence(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('email_sequences').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/sequences')
  return {}
}
