'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Download, Trash2, X } from 'lucide-react'

type Props = {
  selectedCount: number
  onExportCsv: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
}

export function BulkActionsBar({ selectedCount, onExportCsv, onBulkDelete, onClearSelection }: Props) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-border/50 bg-background/95 backdrop-blur px-4 py-3 shadow-lg">
        <span className="text-sm font-mono font-medium">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-border/50" />

        <Button
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          className="gap-1.5 font-mono text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDelete(true)}
          className="gap-1.5 font-mono text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} reports?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected reports and all their findings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkDelete()
                setShowDelete(false)
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete {selectedCount} reports
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
