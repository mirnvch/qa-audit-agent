import type { QaReport } from '@/lib/qa/schema'

type Props = {
  report: QaReport
}

type CardDef = {
  label: string
  value: number
  subtitle: string
  color: string
}

export function QaSummaryCards({ report }: Props) {
  const cards: CardDef[] = [
    {
      label: 'Active scope',
      value: report.active_scope,
      subtitle: `${report.total_scope} total${report.duplicates_deleted > 0 ? ` \u2212 ${report.duplicates_deleted} dup/delete` : ''}`,
      color: 'text-foreground',
    },
    {
      label: 'Automated',
      value: report.automated,
      subtitle: report.active_scope > 0
        ? `${Math.round((report.automated / report.active_scope) * 100)}% of active`
        : '0% of active',
      color: 'text-green-400',
    },
    {
      label: 'Discovered tests',
      value: report.discovered_tests,
      subtitle: `${report.discovered_files} files · ${report.discovered_static} static`,
      color: 'text-blue-400',
    },
    {
      label: 'Remaining',
      value: report.remaining,
      subtitle: `${report.remaining_planned} planned · ${report.remaining_blocked} blocked`,
      color: 'text-red-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative rounded-lg border bg-card p-5 flex flex-col justify-between min-h-[110px]"
        >
          <span className="absolute top-4 right-4 text-[9px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
            {card.label}
          </span>
          <div>
            <div className={`text-4xl font-bold leading-none ${card.color}`}>
              {card.value.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] font-mono tracking-[0.1em] uppercase text-muted-foreground/70">
              {card.subtitle}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
