import type { ExecutionGroup } from '@/lib/qa/schema'

type Props = {
  groups: ExecutionGroup[]
}

export function QaExecutionGroups({ groups }: Props) {
  if (groups.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Execution groups (codebase)</h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {groups.map((group) => {
          const subtitle = [
            group.tagged_files != null ? `tagged · ${group.tagged_files} files` : null,
            group.files != null ? `${group.files} files` : null,
            group.static != null ? `${group.static} static` : null,
          ].filter(Boolean).join(' · ')

          return (
            <div key={group.name} className="rounded-lg border bg-card p-4">
              <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/60 mb-1">
                {group.name}
              </div>
              <div className="text-2xl font-bold">{group.count}</div>
              {subtitle && (
                <div className="text-[10px] text-muted-foreground/60 mt-1">
                  {subtitle}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {groups.filter(g => g.note).map((g) => (
        <p key={g.name} className="text-[10px] text-muted-foreground/50 italic">
          {g.note}
        </p>
      ))}
    </div>
  )
}
