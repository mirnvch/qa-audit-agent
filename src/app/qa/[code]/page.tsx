import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QaReportView } from '@/components/qa/qa-report-view'
import { QaReportSelector } from '@/components/qa/qa-report-selector'
import type { QaReportHistoryItem } from '@/lib/qa/schema'

type Props = {
  params: Promise<{ code: string }>
  searchParams: Promise<{ report?: string }>
}

export default async function PublicQaReportPage({ params, searchParams }: Props) {
  const { code } = await params
  const { report: reportParam } = await searchParams

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_public_qa_report', {
    p_code: code,
    p_report_id: reportParam || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as { data: any; error: { message: string } | null }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Report not found</h1>
          <p className="text-sm text-muted-foreground">
            This link may be invalid or expired.
          </p>
        </div>
      </div>
    )
  }

  // If report param was provided but data shows latest (RPC ignored it),
  // redirect to clean URL
  if (reportParam && data.report?.id !== reportParam) {
    redirect(`/qa/${code}`)
  }

  const history: QaReportHistoryItem[] = data.history ?? []
  const showHistory = data.show_history ?? false

  // Shape modules
  const modules = (data.modules ?? []).map((m: { name: string; done: number; left: number }, i: number) => ({
    id: `m-${i}`,
    report_id: data.report.id,
    module_key: m.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: m.name,
    done: m.done,
    left: m.left,
    sort_order: i,
  }))

  const coveredSections: string[] = data.covered_sections ?? []
  const remainingSections = (data.remaining_sections ?? []).map(
    (s: { section: string; done: number; left: number }) => ({
      section: s.section,
      done: s.done,
      left: s.left,
    })
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {data.project.name} <span className="text-muted-foreground/60">— QA Automation Report</span>
            </h1>
            <p className="text-[12px] text-muted-foreground/60 mt-1">
              {data.report.framework}
              {data.report.ci ? ` · ${data.report.ci}` : ''}
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-0.5">
              {new Date(data.report.period_from).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {' \u2192 '}
              {new Date(data.report.period_to).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {' · '}
              {new Date(data.report.period_to).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {data.report.failures != null && (
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  data.report.failures === 0 ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className={`text-xs ${
                  data.report.failures === 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {data.report.failures === 0 ? '0 failures' : `${data.report.failures} failures`}
                </span>
              </div>
            )}

            {showHistory && history.length > 1 && (
              <QaReportSelector history={history} currentReportId={data.report.id} />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Report */}
        <QaReportView
          project={{ name: data.project.name }}
          report={data.report}
          modules={modules}
          coveredSections={coveredSections}
          remainingSections={remainingSections}
          history={showHistory ? history : undefined}
          showHistory={showHistory}
        />

        {/* Footer */}
        <div className="pt-8 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground/40 font-mono tracking-widest uppercase">
            Powered by QA Camp
          </p>
        </div>
      </div>
    </div>
  )
}
