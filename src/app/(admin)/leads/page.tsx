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
import { LeadStatusBadge, type LeadStatus } from '@/components/lead-status-badge'
import { ReportStatusBadge } from '@/components/report-status-badge'
import type { ReportStatus } from '@/lib/supabase/types'

type Props = {
  searchParams: Promise<{ status?: string }>
}

type CompanyReport = {
  id: string
  code: string
  status: string
  score: number | null
  created_at: string
}

type CompanyRow = {
  id: string
  name: string
  domain: string
  contact_name: string | null
  contact_email: string | null
  created_at: string
  reports: CompanyReport[]
}

type Lead = {
  companyId: string
  companyName: string
  domain: string
  contactName: string | null
  contactEmail: string | null
  reportsCount: number
  leadStatus: LeadStatus
  lastReportStatus: ReportStatus
  lastReportId: string
  daysSince: number
}

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Need Follow-up', value: 'need_followup' },
  { label: 'Active', value: 'active' },
  { label: 'Converted', value: 'converted' },
] as const

function computeLeadStatus(lastStatus: ReportStatus, daysSince: number): LeadStatus {
  if (lastStatus === 'replied') return 'converted'

  if (
    (lastStatus === 'sent' && daysSince > 3) ||
    (lastStatus === 'viewed' && daysSince > 5)
  ) {
    return 'need_followup'
  }

  if (
    ['draft', 'sent', 'viewed'].includes(lastStatus) &&
    daysSince <= 14
  ) {
    return 'active'
  }

  return 'stale'
}

function daysBetween(dateStr: string): number {
  const now = new Date()
  const then = new Date(dateStr)
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
}

async function getLeads(): Promise<Lead[]> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Supabase env vars not set')
    }

    const supabase = await createClient()
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*, reports(id, code, status, score, created_at)')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!companies) return []

    const leads: Lead[] = []

    for (const company of companies as CompanyRow[]) {
      if (!company.reports || company.reports.length === 0) continue

      const sortedReports = [...company.reports].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const latestReport = sortedReports[0]
      const lastStatus = latestReport.status as ReportStatus
      const daysSince = daysBetween(latestReport.created_at)
      const leadStatus = computeLeadStatus(lastStatus, daysSince)

      leads.push({
        companyId: company.id,
        companyName: company.name,
        domain: company.domain,
        contactName: company.contact_name,
        contactEmail: company.contact_email,
        reportsCount: company.reports.length,
        leadStatus,
        lastReportStatus: lastStatus,
        lastReportId: latestReport.id,
        daysSince,
      })
    }

    return leads
  } catch {
    return []
  }
}

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'all'

  const allLeads = await getLeads()
  const leads =
    statusFilter === 'all'
      ? allLeads
      : allLeads.filter((l) => l.leadStatus === statusFilter)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Section 04 · Lead Pipeline
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Lead Pipeline</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1 bg-muted/20">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            const href =
              tab.value === 'all' ? '/leads' : `/leads?status=${tab.value}`

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
                Company
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Domain
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Contact
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 text-right">
                Reports
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Lead Status
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Last Report Status
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 text-right">
                Days Since
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-12 font-mono text-sm"
                >
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.companyId}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <Link
                      href={`/reports/${lead.lastReportId}`}
                      className="block"
                    >
                      <span className="font-semibold text-sm text-foreground">
                        {lead.companyName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/reports/${lead.lastReportId}`}
                      className="block"
                    >
                      <span className="text-xs text-muted-foreground font-mono">
                        {lead.domain}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/reports/${lead.lastReportId}`}
                      className="block"
                    >
                      <div className="text-sm text-foreground">
                        {lead.contactName ?? '—'}
                      </div>
                      {lead.contactEmail && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {lead.contactEmail}
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/reports/${lead.lastReportId}`}
                      className="block"
                    >
                      <span className="font-mono text-sm">
                        {lead.reportsCount}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/reports/${lead.lastReportId}`}
                      className="block"
                    >
                      <LeadStatusBadge status={lead.leadStatus} />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/reports/${lead.lastReportId}`}
                      className="block"
                    >
                      <ReportStatusBadge status={lead.lastReportStatus} />
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/reports/${lead.lastReportId}`}
                      className="block"
                    >
                      <span className="font-mono text-sm">
                        {lead.daysSince}d
                      </span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
