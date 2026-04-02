import Link from 'next/link'
import type { QaProject, QaReport } from '@/lib/qa/schema'
import type { QaProjectProgressRollup } from '@/lib/qa/rollup'
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'

type Props = {
  project: QaProject
  latestReport: QaReport | null
  rollup?: QaProjectProgressRollup
}

const gateIcons = {
  green: ShieldCheck,
  yellow: ShieldAlert,
  red: ShieldX,
}

const gateColors = {
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
}

export function QaProjectCard({ project, latestReport, rollup }: Props) {
  const coveragePct = latestReport && latestReport.active_scope > 0
    ? Math.round((latestReport.automated / latestReport.active_scope) * 100)
    : 0

  const gateStatus = rollup?.qualityGate.status ?? null
  const GateIcon = gateStatus ? gateIcons[gateStatus] : null
  const gateColor = gateStatus ? gateColors[gateStatus] : ''

  const automatedDelta = rollup?.automatedDeltaPrevious ?? null

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
          <div className="flex items-center gap-2">
            {GateIcon && (
              <GateIcon className={`h-4 w-4 ${gateColor}`} />
            )}
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
            {automatedDelta !== null && (
              <div className={`text-xs font-mono ${
                automatedDelta > 0 ? 'text-green-400' :
                automatedDelta < 0 ? 'text-red-400' :
                'text-muted-foreground/50'
              }`}>
                {automatedDelta > 0 ? '+' : ''}{automatedDelta} automated
              </div>
            )}
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
