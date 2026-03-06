'use server'

import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

const resend = new Resend(process.env.RESEND_API_KEY)

type SendEmailInput = {
  reportId: string
  templateId: string
  to: string
  subject: string
  body: string
}

export async function sendReportEmail(input: SendEmailInput): Promise<{ error?: string }> {
  const { reportId, templateId, to, subject, body } = input

  if (!to || !subject || !body) {
    return { error: 'Missing required fields' }
  }

  if (!process.env.RESEND_API_KEY) {
    return { error: 'RESEND_API_KEY is not configured' }
  }

  const from = process.env.EMAIL_FROM || 'QA Camp <noreply@qacamp.com>'

  try {
    const { error: resendError } = await resend.emails.send({
      from,
      to,
      subject,
      html: body.replace(/\n/g, '<br />'),
    })

    if (resendError) {
      return { error: resendError.message }
    }

    const supabase = createServiceClient()
    await supabase.from('reports').update({ status: 'sent' }).eq('id', reportId)
    await supabase.from('activity_log').insert({
      report_id: reportId,
      action: 'email_sent',
      details: `Email sent using template ${templateId} to ${to}`,
    })

    revalidatePath('/reports')
    revalidatePath(`/reports/${reportId}`)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send email' }
  }
}
