import type { QaProjectProgressRollup } from '@/lib/qa/rollup'
import { TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'

type Props = {
  rollup: QaProjectProgressRollup
}

const gateConfig = {
  green: { icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Healthy' },
  yellow: { icon: ShieldAlert, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Needs attention' },
  red: { icon: ShieldX, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'At risk' },
}

function DeltaCell({ label, value, invert }: { label: string; value: number | null; invert?: boolean }) {
  if (value === null) return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">{label}</div>
      <div className="text-sm text-muted-foreground/40">—</div>
    </div>
  )

  // For remaining, negative is good (invert=true). For automated, positive is good.
  const isPositive = invert ? value < 0 : value > 0
  const isNegative = invert ? value > 0 : value < 0
  const Icon = value === 0 ? Minus : isPositive ? TrendingUp : TrendingDown
  const color = value === 0 ? 'text-muted-foreground/60' : isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-muted-foreground'
  const prefix = value > 0 ? '+' : ''

  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">{label}</div>
      <div className={`flex items-center gap-1 text-sm font-medium ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {prefix}{value}
      </div>
    </div>
  )
}

export function QaProgressBlock({ rollup }: Props) {
  if (!rollup.latestReport) return null

  const gate = gateConfig[rollup.qualityGate.status]
  const GateIcon = gate.icon

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md border ${gate.bg}`}>
            <GateIcon className={`h-4 w-4 ${gate.color}`} />
          </div>
          <div>
            <div className={`text-sm font-medium ${gate.color}`}>{gate.label}</div>
            <div className="text-[10px] text-muted-foreground/50 mt-0.5">
              {rollup.qualityGate.reasons[0]}
            </div>
          </div>
        </div>
        <div className="text-[9px] font-mono tracking-[0.15em] uppercase text-muted-foreground/30">
          Overall Project Progress
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DeltaCell label="Automated vs prev" value={rollup.automatedDeltaPrevious} />
        <DeltaCell label="Automated 7d" value={rollup.automatedDeltaLast7Days} />
        <DeltaCell label="Remaining vs prev" value={rollup.remainingDeltaPrevious} invert />
        <DeltaCell label="Remaining 7d" value={rollup.remainingDeltaLast7Days} invert />
      </div>

      {rollup.newlyCoveredSections.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
            Newly covered
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rollup.newlyCoveredSections.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
