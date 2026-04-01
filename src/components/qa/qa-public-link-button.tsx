'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  code: string
  isActive: boolean
  expiresAt: string | null
}

export function QaPublicLinkButton({ code, isActive, expiresAt }: Props) {
  const [copied, setCopied] = useState(false)

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false
  const isAvailable = isActive && !isExpired

  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/qa/${code}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Public link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-muted/30 transition-colors"
    >
      <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Link2 className="h-3.5 w-3.5" />
          Copy link
        </>
      )}
    </button>
  )
}
