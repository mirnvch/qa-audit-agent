import type { CoverageGranularity } from '@/lib/qa/schema'

type RemainingSection = {
  section: string
  done: number
  left: number
}

type Props = {
  sections: RemainingSection[]
  granularity?: CoverageGranularity
}

export function QaHeaviestSections({ sections, granularity = 'section' }: Props) {
  if (sections.length === 0) return null

  const heading = granularity === 'module' ? 'Heaviest remaining modules' : 'Heaviest remaining sections'
  const columnLabel = granularity === 'module' ? 'Module' : 'Section'

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{heading}</h3>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="text-left px-4 py-2 text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
                {columnLabel}
              </th>
              <th className="text-right px-4 py-2 text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
                Done
              </th>
              <th className="text-right px-4 py-2 text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
                Left
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.section} className="border-b last:border-0">
                <td className="px-4 py-2 text-muted-foreground">{s.section}</td>
                <td className="px-4 py-2 text-right">{s.done}</td>
                <td className={`px-4 py-2 text-right font-medium ${
                  s.left >= 50 ? 'text-red-400' :
                  s.left >= 20 ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  {s.left}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
