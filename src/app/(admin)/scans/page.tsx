import Link from 'next/link'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScanStatusBadge } from '@/components/scan-status-badge'
import type { ScanRequest, ScanRequestStatus } from '@/lib/supabase/types'

const PAGE_SIZE = 20

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>
}

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Scanning', value: 'scanning' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
] as const

async function getScanRequests(statusFilter: string, page: number): Promise<{ scans: ScanRequest[]; total: number }> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Supabase env vars not set')
    }

    const supabase = await createClient()
    let query = supabase
      .from('scan_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as ScanRequestStatus)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return { scans: (data ?? []) as ScanRequest[], total: count ?? 0 }
  } catch {
    return { scans: [], total: 0 }
  }
}

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const filtered = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''
  )
  if (filtered.length === 0) return basePath
  return `${basePath}?${new URLSearchParams(filtered).toString()}`
}

export default async function ScansPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'all'
  const page = Math.max(1, parseInt(params.page || '1', 10))

  const { scans, total } = await getScanRequests(statusFilter, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const fromItem = (page - 1) * PAGE_SIZE + 1
  const toItem = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Section 03 · Scan Queue
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Scan Queue</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1 bg-muted/20">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            const href = buildHref('/scans', {
              status: tab.value === 'all' ? undefined : tab.value,
            })

            return (
              <Link
                key={tab.value}
                href={href}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
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
                      {scan.domain ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground font-mono truncate max-w-[200px] block">
                      {scan.url}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">
                      {scan.contact_name ?? '—'}
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
                        {scan.error_message ? 'Error' : '—'}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground/60">
            Showing {fromItem}–{toItem} of {total}
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
    </div>
  )
}
