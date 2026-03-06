'use client'

import { Send, Link2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SendEmailDialog } from '@/components/send-email-dialog'
import { updateReportStatus } from '@/app/(admin)/reports/actions'
import type { ReportStatus } from '@/lib/supabase/types'

type Props = {
  reportId: string
  reportCode: string
  currentStatus: ReportStatus
  companyName: string
  contactName: string | null
  contactEmail: string | null
  domain: string
  score: number | null
  findingsCount: number
}

export function ReportDetailActions({
  reportId,
  reportCode,
  currentStatus,
  companyName,
  contactName,
  contactEmail,
  domain,
  score,
  findingsCount,
}: Props) {
  const [sending, setSending] = useState(false)

  async function handleMarkAsSent() {
    if (sending) return
    setSending(true)
    const result = await updateReportStatus(reportId, 'sent' as ReportStatus)
    setSending(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Report marked as sent')
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/r/${reportCode}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Client link copied to clipboard')
    })
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'draft' && (
        <>
          <SendEmailDialog
            reportId={reportId}
            reportCode={reportCode}
            companyName={companyName}
            contactName={contactName}
            contactEmail={contactEmail}
            domain={domain}
            score={score}
            findingsCount={findingsCount}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsSent}
            disabled={sending}
            className="gap-2 font-mono text-xs"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending...' : 'Mark as Sent'}
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2 font-mono text-xs"
      >
        <Link2 className="h-3.5 w-3.5" />
        Copy Client Link
      </Button>
    </div>
  )
}
