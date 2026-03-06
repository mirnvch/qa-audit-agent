'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cancelScan, retryScan } from '@/app/(admin)/scans/actions'
import type { ScanRequestStatus } from '@/lib/supabase/types'

type Props = {
  scanId: string
  status: ScanRequestStatus
}

export function ScanActions({ scanId, status }: Props) {
  const [showCancel, setShowCancel] = useState(false)

  if (status === 'completed') return null

  async function handleRetry() {
    const result = await retryScan(scanId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Scan queued for retry')
    }
  }

  async function handleCancel() {
    const result = await cancelScan(scanId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Scan cancelled')
    }
    setShowCancel(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {status === 'failed' && (
            <DropdownMenuItem onClick={handleRetry}>
              <RotateCcw className="h-4 w-4" />
              Retry
            </DropdownMenuItem>
          )}
          {(status === 'pending' || status === 'scanning') && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowCancel(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this scan?</AlertDialogTitle>
            <AlertDialogDescription>
              The scan will be marked as failed. You can retry it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Running</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Cancel Scan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
