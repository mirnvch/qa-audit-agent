type FunnelData = {
  scanned: number
  emailSent: number
  viewed: number
  replied: number
  converted: number
}

type FunnelRow = {
  label: string
  value: number
  numColor: string
  barColor: string
}

export function ConversionFunnel({ data }: { data: FunnelData }) {
  const max = data.scanned || 1

  const rows: FunnelRow[] = [
    { label: 'SCANNED', value: data.scanned, numColor: 'text-foreground', barColor: 'bg-muted-foreground/40' },
    { label: 'EMAIL SENT', value: data.emailSent, numColor: 'text-yellow-400', barColor: 'bg-yellow-400' },
    { label: 'REPORT VIEWED', value: data.viewed, numColor: 'text-blue-400', barColor: 'bg-blue-400' },
    { label: 'REPLIED', value: data.replied, numColor: 'text-green-400', barColor: 'bg-green-400' },
    { label: 'CONVERTED', value: data.converted, numColor: 'text-purple-400', barColor: 'bg-purple-400' },
  ]

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60 mb-5">
        Conversion Funnel
      </h2>
      <div className="space-y-4">
        {rows.map((row) => {
          const width = Math.round((row.value / max) * 100)
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono tracking-[0.08em] uppercase text-muted-foreground">
                  {row.label}
                </span>
                <span className={`text-sm font-bold font-mono ${row.numColor}`}>
                  {row.value}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/40">
                <div
                  className={`h-1.5 rounded-full ${row.barColor} transition-all`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
