import Link from 'next/link'
import { Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireQaAccess } from '@/lib/auth/require-qa-access'
import { QaProjectCard } from '@/components/qa/qa-project-card'
import { QaUploadDialog } from '@/components/qa/qa-upload-dialog'
import { computeQaProjectRollup, type QaRollupHistoryPoint } from '@/lib/qa/rollup'
import type { QaProject, QaReport } from '@/lib/qa/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

async function getProjects() {
  const supabase = await createClient()

  const { data: projects } = await (supabase.from as SupabaseAny)('qa_projects')
    .select('*')
    .order('name') as { data: QaProject[] | null }

  if (!projects || projects.length === 0) {
    return []
  }

  const projectIds = projects.map((p: QaProject) => p.id)

  // Fetch last 2 reports per project for rollup (we need latest + previous for delta)
  const { data: reports } = await (supabase.from as SupabaseAny)('qa_reports')
    .select('id, project_id, period_from, period_to, automated, active_scope, remaining, failures, framework, ci')
    .in('project_id', projectIds)
    .order('period_to', { ascending: false }) as { data: (QaReport & { remaining: number; failures: number })[] | null }

  const reportsByProject = new Map<string, typeof reports>()
  for (const r of reports ?? []) {
    const arr = reportsByProject.get(r.project_id) ?? []
    arr.push(r)
    reportsByProject.set(r.project_id, arr)
  }

  return projects.map((p: QaProject) => {
    const projectReports = reportsByProject.get(p.id) ?? []
    const latestReport = projectReports[0] ?? null

    // Compute lightweight rollup (no covered sections needed for card)
    const rollupHistory: QaRollupHistoryPoint[] = projectReports.slice(0, 5).map(r => ({
      id: r.id,
      period_from: r.period_from,
      period_to: r.period_to,
      automated: r.automated,
      active_scope: r.active_scope,
      remaining: r.remaining,
      failures: r.failures,
      covered_sections: [], // Not needed for quality gate on list page
    }))
    const rollup = computeQaProjectRollup(rollupHistory)

    return { project: p, latestReport, rollup }
  })
}

export default async function QaReportsPage() {
  await requireQaAccess()
  const projectsWithReports = await getProjects()

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/50 mb-1">
            Section 09 · QA Automation Reports
          </p>
          <h1 className="text-3xl font-bold tracking-tight">QA Reports</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/qa-reports/runs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Activity className="h-3.5 w-3.5" />
            Test runs
          </Link>
          <QaUploadDialog />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 dark:bg-cyan-400/40" />
        <div className="flex-1 h-px bg-border" />
        <span className="text-[8px] font-mono tracking-[0.15em] text-muted-foreground/40">
          PROJECTS
        </span>
        <div className="flex-1 h-px bg-border" />
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 dark:bg-cyan-400/40" />
      </div>

      {projectsWithReports.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-xs font-mono text-muted-foreground/60 text-center max-w-md tracking-wide">
            No projects yet. Upload your first QA report JSON to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsWithReports.map(({ project, latestReport, rollup }) => (
            <QaProjectCard
              key={project.id}
              project={project}
              latestReport={latestReport}
              rollup={rollup}
            />
          ))}
        </div>
      )}
    </div>
  )
}
