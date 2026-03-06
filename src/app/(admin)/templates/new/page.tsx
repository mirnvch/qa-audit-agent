import Link from 'next/link'
import { TemplateForm } from '@/components/template-form'
import { createTemplate } from '@/app/(admin)/templates/actions'

export default function NewTemplatePage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link href="/templates" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono mb-6">
        &larr; Templates
      </Link>
      <div className="mb-6">
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          New Template
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Create Template</h1>
      </div>
      <TemplateForm action={createTemplate} />
    </div>
  )
}
