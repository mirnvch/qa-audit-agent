'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function PortalEntryPage() {
  const router = useRouter()
  const [value, setValue] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.toUpperCase()

    // Strip non-alphanumeric except hyphen
    raw = raw.replace(/[^A-Z0-9-]/g, '')

    // If user starts typing without prefix, auto-add RPT-
    if (raw.length > 0 && !raw.startsWith('RPT-')) {
      // Allow user to type the prefix themselves
      if (raw.startsWith('R') || raw.startsWith('RP') || raw.startsWith('RPT')) {
        // Partial prefix — let them keep typing
        setValue(raw)
        return
      }
      // Otherwise prepend
      raw = 'RPT-' + raw.replace(/^RPT-?/, '')
    }

    setValue(raw)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = value.trim()
    if (!code) return
    router.push(`/r/${encodeURIComponent(code)}`)
  }

  const isDisabled = !value.trim()

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-bold text-lg leading-none">Q</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          QualityShield
        </span>
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-2xl shadow-black/20">
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          View Your Report
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
          Enter the access code from your email to view your website quality report.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={value}
            onChange={handleChange}
            placeholder="RPT-XXXXXX"
            className="text-center font-mono tracking-widest uppercase text-base h-12"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full h-11 font-medium"
          >
            View Report →
          </Button>
        </form>

        <Separator className="my-6" />

        {/* Footer */}
        <div className="space-y-1 text-center">
          <p className="text-xs text-muted-foreground/70">
            🔒 Your report is private and encrypted.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Access codes expire after 14 days.
          </p>
        </div>
      </div>
    </div>
  )
}
