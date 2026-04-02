import type { CoverageGranularity } from '@/lib/qa/schema'

type Props = {
  sections: string[]
  granularity?: CoverageGranularity
}

export function QaCoveredSections({ sections, granularity = 'section' }: Props) {
  if (sections.length === 0) return null

  const label = granularity === 'module' ? 'Fully covered modules' : 'Fully covered sections'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
          100%
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <span
            key={section}
            className="text-xs px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20"
          >
            {section}
          </span>
        ))}
      </div>
    </div>
  )
}
