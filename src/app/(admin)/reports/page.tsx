import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
import type { ReportStatus } from '@/lib/supabase/types'

const PAGE_SIZE = 20

type Props = {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>
}

type MockFinding = { severity: 'critical' | 'moderate' | 'minor' }

type MockReport = {
  id: string
  code: string
  status: ReportStatus
  score: number
  view_count: number
  companies: {
    name: string
    domain: string
    contact_name: string
  }
  findings: MockFinding[]
}

const mockReports: MockReport[] = [
  {
    id: '1',
    code: 'RPT-7X4K9M',
    status: 'viewed',
    score: 54,
    view_count: 3,
    companies: {
      name: 'Bright Smile Dental',
      domain: 'brightsmile-dental.com',
      contact_name: 'Dr. Sarah Mitchell',
    },
    findings: [
      { severity: 'critical' },
      { severity: 'critical' },
      { severity: 'critical' },
      { severity: 'moderate' },
      { severity: 'moderate' },
      { severity: 'moderate' },
      { severity: 'moderate' },
      { severity: 'moderate' },
    ],
  },
  {
    id: '2',
    code: 'RPT-3M8NQ2',
    status: 'sent',
    score: 69,
    view_count: 0,
    companies: {
      name: 'Pacific Law Group',
      domain: 'pacificlawgroup.com',
      contact_name: 'James Rodriguez',
    },
    findings: [
      { severity: 'critical' },
      { severity: 'moderate' },
      { severity: 'moderate' },
      { severity: 'moderate' },
    ],
  },
  {
    id: '3',
    code: 'RPT-9K2LP5',
    status: 'replied',
    score: 24,
    view_count: 7,
    companies: {
      name: 'Evergreen Chiropractic',
      domain: 'evergreenchiro.com',
      contact_name: 'Dr. Amy Chen',
    },
    findings: [
      { severity: 'critical' },
      { severity: 'critical' },
      { severity: 'moderate' },
      { severity: 'moderate' },
      { severity: 'moderate' },
      { severity: 'moderate' },
    ],
  },
  {
    id: '4',
    code: 'RPT-5T7WX1',
    status: 'expired',
    score: 75,
    view_count: 0,
    companies: {
      name: 'Summit Financial Advisors',
      domain: 'summitfa.com',
      contact_name: 'Mark Thompson',
    },
    findings: [{ severity: 'moderate' }, { severity: 'moderate' }],
  },
  {
    id: '5',
    code: 'RPT-2H4YZ8',
    status: 'draft',
    score: 45,
    view_count: 0,
    companies: {
      name: 'Coastal Pediatrics',
      domain: 'coastalpediatrics.org',
      contact_name: 'Dr. Lisa Park',
    },
    findings: [
      { severity: 'critical' },
      { severity: 'critical' },
      { severity: 'critical' },
      { severity: 'critical' },
      { severity: 'moderate' },
      { severity: 'moderate' },
    ],
  },
]

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Viewed', value: 'viewed' },
  { label: 'Replied', value: 'replied' },
] as const

async function getReports(statusFilter: string, page: number, search: string) {
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
      .from('reports')
      .select('*, companies(*), findings(severity)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as ReportStatus)
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,status.ilike.%${search}%`)
    }

    const { data: reports, error, count } = await query.range(from, to)

    if (error) throw error

    return { reports: reports ?? [], total: count ?? 0 }
  } catch {
    let filtered =
      statusFilter === 'all'
        ? mockReports
        : mockReports.filter((r) => r.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.companies.name.toLowerCase().includes(q) ||
          r.companies.domain.toLowerCase().includes(q)
      )
    }
    const total = filtered.length
    return { reports: filtered.slice(from, to + 1), total }
  }
}

function countSeverities(findings: { severity: string }[]) {
  return {
    critical: findings.filter((f) => f.severity === 'critical').length,
    moderate: findings.filter((f) => f.severity === 'moderate').length,
    minor: findings.filter((f) => f.severity === 'minor').length,
  }
}

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const filtered = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''
  )
  if (filtered.length === 0) return basePath
  return `${basePath}?${new URLSearchParams(filtered).toString()}`
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'all'
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const query = params.q || ''

  const { reports, total } = await getReports(statusFilter, page, query)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Section 02 · Report Management
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1 bg-muted/20">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            const href = buildHref('/reports', {
              status: tab.value === 'all' ? undefined : tab.value,
              q: query || undefined,
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

      {/* Search */}
      <form className="relative flex-1 max-w-sm">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search reports..."
          className="w-full h-9 rounded-md border border-border/50 bg-muted/20 px-3 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {statusFilter !== 'all' && (
          <input type="hidden" name="status" value={statusFilter} />
        )}
      </form>

      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
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
                  colSpan={7}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const counts = countSeverities(report.findings ?? [])
                const company = report.companies

                return (
                  <TableRow
                    key={report.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
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
                          {company?.name ?? '—'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {company?.domain ?? ''}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/reports/${report.id}`} className="block">
                        <span className="text-sm text-foreground">
                          {company?.contact_name ?? '—'}
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
                          {report.view_count > 0 ? report.view_count : '—'}
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

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground/60">
            Showing {from}–{to} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildHref('/reports', {
                  status: statusFilter === 'all' ? undefined : statusFilter,
                  q: query || undefined,
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
                href={buildHref('/reports', {
                  status: statusFilter === 'all' ? undefined : statusFilter,
                  q: query || undefined,
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
