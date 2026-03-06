'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReportStatusBadge } from '@/components/report-status-badge'
import { SeverityChips } from '@/components/severity-chips'
import { ReportActions } from '@/components/report-actions'
import { BulkActionsBar } from '@/components/bulk-actions-bar'
import type { ReportStatus } from '@/lib/supabase/types'
import { bulkDeleteReports } from '@/app/(admin)/reports/actions'

type ReportFinding = { severity: string }

type ReportRow = {
  id: string
  code: string
  status: string
  score: number | null
  view_count: number
  companies: {
    name: string
    domain: string
    contact_name: string | null
  } | null
  findings: ReportFinding[]
  created_at: string
}

type Props = {
  reports: ReportRow[]
}

function countSeverities(findings: ReportFinding[]) {
  return {
    critical: findings.filter((f) => f.severity === 'critical').length,
    moderate: findings.filter((f) => f.severity === 'moderate').length,
    minor: findings.filter((f) => f.severity === 'minor').length,
  }
}

function exportToCsv(reports: ReportRow[]) {
  const headers = ['Code', 'Company', 'Domain', 'Score', 'Status', 'Critical', 'Moderate', 'Minor', 'Date']
  const rows = reports.map((r) => [
    r.code,
    r.companies?.name ?? '',
    r.companies?.domain ?? '',
    String(r.score ?? ''),
    r.status,
    String(r.findings?.filter((f) => f.severity === 'critical').length ?? 0),
    String(r.findings?.filter((f) => f.severity === 'moderate').length ?? 0),
    String(r.findings?.filter((f) => f.severity === 'minor').length ?? 0),
    r.created_at,
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsTable({ reports }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const allSelected = reports.length > 0 && selectedIds.size === reports.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < reports.length

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(reports.map((r) => r.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleExportCsv() {
    const selected = reports.filter((r) => selectedIds.has(r.id))
    exportToCsv(selected)
    toast.success(`Exported ${selected.length} reports`)
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    startTransition(async () => {
      const result = await bulkDeleteReports(ids)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted ${ids.length} reports`)
        setSelectedIds(new Set())
      }
    })
  }

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-10 h-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all reports"
                />
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Code
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Company
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Contact
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Status
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Issues
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 text-right">
                Views
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const counts = countSeverities(report.findings ?? [])
                const company = report.companies
                const isSelected = selectedIds.has(report.id)

                return (
                  <TableRow
                    key={report.id}
                    className={`cursor-pointer hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/20' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(report.id)}
                        aria-label={`Select report ${report.code}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/reports/${report.id}`}
                        className="block w-full h-full"
                      >
                        <span className="font-mono font-bold text-sm tracking-wider text-foreground">
                          {report.code}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/reports/${report.id}`}
                        className="block"
                      >
                        <div className="font-semibold text-sm text-foreground">
                          {company?.name ?? '\u2014'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {company?.domain ?? ''}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/reports/${report.id}`} className="block">
                        <span className="text-sm text-foreground">
                          {company?.contact_name ?? '\u2014'}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/reports/${report.id}`} className="block">
                        <ReportStatusBadge status={report.status as ReportStatus} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/reports/${report.id}`} className="block">
                        <SeverityChips
                          critical={counts.critical}
                          moderate={counts.moderate}
                          minor={counts.minor}
                        />
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/reports/${report.id}`} className="block">
                        <span className="font-mono text-sm">
                          {report.view_count > 0 ? report.view_count : '\u2014'}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ReportActions
                        reportId={report.id}
                        reportCode={report.code}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onExportCsv={handleExportCsv}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </>
  )
}
