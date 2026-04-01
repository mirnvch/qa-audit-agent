'use client'

import { useState } from 'react'
import { updatePublicAccess } from '@/app/(admin)/qa-reports/actions'
import { toast } from 'sonner'
import type { QaProjectAccess } from '@/lib/qa/schema'
import { QaPublicLinkButton } from './qa-public-link-button'
import { Settings } from 'lucide-react'

type Props = {
  access: QaProjectAccess
  projectId: string
}

function toDateString(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

export function QaPublicAccessPanel({ access, projectId }: Props) {
  const [isActive, setIsActive] = useState(access.is_active)
  const [showHistory, setShowHistory] = useState(access.show_history)
  // Store as YYYY-MM-DD date string only
  const [expiryDate, setExpiryDate] = useState(toDateString(access.expires_at))
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleToggle(field: 'is_active' | 'show_history', value: boolean) {
    // Confirm before disabling public access
    if (field === 'is_active' && !value) {
      if (!window.confirm('Disable public access? The public link will stop working immediately.')) {
        return
      }
    }

    if (field === 'is_active') setIsActive(value)
    if (field === 'show_history') setShowHistory(value)

    setSaving(true)
    const result = await updatePublicAccess(projectId, { [field]: value })
    setSaving(false)

    if (!result.success) {
      toast.error(result.error || 'Failed to update')
      if (field === 'is_active') setIsActive(!value)
      if (field === 'show_history') setShowHistory(!value)
    }
  }

  async function saveExpiry(dateValue: string | null) {
    setSaving(true)
    const result = await updatePublicAccess(projectId, {
      expires_at: dateValue,
    })
    setSaving(false)

    if (result.success) {
      toast.success(dateValue ? 'Expiry updated' : 'Expiry cleared')
    } else {
      toast.error(result.error || 'Failed to update')
    }
  }

  // For the link button, derive an ISO string for expiry comparison
  const expiresAtIso = expiryDate ? `${expiryDate}T23:59:59.999Z` : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <QaPublicLinkButton
          code={access.code}
          isActive={isActive}
          expiresAt={expiresAtIso}
        />
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/30 transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          {open ? 'Hide' : 'Settings'}
        </button>
      </div>

      {open && (
        <div className="rounded-lg border bg-card p-4 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Public access</div>
              <div className="text-[11px] text-muted-foreground">Allow access via public link</div>
            </div>
            <button
              onClick={() => handleToggle('is_active', !isActive)}
              disabled={saving}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                isActive ? 'bg-green-500' : 'bg-muted'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                isActive ? 'left-5' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show history</div>
              <div className="text-[11px] text-muted-foreground">Allow viewing past reports</div>
            </div>
            <button
              onClick={() => handleToggle('show_history', !showHistory)}
              disabled={saving}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                showHistory ? 'bg-green-500' : 'bg-muted'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                showHistory ? 'left-5' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="font-medium">Expiry date</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-sm"
              />
              <button
                onClick={() => saveExpiry(expiryDate || null)}
                disabled={saving || !expiryDate}
                className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
              {expiryDate && (
                <button
                  onClick={() => {
                    setExpiryDate('')
                    saveExpiry(null)
                  }}
                  disabled={saving}
                  className="px-2 py-1 text-xs rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {!expiryDate && (
              <div className="text-[10px] text-muted-foreground/50">No expiry set</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
