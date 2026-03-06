'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, Eye, Send, Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ReportStatus } from '@/lib/supabase/types'
import { updateReportStatus, deleteReport } from '@/app/(admin)/reports/actions'

type Props = {
  reportId: string
  reportCode: string
}

export function ReportActions({ reportId, reportCode }: Props) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)

  async function handleMarkAsSent() {
    const result = await updateReportStatus(reportId, 'sent' as ReportStatus)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Report marked as sent')
    }
  }

  async function handleDelete() {
    const result = await deleteReport(reportId)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Report deleted')
    }
    setShowDelete(false)
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/r/${reportCode}`
    navigator.clipboard.writeText(url)
    toast.success('Client link copied to clipboard')
  }

  return (
    <>
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
              setShowDelete(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the report and all its findings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
