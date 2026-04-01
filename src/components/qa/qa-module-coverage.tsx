import type { QaReportModule } from '@/lib/qa/schema'

type Props = {
  modules: QaReportModule[]
}

export function QaModuleCoverage({ modules }: Props) {
  if (modules.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Coverage by module</h3>
      <div className="space-y-2.5">
        {modules.map((mod) => {
          const total = mod.done + mod.left
          const pct = total > 0 ? Math.round((mod.done / total) * 100) : 0

          return (
            <div key={mod.module_key} className="flex items-center gap-3">
              <div className="w-36 text-sm font-medium shrink-0 truncate" title={mod.name}>
                {mod.name}
              </div>
              <div className="flex-1 h-7 rounded overflow-hidden flex relative bg-muted/30">
                {/* Green filled segment */}
                <div
                  className="h-full bg-green-500/80 flex items-center justify-center"
                  style={{ width: `${pct}%`, minWidth: mod.done > 0 ? '2rem' : 0 }}
                >
                  {pct >= 15 && (
                    <span className="text-[10px] font-mono text-green-100/90">{mod.done}</span>
                  )}
                </div>
                {/* Gray remaining segment */}
                <div
                  className="h-full flex-1 flex items-center justify-center"
                >
                  {mod.left > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground/60">{mod.left}</span>
                  )}
                </div>
              </div>
              <div className={`w-12 text-right text-sm font-medium ${
                pct === 100 ? 'text-green-400' :
                pct >= 50 ? 'text-yellow-400' :
                pct > 0 ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {pct}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
