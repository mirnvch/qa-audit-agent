import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service env vars')
  return createClient(url, key)
}

type StepDef = { delay_days: number; template_id: string }

type EnrollmentRow = {
  id: string
  report_id: string
  current_step: number
  status: string
  email_sequences: {
    steps: StepDef[]
  } | null
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Find due enrollments
  const { data: enrollments } = await supabase
    .from('sequence_enrollments')
    .select('*, email_sequences(*)')
    .eq('status', 'active')
    .lte('next_send_at', new Date().toISOString())

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const raw of enrollments) {
    const enrollment = raw as unknown as EnrollmentRow
    const sequence = enrollment.email_sequences
    if (!sequence) continue

    const steps = sequence.steps
    const currentStep = steps[enrollment.current_step]
    if (!currentStep) {
      await supabase.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      continue
    }

    // Get template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', currentStep.template_id)
      .single()

    if (!template) continue

    // Get report + company for variable substitution
    const { data: report } = await supabase
      .from('reports')
      .select('*, companies(*)')
      .eq('id', enrollment.report_id)
      .single()

    if (!report || !report.companies) continue

    const company = report.companies as unknown as {
      name: string
      contact_name: string | null
      contact_email: string | null
      domain: string
    }

    const tpl = template as unknown as { subject: string; body: string }

    const variables: Record<string, string> = {
      company_name: company.name,
      contact_name: company.contact_name ?? '',
      report_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.qacamp.com'}/r/${(report as unknown as { code: string }).code}`,
      score: String((report as unknown as { score: number | null }).score ?? 0),
      domain: company.domain,
      findings_count: '0',
    }

    const subject = tpl.subject.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`)
    const body = tpl.body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`)

    // Send email
    const to = company.contact_email
    if (!to) continue

    const from = process.env.EMAIL_FROM || 'QA Camp <noreply@qacamp.com>'
    await getResend().emails.send({ from, to, subject, html: body.replace(/\n/g, '<br />') })

    // Update enrollment
    const nextStepIndex = enrollment.current_step + 1
    if (nextStepIndex >= steps.length) {
      await supabase.from('sequence_enrollments').update({ status: 'completed', current_step: nextStepIndex }).eq('id', enrollment.id)
    } else {
      const nextStep = steps[nextStepIndex]
      const nextSendAt = new Date()
      nextSendAt.setDate(nextSendAt.getDate() + nextStep.delay_days)
      await supabase.from('sequence_enrollments').update({
        current_step: nextStepIndex,
        next_send_at: nextSendAt.toISOString(),
      }).eq('id', enrollment.id)
    }

    // Log activity
    await supabase.from('activity_log').insert({
      report_id: enrollment.report_id,
      action: 'email_sent',
      details: `Follow-up email sent (step ${enrollment.current_step + 1} of ${steps.length})`,
    })

    processed++
  }

  return NextResponse.json({ processed })
}
