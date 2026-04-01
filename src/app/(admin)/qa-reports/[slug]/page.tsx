import { createClient } from '@/lib/supabase/server'
import { requireQaAccess } from '@/lib/auth/require-qa-access'
import { notFound, redirect } from 'next/navigation'
import { QaReportView } from '@/components/qa/qa-report-view'
import { QaReportSelector } from '@/components/qa/qa-report-selector'
import { QaPublicAccessPanel } from '@/components/qa/qa-public-access-panel'
import { QaUploadDialog } from '@/components/qa/qa-upload-dialog'
import type { QaProject, QaReport, QaReportModule, QaReportSection, QaProjectAccess, QaReportHistoryItem } from '@/lib/qa/schema'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ report?: string }>
}

export default async function QaReportDashboardPage({ params, searchParams }: Props) {
  await requireQaAccess()

  const { slug } = await params
  const { report: reportParam } = await searchParams

  const supabase = await createClient()

  // Get project
  const { data: project } = await (supabase.from as SupabaseAny)('qa_projects')
    .select('*')
    .eq('slug', slug)
    .single() as { data: QaProject | null }

  if (!project) notFound()

  // Get report history (capped at 20)
  const { data: historyRaw } = await (supabase.from as SupabaseAny)('qa_reports')
    .select('id, period_from, period_to, automated, active_scope')
    .eq('project_id', project.id)
    .order('period_to', { ascending: false })
    .limit(20) as { data: QaReportHistoryItem[] | null }

  const history = historyRaw ?? []

  // Resolve which report to show
  let report: QaReport | null = null

  if (reportParam) {
    const { data: specific } = await (supabase.from as SupabaseAny)('qa_reports')
      .select('*')
      .eq('id', reportParam)
      .eq('project_id', project.id)
      .single() as { data: QaReport | null }

    if (specific) {
      report = specific
    } else {
      redirect(`/qa-reports/${slug}`)
    }
  }

  if (!report && history.length > 0) {
    const { data: latest } = await (supabase.from as SupabaseAny)('qa_reports')
      .select('*')
      .eq('id', history[0].id)
      .single() as { data: QaReport | null }

    report = latest
  }

  // Get access info
  const { data: access } = await (supabase.from as SupabaseAny)('qa_project_access')
    .select('*')
    .eq('project_id', project.id)
    .single() as { data: QaProjectAccess | null }

  // Get modules and sections for current report
  let modules: QaReportModule[] = []
  let coveredSections: string[] = []
  let remainingSections: { section: string; done: number; left: number }[] = []

  if (report) {
    const [modulesRes, sectionsRes] = await Promise.all([
      (supabase.from as SupabaseAny)('qa_report_modules')
        .select('*')
        .eq('report_id', report.id)
        .order('sort_order') as Promise<{ data: QaReportModule[] | null }>,
      (supabase.from as SupabaseAny)('qa_report_sections')
        .select('*')
        .eq('report_id', report.id)
        .order('sort_order') as Promise<{ data: QaReportSection[] | null }>,
    ])

    modules = modulesRes.data ?? []

    const sections = sectionsRes.data ?? []
    coveredSections = sections
      .filter(s => s.type === 'covered')
      .map(s => s.section)
    remainingSections = sections
      .filter(s => s.type === 'remaining')
      .map(s => ({ section: s.section, done: s.done!, left: s.left! }))
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Toolbar */}
      <div className="space-y-4">
        <Link
          href="/qa-reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {project.name} <span className="text-muted-foreground/60">— QA Automation Report</span>
              </h1>
              {report && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50">
                  <div className={`w-2 h-2 rounded-full ${
                    report.failures === 0 ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className={`text-xs ${
                    report.failures === 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {report.failures === 0 ? '0 failures' : `${report.failures} failures`}
                  </span>
                </div>
              )}
            </div>
            {report && (
              <p className="text-[12px] text-muted-foreground/60 mt-1">
                {report.framework}
                {report.ci ? ` · ${report.ci}` : ''}
              </p>
            )}
            {report && (
              <p className="text-[11px] text-muted-foreground/40 mt-0.5">
                {new Date(report.period_from).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                {' \u2192 '}
                {new Date(report.period_to).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                {' · '}
                {new Date(report.period_to).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {report && (
              <QaReportSelector history={history} currentReportId={report.id} />
            )}
            <QaUploadDialog />
          </div>
        </div>

        {access && (
          <QaPublicAccessPanel
            access={access}
            projectId={project.id}
          />
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 dark:bg-cyan-400/40" />
        <div className="flex-1 h-px bg-border" />
        <span className="text-[8px] font-mono tracking-[0.15em] text-muted-foreground/40">
          REPORT DATA
        </span>
        <div className="flex-1 h-px bg-border" />
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 dark:bg-cyan-400/40" />
      </div>

      {/* Report content */}
      {report ? (
        <QaReportView
          project={{ name: project.name }}
          report={report}
          modules={modules}
          coveredSections={coveredSections}
          remainingSections={remainingSections}
          history={history}
          showHistory={true}
        />
      ) : (
        <div className="flex items-center justify-center py-24">
          <p className="text-xs font-mono text-muted-foreground/60 text-center max-w-md tracking-wide">
            No reports uploaded yet. Upload a QA report JSON to see the dashboard.
          </p>
        </div>
      )}
    </div>
  )
}
