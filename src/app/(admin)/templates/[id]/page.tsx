import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { EmailTemplate } from '@/lib/supabase/types'

type Props = {
  params: Promise<{ id: string }>
}

const SAMPLE_DATA: Record<string, string> = {
  company_name: 'Acme Corp',
  contact_name: 'John Smith',
  report_link: 'https://app.qacamp.com/r/RPT-DEMO',
  score: '54',
  domain: 'acme.com',
  findings_count: '8',
}

function replaceVariables(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_DATA[key] ?? `{{${key}}}`)
}

export default async function TemplateViewPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) notFound()

  const t = template as EmailTemplate

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono mb-6"
      >
        ← Templates
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Template Preview
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{t.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {t.variables.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        </div>
        <Link
          href={`/templates/${t.id}/edit`}
          className="inline-flex items-center justify-center rounded-md border border-border/50 bg-background px-4 py-2 text-sm font-mono font-medium shadow-xs hover:bg-muted/40 transition-colors"
        >
          Edit
        </Link>
      </div>

      {/* Preview with sample data */}
      <div className="space-y-6">
        {/* Email preview */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {/* Email header */}
          <div className="border-b border-border/50 bg-muted/30 px-6 py-4 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase w-16 shrink-0">
                To
              </span>
              <span className="text-sm">
                {SAMPLE_DATA.contact_name} &lt;john@{SAMPLE_DATA.domain}&gt;
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase w-16 shrink-0">
                Subject
              </span>
              <span className="text-sm font-semibold">
                {replaceVariables(t.subject)}
              </span>
            </div>
          </div>

          {/* Email body */}
          <div className="px-6 py-6">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {replaceVariables(t.body)}
            </p>
          </div>
        </div>

        {/* Raw template */}
        <details className="group">
          <summary className="text-xs font-mono text-muted-foreground/60 tracking-[0.12em] uppercase cursor-pointer hover:text-muted-foreground transition-colors">
            Raw Template
          </summary>
          <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase mb-1">
                Subject
              </p>
              <p className="text-sm font-mono">{t.subject}</p>
            </div>
            <div className="border-t border-border/30 pt-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase mb-1">
                Body
              </p>
              <p className="text-sm font-mono whitespace-pre-wrap">{t.body}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
