'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type FindingCardProps = {
  finding: {
    finding_id: string
    severity: string
    confidence: string | null
    category: string | null
    title: string
    description: string | null
    business_impact: string | null
    page: string | null
    steps_to_reproduce: string[]
    evidence: {
      screenshot_url?: string
      eval_data?: string
      screenshot?: string
      snapshot_text?: string
    }
  }
  defaultOpen?: boolean
}

const severityConfig: Record<string, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-red-500/15 text-red-400 border-red-500/20',
  },
  moderate: {
    label: 'Moderate',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  },
  minor: {
    label: 'Minor',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

export function FindingCard({ finding, defaultOpen = false }: FindingCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const config = severityConfig[finding.severity] ?? severityConfig.minor

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span className="text-muted-foreground/60">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
        <Badge
          variant="outline"
          className={cn('font-mono text-[10px] tracking-wider font-semibold shrink-0', config.className)}
        >
          {config.label}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground shrink-0">
          {finding.finding_id}
        </span>
        <span className="text-sm font-medium text-foreground truncate">
          {finding.title}
        </span>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-4">
          {/* Description */}
          {finding.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {finding.description}
            </p>
          )}

          {/* Business Impact */}
          {finding.business_impact && (
            <div className="rounded-md bg-amber-500/5 border border-amber-500/15 px-3 py-2">
              <p className="text-[10px] font-mono text-amber-400/70 tracking-wider uppercase mb-1">
                Business Impact
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {finding.business_impact}
              </p>
            </div>
          )}

          {/* Steps to Reproduce */}
          {finding.steps_to_reproduce.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-muted-foreground/60 tracking-wider uppercase mb-2">
                Steps to Reproduce
              </p>
              <ol className="space-y-1 list-decimal list-inside">
                {finding.steps_to_reproduce.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Evidence */}
          {(finding.evidence.screenshot_url || finding.evidence.eval_data) && (
            <div>
              <p className="text-[10px] font-mono text-muted-foreground/60 tracking-wider uppercase mb-2">
                Evidence
              </p>
              {finding.evidence.screenshot_url && (
                <img
                  src={finding.evidence.screenshot_url}
                  alt={`Screenshot for ${finding.finding_id}`}
                  className="rounded-md border border-border/50 max-w-full mb-2"
                />
              )}
              {finding.evidence.eval_data && (
                <pre className="rounded-md bg-muted/30 border border-border/40 px-3 py-2 text-xs font-mono text-muted-foreground overflow-x-auto">
                  {finding.evidence.eval_data}
                </pre>
              )}
            </div>
          )}

          {/* Metadata tags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {finding.page && (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-muted/40 text-muted-foreground border border-border/40">
                <span className="text-muted-foreground/50">page</span>
                {finding.page}
              </span>
            )}
            {finding.category && (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-muted/40 text-muted-foreground border border-border/40">
                <span className="text-muted-foreground/50">cat</span>
                {finding.category}
              </span>
            )}
            {finding.confidence && (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-muted/40 text-muted-foreground border border-border/40">
                <span className="text-muted-foreground/50">conf</span>
                {finding.confidence}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
