'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateBranding } from '@/app/(admin)/settings/branding-action'
import type { Branding } from '@/lib/supabase/types'

export function BrandingForm({ initial }: { initial: Branding | null }) {
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState(initial?.company_name ?? '')
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? '')
  const [primaryColor, setPrimaryColor] = useState(initial?.primary_color ?? '')
  const [accentColor, setAccentColor] = useState(initial?.accent_color ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData()
    fd.set('company_name', companyName)
    fd.set('logo_url', logoUrl)
    fd.set('primary_color', primaryColor)
    fd.set('accent_color', accentColor)

    const result = await updateBranding(fd)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Branding updated')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Company Name</label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your Company"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Logo URL</label>
        <Input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Primary Color</label>
          <div className="flex items-center gap-2">
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#1a1a2e"
              className="font-mono text-xs"
            />
            {primaryColor && (
              <div
                className="w-8 h-8 rounded border border-border/50 shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Accent Color</label>
          <div className="flex items-center gap-2">
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#6366f1"
              className="font-mono text-xs"
            />
            {accentColor && (
              <div
                className="w-8 h-8 rounded border border-border/50 shrink-0"
                style={{ backgroundColor: accentColor }}
              />
            )}
          </div>
        </div>
      </div>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="font-mono text-xs"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Branding'}
      </Button>
    </form>
  )
}
