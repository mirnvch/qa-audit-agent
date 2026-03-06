'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTemplate(formData: FormData) {
  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const body = formData.get('body') as string

  if (!name || !subject || !body) {
    return { error: 'All fields are required' }
  }

  const variableRegex = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()
  for (const match of `${subject} ${body}`.matchAll(variableRegex)) {
    variables.add(match[1])
  }

  const supabase = await createClient()
  const { error } = await supabase.from('email_templates').insert({
    name,
    subject,
    body,
    variables: Array.from(variables),
  })

  if (error) return { error: error.message }

  revalidatePath('/templates')
  redirect('/templates')
}

export async function updateTemplate(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const body = formData.get('body') as string

  if (!name || !subject || !body) {
    return { error: 'All fields are required' }
  }

  const variableRegex = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()
  for (const match of `${subject} ${body}`.matchAll(variableRegex)) {
    variables.add(match[1])
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('email_templates')
    .update({
      name,
      subject,
      body,
      variables: Array.from(variables),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/templates')
  redirect('/templates')
}

export async function deleteTemplate(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('email_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/templates')
  return {}
}
