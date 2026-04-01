'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileJson } from 'lucide-react'
import { uploadQaReport } from '@/app/(admin)/qa-reports/actions'
import { MAX_UPLOAD_SIZE } from '@/lib/qa/constants'
import { toast } from 'sonner'

export function QaUploadDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const close = useCallback(() => {
    if (uploading) return
    setOpen(false)
    setFile(null)
  }, [uploading])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  function handleFile(f: File) {
    if (!f.name.endsWith('.json')) {
      toast.error('File must be a .json file')
      return
    }
    if (f.size > MAX_UPLOAD_SIZE) {
      toast.error('File size exceeds 512 KB limit')
      return
    }
    setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadQaReport(formData)

    setUploading(false)

    if (result.success) {
      toast.success('Report uploaded')
      setOpen(false)
      setFile(null)
      if (result.slug) {
        router.push(`/qa-reports/${result.slug}`)
      }
    } else {
      toast.error(result.error || 'Upload failed')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        <Upload className="h-4 w-4" />
        Upload Report
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80" onClick={close} />
      <div className="relative bg-card border rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload QA Report</h2>
          <button onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-500/5' : 'border-border'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileJson className="h-5 w-5 text-blue-400" />
              <span className="text-sm">{file.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Drag & drop a JSON file or{' '}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-blue-400 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-[10px] text-muted-foreground/50">Max 512 KB</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={close}
            className="px-3 py-2 text-sm rounded-md hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-3 py-2 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
