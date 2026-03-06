'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  action: (formData: FormData) => Promise<{ error?: string } | void>
  defaultValues?: { name: string; subject: string; body: string }
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

export function TemplateForm({ action, defaultValues }: Props) {
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [subject, setSubject] = useState(defaultValues?.subject ?? '')
  const [body, setBody] = useState(defaultValues?.body ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await action(formData)
        if (result?.error) {
          toast.error(result.error)
          return
        }
        toast.success(defaultValues ? 'Template updated' : 'Template created')
      } catch {
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-medium">
            Subject
          </label>
          <Input
            id="subject"
            name="subject"
            placeholder="Email subject line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-medium">
            Body
          </label>
          <textarea
            id="body"
            name="body"
            placeholder="Email body... Use {{variable_name}} for dynamic content"
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-y"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Available variables:{' '}
          <code className="text-[11px]">
            {`{{company_name}}`} {`{{contact_name}}`} {`{{report_link}}`} {`{{score}}`} {`{{domain}}`} {`{{findings_count}}`}
          </code>
        </p>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : defaultValues ? 'Update Template' : 'Create Template'}
        </Button>
      </form>

      {/* Preview */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">Preview</h2>
        <div className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-3">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
              Subject
            </p>
            <p className="text-sm font-medium">
              {subject ? replaceVariables(subject) : 'Email subject will appear here...'}
            </p>
          </div>
          <div className="border-t border-border/30 pt-3">
            <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
              Body
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {body ? replaceVariables(body) : 'Email body will appear here...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
