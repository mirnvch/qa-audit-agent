'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown, Eye, Send, Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ReportStatus } from '@/lib/supabase/types'
import { updateReportStatus, deleteReport } from '@/app/(admin)/reports/actions'

type Props = {
  reportId: string
  reportCode: string
}

export function ReportActions({ reportId, reportCode }: Props) {
  const router = useRouter()

  async function handleMarkAsSent() {
    await updateReportStatus(reportId, 'sent' as ReportStatus)
  }

  async function handleDelete() {
    if (!confirm('Delete this report? This action cannot be undone.')) return
    await deleteReport(reportId)
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/r/${reportCode}`
    navigator.clipboard.writeText(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronDown className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/reports/${reportId}`)
          }}
        >
          <Eye className="h-4 w-4" />
          View Report
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            handleMarkAsSent()
          }}
        >
          <Send className="h-4 w-4" />
          Mark as Sent
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            handleCopyLink()
          }}
        >
          <Link2 className="h-4 w-4" />
          Copy Client Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
