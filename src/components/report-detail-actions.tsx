'use client'

import { Send, Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateReportStatus } from '@/app/(admin)/reports/actions'
import type { ReportStatus } from '@/lib/supabase/types'

type Props = {
  reportId: string
  reportCode: string
  currentStatus: ReportStatus
}

export function ReportDetailActions({ reportId, reportCode, currentStatus }: Props) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleMarkAsSent() {
    if (sending) return
    setSending(true)
    await updateReportStatus(reportId, 'sent' as ReportStatus)
    setSending(false)
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/r/${reportCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'draft' && (
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
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2 font-mono text-xs"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied!' : 'Copy Client Link'}
      </Button>
    </div>
  )
}
