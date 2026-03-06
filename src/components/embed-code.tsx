'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

export function EmbedCode() {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const embedUrl = `${origin}/embed/scan`
  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      toast.success('Embed code copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Widget URL</span>
        <span className="font-mono text-xs">{embedUrl || '...'}</span>
      </div>

      <div className="relative">
        <pre className="rounded-md bg-muted/40 border border-border/40 p-3 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
          {embedCode}
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground/60">
        Add <code className="font-mono">?theme=dark</code> for dark mode
        or <code className="font-mono">?accent=%236366f1</code> for custom accent color.
      </p>
    </div>
  )
}
