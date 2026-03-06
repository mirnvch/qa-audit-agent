import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ScoreCircle } from '@/components/score-circle'
import { ReportStatusBadge } from '@/components/report-status-badge'
import { FindingCard } from '@/components/finding-card'
import { ReportDetailActions } from '@/components/report-detail-actions'
import type { ReportStatus, Finding, ReportWithFindings } from '@/lib/supabase/types'

type Props = {
  params: Promise<{ id: string }>
}

async function getReport(id: string): Promise<ReportWithFindings | null> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Supabase env vars not set')
    }

    const supabase = await createClient()
    const { data: report, error } = await supabase
      .from('reports')
      .select('*, companies(*), findings(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return (report as ReportWithFindings) ?? null
  } catch {
    return null
  }
}

function groupFindingsBySeverity(findings: Finding[]) {
  return {
    critical: findings.filter((f) => f.severity === 'critical'),
    moderate: findings.filter((f) => f.severity === 'moderate'),
    minor: findings.filter((f) => f.severity === 'minor'),
  }
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params
  const report = await getReport(id)

  if (!report) notFound()

  const company = report.companies
  const findings = (report.findings ?? []) as Finding[]
  const grouped = groupFindingsBySeverity(findings)

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono mb-6"
      >
        ← Reports
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight truncate">{company?.name ?? '—'}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            {company?.domain ?? ''}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <ReportStatusBadge status={report.status as ReportStatus} />
            <span className="font-mono text-xs text-muted-foreground tracking-wider">
              {report.code}
            </span>
          </div>
        </div>

        <ScoreCircle score={report.score ?? 0} size={88} />
      </div>

      {/* Action buttons */}
      <ReportDetailActions
        reportId={report.id}
        reportCode={report.code}
        currentStatus={report.status as ReportStatus}
        companyName={company?.name ?? ''}
        contactName={company?.contact_name ?? null}
        contactEmail={company?.contact_email ?? null}
        domain={company?.domain ?? ''}
        score={report.score}
        findingsCount={findings.length}
      />

      <hr className="my-8 border-border/40" />

      {/* Findings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Findings{' '}
          <span className="text-muted-foreground font-mono text-sm font-normal">
            ({findings.length})
          </span>
        </h2>

        {grouped.critical.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-red-400/70 tracking-[0.15em] uppercase">
              Critical — {grouped.critical.length}
            </p>
            {grouped.critical.map((f) => (
              <FindingCard key={f.finding_id} finding={f} defaultOpen={true} />
            ))}
          </div>
        )}

        {grouped.moderate.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-amber-400/70 tracking-[0.15em] uppercase">
              Moderate — {grouped.moderate.length}
            </p>
            {grouped.moderate.map((f) => (
              <FindingCard key={f.finding_id} finding={f} defaultOpen={false} />
            ))}
          </div>
        )}

        {grouped.minor.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase">
              Minor — {grouped.minor.length}
            </p>
            {grouped.minor.map((f) => (
              <FindingCard key={f.finding_id} finding={f} defaultOpen={false} />
            ))}
          </div>
        )}

        {findings.length === 0 && (
          <p className="text-muted-foreground text-sm font-mono">No findings recorded.</p>
        )}
      </section>

      <hr className="my-8 border-border/40" />

      {/* Positives */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">What&apos;s Working</h2>
        {(report.positives ?? []).length > 0 ? (
          <ul className="space-y-2">
            {report.positives.map((positive, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                {positive}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm font-mono">No positives recorded.</p>
        )}
      </section>

      <hr className="my-8 border-border/40" />

      {/* Metadata */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Details</h2>
        <dl className="space-y-2">
          {report.score_calculation && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Score Calculation
              </dt>
              <dd className="font-mono text-sm text-foreground">
                {report.score_calculation}
              </dd>
            </div>
          )}

          {report.audit_date && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Audit Date
              </dt>
              <dd className="text-sm text-foreground">{report.audit_date}</dd>
            </div>
          )}

          {(report.pages_checked ?? []).length > 0 && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Pages Checked
              </dt>
              <dd className="text-sm text-muted-foreground font-mono">
                {report.pages_checked.join(', ')}
              </dd>
            </div>
          )}

          {(report.skipped_checks ?? []).length > 0 && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Skipped Checks
              </dt>
              <dd className="text-sm text-muted-foreground font-mono">
                {report.skipped_checks.join(', ')}
              </dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  )
}
