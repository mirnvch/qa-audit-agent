import type { CiCd } from '@/lib/qa/schema'

type Props = {
  ciCd: CiCd | null
}

export function QaCiCdBlock({ ciCd }: Props) {
  if (!ciCd) return null

  const hasContent = ciCd.pipelines.length > 0 || ciCd.stack || ciCd.wip_note
  if (!hasContent) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">CI/CD</h3>

      {ciCd.pipelines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ciCd.pipelines.map((p) => (
            <span
              key={p}
              className="text-xs px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 text-muted-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {ciCd.stack && (
        <p className="text-xs font-mono text-muted-foreground/70">
          {ciCd.stack}
        </p>
      )}

      {ciCd.wip_note && (
        <blockquote className="border-l-2 border-muted-foreground/20 pl-3 text-xs text-muted-foreground/60 italic">
          {ciCd.wip_note}
        </blockquote>
      )}
    </div>
  )
}
