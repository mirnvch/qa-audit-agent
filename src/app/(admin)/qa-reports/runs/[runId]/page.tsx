import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireQaAccess } from '@/lib/auth/require-qa-access'
import type { QaRunRow } from '@/lib/qa/run-schema'
import { QaRunHeader } from '@/components/qa/runs/qa-run-header'
import { QaRunDistributionBar } from '@/components/qa/runs/qa-run-distribution-bar'
import { QaRunScorecard } from '@/components/qa/runs/qa-run-scorecard'
import { QaRunRunnerRow } from '@/components/qa/runs/qa-run-runner-row'
import { QaRunCategoryGrid } from '@/components/qa/runs/qa-run-category-grid'
import { QaRunDetailShell } from '@/components/qa/runs/qa-run-detail-shell'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

type Props = {
  params: Promise<{ runId: string }>
}

type QaRunDetailRow = QaRunRow & { qa_projects: { name: string } | { name: string }[] | null }

async function getRun(runId: string): Promise<{ run: QaRunRow; projectName: string } | null> {
  const supabase = await createClient()
  const { data } = (await (supabase.from as SupabaseAny)('qa_runs')
    .select('*, qa_projects(name)')
    .eq('id', runId)
    .single()) as { data: QaRunDetailRow | null }
  if (!data) return null
  const proj = Array.isArray(data.qa_projects) ? data.qa_projects[0] : data.qa_projects
  return {
    run: data,
    projectName: proj?.name ?? 'Unknown project',
  }
}

export default async function QaRunDetailPage({ params }: Props) {
  await requireQaAccess()
  const { runId } = await params

  // Validate the runId looks like a UUID before hitting the DB to avoid
  // throwing a noisy error on obviously bad input.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(runId)) {
    notFound()
  }

  const result = await getRun(runId)
  if (!result) notFound()
  const { run, projectName } = result

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <QaRunHeader run={run} projectName={projectName} />

      <QaRunDistributionBar
        totals={{
          total: run.total,
          passed: run.passed,
          failed: run.failed,
          skipped: run.skipped,
          flaky: run.flaky,
        }}
        caption="Test result distribution"
        sub={`${run.total} total checks across ${run.categories.length} ${run.categories.length === 1 ? 'category' : 'categories'}`}
      />

      <section className="space-y-2">
        <h2
          className="text-lg font-semibold flex items-baseline gap-3"
          style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
        >
          <span className="text-xs font-mono text-muted-foreground/60">01</span> Health scorecard
        </h2>
        <QaRunScorecard
          totals={{
            total: run.total,
            passed: run.passed,
            failed: run.failed,
            skipped: run.skipped,
            flaky: run.flaky,
          }}
        />
      </section>

      {run.runners.length > 0 && (
        <section className="space-y-2">
          <h2
            className="text-lg font-semibold flex items-baseline gap-3"
            style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
          >
            <span className="text-xs font-mono text-muted-foreground/60">02</span> Runners
          </h2>
          <QaRunRunnerRow runners={run.runners} />
        </section>
      )}

      {run.categories.length > 0 && (
        <section className="space-y-2">
          <h2
            className="text-lg font-semibold flex items-baseline gap-3"
            style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
          >
            <span className="text-xs font-mono text-muted-foreground/60">03</span> Categories at a
            glance
          </h2>
          <QaRunCategoryGrid categories={run.categories} />
        </section>
      )}

      <section className="space-y-3">
        <h2
          className="text-lg font-semibold flex items-baseline gap-3"
          style={{ fontFamily: 'var(--font-fraunces, var(--font-sans))' }}
        >
          <span className="text-xs font-mono text-muted-foreground/60">04</span> All tests
          <span className="text-xs font-normal text-muted-foreground">
            filter, search, expand failures inline
          </span>
        </h2>
        <QaRunDetailShell categories={run.categories} tests={run.tests} />
      </section>
    </div>
  )
}
