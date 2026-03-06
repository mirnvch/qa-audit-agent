'use client'

import { useEffect, useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { sendReportEmail } from '@/app/(admin)/reports/email-action'
import type { EmailTemplate } from '@/lib/supabase/types'

type Props = {
  reportId: string
  reportCode: string
  companyName: string
  contactName: string | null
  contactEmail: string | null
  domain: string
  score: number | null
  findingsCount: number
}

function replaceVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export function SendEmailDialog({
  reportId,
  reportCode,
  companyName,
  contactName,
  contactEmail,
  domain,
  score,
  findingsCount,
}: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [to, setTo] = useState(contactEmail ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  const variables: Record<string, string> = {
    company_name: companyName,
    contact_name: contactName ?? '',
    report_link: typeof window !== 'undefined' ? `${window.location.origin}/r/${reportCode}` : '',
    score: String(score ?? 0),
    domain: domain,
    findings_count: String(findingsCount),
  }

  useEffect(() => {
    if (!open) return

    async function fetchTemplates() {
      setLoading(true)
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data } = await supabase.from('email_templates').select('*').order('name')
        setTemplates((data as EmailTemplate[]) ?? [])
      } catch {
        toast.error('Failed to load email templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
    setTo(contactEmail ?? '')
    setSelectedTemplateId('')
    setSubject('')
    setBody('')
  }, [open, contactEmail])

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSubject(replaceVariables(template.subject, variables))
      setBody(replaceVariables(template.body, variables))
    }
  }

  async function handleSend() {
    if (sending) return
    setSending(true)

    const result = await sendReportEmail({
      reportId,
      templateId: selectedTemplateId,
      to,
      subject,
      body,
    })

    setSending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Email sent successfully')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
          <Mail className="h-3.5 w-3.5" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Report Email</DialogTitle>
          <DialogDescription>
            Send the audit report to {companyName} via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
              Template
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading templates...
              </div>
            ) : (
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="font-mono text-sm">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="font-mono text-sm">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* To field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
              To
            </label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="font-mono text-sm"
            />
          </div>

          {/* Subject (read-only after template selection) */}
          {subject && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Subject
              </label>
              <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm font-mono">
                {subject}
              </div>
            </div>
          )}

          {/* Body preview */}
          {body && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Body Preview
              </label>
              <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {body}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={sending || !to || !subject || !body}
            className="gap-2 font-mono text-xs"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
