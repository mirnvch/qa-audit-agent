import Link from 'next/link'
import type { QaProject, QaReport } from '@/lib/qa/schema'

type Props = {
  project: QaProject
  latestReport: QaReport | null
}

export function QaProjectCard({ project, latestReport }: Props) {
  const coveragePct = latestReport && latestReport.active_scope > 0
    ? Math.round((latestReport.automated / latestReport.active_scope) * 100)
    : 0

  return (
    <Link href={`/qa-reports/${project.slug}`}>
      <div className="rounded-lg border bg-card p-5 hover:bg-muted/20 transition-colors space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{project.name}</h3>
            {latestReport?.framework && (
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {latestReport.framework}
                {latestReport.ci ? ` · ${latestReport.ci}` : ''}
              </p>
            )}
          </div>
          {latestReport && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                latestReport.failures === 0 ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className={`text-xs ${
                latestReport.failures === 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {latestReport.failures === 0 ? '0 failures' : `${latestReport.failures} failures`}
              </span>
            </div>
          )}
        </div>

        {latestReport ? (
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Coverage: </span>
              <span className={`font-medium ${
                coveragePct >= 50 ? 'text-green-400' : 'text-orange-400'
              }`}>
                {coveragePct}%
              </span>
            </div>
            <div className="text-muted-foreground/60">
              {latestReport.automated} / {latestReport.active_scope}
            </div>
            <div className="text-[10px] text-muted-foreground/40 ml-auto">
              {new Date(latestReport.period_to).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50">No reports yet</p>
        )}
      </div>
    </Link>
  )
}
