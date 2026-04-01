import type { QaReport } from '@/lib/qa/schema'

type Props = {
  report: QaReport
}

export function QaAutomationPlanBar({ report }: Props) {
  const total = report.plan_automated + report.plan_planned + report.plan_blocked + report.plan_manual
  if (total === 0) return null

  const pct = (v: number) => (v / total) * 100
  const coveragePct = Math.round(pct(report.plan_automated))

  const segments = [
    { value: report.plan_automated, color: 'bg-green-500', label: 'Automated' },
    { value: report.plan_planned, color: 'bg-blue-500', label: 'Planned' },
    { value: report.plan_blocked, color: 'bg-orange-500', label: 'Blocked' },
    { value: report.plan_manual, color: 'bg-gray-500', label: 'Manual' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Automation plan — {report.active_scope} active cases
        </h3>
        <span className="text-sm font-medium text-green-400">
          {coveragePct}% covered
        </span>
      </div>

      <div className="h-4 rounded-full overflow-hidden flex bg-muted/30">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              className={`${seg.color} transition-all`}
              style={{ width: `${pct(seg.value)}%` }}
            />
          ) : null
        )}
      </div>

      <div className="flex gap-4 text-[11px] text-muted-foreground">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${seg.color}`} />
            {seg.label} {seg.value}
          </div>
        ))}
      </div>
    </div>
  )
}
