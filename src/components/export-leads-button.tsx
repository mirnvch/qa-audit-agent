'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

type Lead = {
  companyName: string
  domain: string
  contactName: string | null
  contactEmail: string | null
  reportsCount: number
  leadStatus: string
  lastReportStatus: string
  daysSince: number
}

type Props = {
  leads: Lead[]
}

function exportLeadsCsv(leads: Lead[]) {
  const headers = ['Company', 'Domain', 'Contact Name', 'Contact Email', 'Reports Count', 'Lead Status', 'Last Report Status', 'Days Since']
  const rows = leads.map((l) => [
    l.companyName,
    l.domain,
    l.contactName ?? '',
    l.contactEmail ?? '',
    String(l.reportsCount),
    l.leadStatus,
    l.lastReportStatus,
    String(l.daysSince),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportLeadsButton({ leads }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        exportLeadsCsv(leads)
        toast.success(`Exported ${leads.length} leads`)
      }}
      className="gap-1.5 font-mono text-xs"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  )
}
