import { ArrowRight } from 'lucide-react'

type Props = {
  items: string[]
}

export function QaRecommendations({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Recommended next</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <ArrowRight className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
