import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireQaAccess } from '@/lib/auth/require-qa-access'
import { QaRunListCard } from '@/components/qa/runs/qa-run-list-card'
import type { QaRunListItem } from '@/lib/qa/run-schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

type QaRunListRow = Omit<QaRunListItem, 'project_name'> & {
  qa_projects: { name: string } | { name: string }[] | null
}

async function getLatestRuns(limit = 30): Promise<QaRunListItem[]> {
  const supabase = await createClient()
  const { data } = (await (supabase.from as SupabaseAny)('qa_runs')
    .select(
      'id, project_id, run_id, kind, env, branch, commit_sha, pipeline, build_url, started_at, finished_at, duration_ms, total, passed, failed, skipped, flaky, qa_projects(name)'
    )
    .order('started_at', { ascending: false })
    .limit(limit)) as { data: QaRunListRow[] | null }

  if (!data) return []
  return data.map((r) => {
    const proj = Array.isArray(r.qa_projects) ? r.qa_projects[0] : r.qa_projects
    return {
      id: r.id,
      project_id: r.project_id,
      run_id: r.run_id,
      kind: r.kind,
      env: r.env,
      branch: r.branch,
      commit_sha: r.commit_sha,
      pipeline: r.pipeline,
      build_url: r.build_url,
      started_at: r.started_at,
      finished_at: r.finished_at,
      duration_ms: r.duration_ms,
      total: r.total,
      passed: r.passed,
      failed: r.failed,
      skipped: r.skipped,
      flaky: r.flaky,
      project_name: proj?.name ?? 'Unknown project',
    }
  })
}

export default async function QaRunsListPage() {
  await requireQaAccess()
  const runs = await getLatestRuns(30)

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <Link
        href="/qa-reports"
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-3 w-3" /> Back to QA Reports
      </Link>

      <div>
        <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-muted-foreground/50 mb-1">
          Section · QA Test Runs
        </p>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
        >
          Daily / nightly test runs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Per-execution test-run reports from CI pipelines. Most recent 30 across all
          projects.
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
          No qa-runs ingested yet. POST to <code>/api/v1/qa-runs</code> from a CI
          pipeline to publish a run report.
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((r) => (
            <QaRunListCard key={r.id} run={r} />
          ))}
        </div>
      )}
    </div>
  )
}
