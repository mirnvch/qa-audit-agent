import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('email_templates')
      .select('id, name')
      .order('name')

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
