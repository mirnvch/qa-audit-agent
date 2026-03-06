'use client'

import Link from 'next/link'
import { formatDate } from '@/lib/format'
import { useRealtimeScans } from '@/hooks/use-realtime-scans'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScanStatusBadge } from '@/components/scan-status-badge'
import { ScanActions } from '@/components/scan-actions'
import type { ScanRequest } from '@/lib/supabase/types'

type ScansTableProps = {
  initialScans: ScanRequest[]
  total: number
  page: number
  pageSize: number
  statusFilter: string
}

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const filtered = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''
  )
  if (filtered.length === 0) return basePath
  return `${basePath}?${new URLSearchParams(filtered).toString()}`
}

export function ScansTable({ initialScans, total, page, pageSize, statusFilter }: ScansTableProps) {
  const scans = useRealtimeScans(initialScans)
  const totalPages = Math.ceil(total / pageSize)
  const fromItem = (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, total)

  return (
    <>
      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Domain
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                URL
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Contact
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Status
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Created
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Report
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 w-10">
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  No scan requests found
                </TableCell>
              </TableRow>
            ) : (
              scans.map((scan) => (
                <TableRow
                  key={scan.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <span className="font-mono font-bold text-sm tracking-wider text-foreground">
                      {scan.domain ?? '\u2014'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground font-mono truncate max-w-[200px] block">
                      {scan.url}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">
                      {scan.contact_name ?? '\u2014'}
                    </div>
                    {scan.contact_email && (
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {scan.contact_email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ScanStatusBadge status={scan.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatDate(scan.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {scan.report_id ? (
                      <Link
                        href={`/reports/${scan.report_id}`}
                        className="text-sm font-mono text-blue-400 hover:text-blue-300 underline underline-offset-4"
                      >
                        View Report
                      </Link>
                    ) : scan.status === 'failed' ? (
                      <span className="text-xs text-muted-foreground font-mono" title={scan.error_message ?? undefined}>
                        {scan.error_message ? 'Error' : '\u2014'}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{'\u2014'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ScanActions scanId={scan.id} status={scan.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground/60">
            Showing {fromItem}&ndash;{toItem} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildHref('/scans', {
                  status: statusFilter === 'all' ? undefined : statusFilter,
                  page: String(page - 1),
                })}
                className="px-3 py-1.5 rounded-md text-xs font-mono font-medium border border-border/50 hover:bg-muted/40 transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-xs font-mono text-muted-foreground">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildHref('/scans', {
                  status: statusFilter === 'all' ? undefined : statusFilter,
                  page: String(page + 1),
                })}
                className="px-3 py-1.5 rounded-md text-xs font-mono font-medium border border-border/50 hover:bg-muted/40 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
