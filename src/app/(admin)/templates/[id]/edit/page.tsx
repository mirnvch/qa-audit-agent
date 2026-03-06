import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplateForm } from '@/components/template-form'
import { updateTemplate } from '@/app/(admin)/templates/actions'
import type { EmailTemplate } from '@/lib/supabase/types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  const template = data as EmailTemplate | null

  if (!template) notFound()

  const action = updateTemplate.bind(null, id)

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link href="/templates" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono mb-6">
        &larr; Templates
      </Link>
      <div className="mb-6">
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          Edit Template
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
      </div>
      <TemplateForm action={action} defaultValues={{ name: template.name, subject: template.subject, body: template.body }} />
    </div>
  )
}
