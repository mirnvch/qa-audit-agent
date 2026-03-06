import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScanSearch, Send, Eye, MessageSquare, Trash2, Mail } from 'lucide-react'
import { ReportStatusBadge } from '@/components/report-status-badge'
import { LeadStatusBadge, type LeadStatus } from '@/components/lead-status-badge'
import { ScoreCircle } from '@/components/score-circle'
import { formatDate } from '@/lib/format'
import type { Company, Report, ReportStatus, ActivityAction, ActivityLog } from '@/lib/supabase/types'

type Props = {
  params: Promise<{ id: string }>
}

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

function relativeTime(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return formatDate(dateStr)
}

const actionConfig: Record<ActivityAction, { icon: typeof ScanSearch; label: string; color: string }> = {
  scanned: { icon: ScanSearch, label: 'Scan completed', color: 'text-blue-400' },
  sent: { icon: Send, label: 'Report sent', color: 'text-amber-400' },
  email_sent: { icon: Mail, label: 'Email sent', color: 'text-purple-400' },
  viewed: { icon: Eye, label: 'Report viewed', color: 'text-emerald-400' },
  replied: { icon: MessageSquare, label: 'Reply received', color: 'text-green-400' },
  deleted: { icon: Trash2, label: 'Deleted', color: 'text-red-400' },
  expired: { icon: Send, label: 'Expired', color: 'text-muted-foreground' },
  converted: { icon: MessageSquare, label: 'Converted', color: 'text-emerald-400' },
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    notFound()
  }

  const supabase = await createClient()

  // Fetch company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single<Company>()

  if (companyError || !company) {
    notFound()
  }

  // Fetch reports with findings count
  type ReportWithFindings = Report & { findings: { severity: string }[] }
  const { data: reports } = await supabase
    .from('reports')
    .select('*, findings(severity)')
    .eq('company_id', id)
    .order('created_at', { ascending: false })
    .returns<ReportWithFindings[]>()

  const reportsList = reports ?? []

  // Fetch activity for all reports
  const reportIds = reportsList.map((r) => r.id)
  let activityList: ActivityLog[] = []

  if (reportIds.length > 0) {
    const { data: activity } = await supabase
      .from('activity_log')
      .select('*')
      .in('report_id', reportIds)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<ActivityLog[]>()

    activityList = activity ?? []
  }

  // Compute lead status from latest report
  let leadStatus: LeadStatus = 'stale'
  if (reportsList.length > 0) {
    const latest = reportsList[0]
    const days = daysBetween(latest.created_at)
    leadStatus = computeLeadStatus(latest.status as ReportStatus, days)
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Back link */}
      <Link
        href="/leads"
        className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Lead Pipeline
      </Link>

      {/* Company header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {company.domain}
            {company.contact_email && (
              <span> &middot; {company.contact_email}</span>
            )}
          </p>
        </div>
        <LeadStatusBadge status={leadStatus} />
      </div>

      <div className="border-t border-border/50" />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timeline */}
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-4">
            Timeline
          </p>
          {activityList.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono py-8 text-center">
              No activity recorded yet
            </p>
          ) : (
            <div className="space-y-0">
              {activityList.map((item) => {
                const config = actionConfig[item.action] ?? {
                  icon: ScanSearch,
                  label: item.action,
                  color: 'text-muted-foreground',
                }
                const Icon = config.icon

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-3 border-b border-border/30 last:border-b-0"
                  >
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {config.label}
                      </p>
                      {item.details && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {item.details}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-mono whitespace-nowrap">
                      {relativeTime(item.created_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Reports */}
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-4">
            Reports
          </p>
          {reportsList.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono py-8 text-center">
              No reports for this company
            </p>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 px-4">
                      Code
                    </th>
                    <th className="text-left font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 px-4">
                      Status
                    </th>
                    <th className="text-center font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 px-4">
                      Score
                    </th>
                    <th className="text-right font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 px-4">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportsList.map((report) => {
                    const findings = report.findings ?? []
                    const criticalCount = findings.filter(
                      (f: { severity: string }) => f.severity === 'critical'
                    ).length
                    const moderateCount = findings.filter(
                      (f: { severity: string }) => f.severity === 'moderate'
                    ).length

                    return (
                      <tr
                        key={report.id}
                        className="border-b border-border/30 last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/reports/${report.id}`}
                            className="font-mono text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4"
                          >
                            {report.code}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <ReportStatusBadge status={report.status as ReportStatus} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {report.score != null ? (
                            <div className="flex items-center justify-center gap-2">
                              <ScoreCircle score={report.score} size={32} />
                              <span className="text-xs text-muted-foreground font-mono">
                                {criticalCount}/{moderateCount}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatDate(report.created_at)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
