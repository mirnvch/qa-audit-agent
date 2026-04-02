import type { RunMeta } from '@/lib/qa/schema'
import { GitBranch, Hash, ExternalLink, Cpu } from 'lucide-react'

type Props = {
  runMeta: RunMeta
}

function MetaItem({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-1.5 text-[11px]">
      <Icon className="h-3 w-3 text-muted-foreground/40" />
      <span className="text-muted-foreground/50">{label}</span>
      <span className="text-muted-foreground font-mono">{value}</span>
      {href && <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/30" />}
    </div>
  )

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{content}</a>
  }
  return content
}

export function QaRunMetaBlock({ runMeta }: Props) {
  const hasContent = runMeta.branch || runMeta.commit_sha || runMeta.pipeline

  if (!hasContent) return null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
      {runMeta.branch && (
        <MetaItem icon={GitBranch} label="branch" value={runMeta.branch} />
      )}
      {runMeta.commit_sha && (
        <MetaItem
          icon={Hash}
          label="commit"
          value={runMeta.commit_sha.slice(0, 8)}
          href={runMeta.build_url ?? undefined}
        />
      )}
      {runMeta.pipeline && (
        <MetaItem icon={Cpu} label="pipeline" value={runMeta.pipeline} />
      )}
      {runMeta.generated_at && (
        <div className="text-[10px] text-muted-foreground/30 ml-auto">
          {new Date(runMeta.generated_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </div>
      )}
    </div>
  )
}
