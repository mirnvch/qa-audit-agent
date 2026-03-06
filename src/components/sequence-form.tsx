'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { SequenceStep, EmailTemplate } from '@/lib/supabase/types'

type Props = {
  action: (formData: FormData) => Promise<{ error?: string } | void>
  defaultValues?: { name: string; steps: SequenceStep[] }
}

type TemplateOption = Pick<EmailTemplate, 'id' | 'name'>

export function SequenceForm({ action, defaultValues }: Props) {
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [steps, setSteps] = useState<SequenceStep[]>(
    defaultValues?.steps ?? [{ delay_days: 1, template_id: '' }]
  )
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data: TemplateOption[]) => setTemplates(data))
      .catch(() => {})
  }, [])

  function addStep() {
    setSteps((prev) => [...prev, { delay_days: 1, template_id: '' }])
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  function updateStep(index: number, field: keyof SequenceStep, value: string | number) {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    )
  }

  function handleSubmit(formData: FormData) {
    formData.set('steps', JSON.stringify(steps))
    startTransition(async () => {
      try {
        const result = await action(formData)
        if (result?.error) {
          toast.error(result.error)
          return
        }
        toast.success(defaultValues ? 'Sequence updated' : 'Sequence created')
      } catch {
        toast.error('An unexpected error occurred')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Sequence Name
        </label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Post-Audit Follow-up"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Steps</label>

        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg border border-border/50 p-3 bg-muted/20"
          >
            <span className="text-xs font-mono text-muted-foreground/60 shrink-0">
              #{index + 1}
            </span>

            <span className="text-sm text-muted-foreground shrink-0">After</span>
            <Input
              type="number"
              min={0}
              value={step.delay_days}
              onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value, 10) || 0)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground shrink-0">days, send</span>

            <select
              value={step.template_id}
              onChange={(e) => updateStep(index, 'template_id', e.target.value)}
              className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
              required
            >
              <option value="">Select template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {steps.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          className="gap-1.5 font-mono text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Step
        </Button>
      </div>

      <input type="hidden" name="steps" value={JSON.stringify(steps)} />

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : defaultValues ? 'Update Sequence' : 'Create Sequence'}
      </Button>
    </form>
  )
}
