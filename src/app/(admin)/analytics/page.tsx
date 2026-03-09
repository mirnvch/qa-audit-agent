import { createClient } from '@/lib/supabase/server'
import {
  ScansPerDayChart,
  ConversionFunnelChart,
  ScoreDistributionChart,
  TopDomainsChart,
} from '@/components/analytics-charts'

function groupByDay(items: { created_at: string }[]): { date: string; count: number }[] {
  const map = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    map.set(d.toISOString().split('T')[0], 0)
  }
  items.forEach(item => {
    const day = item.created_at.split('T')[0]
    map.set(day, (map.get(day) ?? 0) + 1)
  })
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
}

function buildScoreDistribution(scores: { score: number | null }[]): { range: string; count: number }[] {
  const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100']
  const counts = [0, 0, 0, 0, 0]
  scores.forEach(s => {
    if (s.score == null) return
    const idx = Math.min(Math.floor(s.score / 20), 4)
    counts[idx]++
  })
  return ranges.map((range, i) => ({ range, count: counts[i] }))
}

async function getAnalyticsData() {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [scansRes, scannedRes, sentRes, viewedRes, repliedRes, scoresRes, topDomainsRes] =
    await Promise.all([
      supabase
        .from('scan_requests')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'viewed'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'replied'),
      supabase.from('reports').select('score').not('score', 'is', null),
      supabase
        .from('reports')
        .select('score, company_id')
        .not('score', 'is', null)
        .order('score', { ascending: true })
        .limit(10),
    ])

  const scansByDay = groupByDay(scansRes.data ?? [])

  const funnel = [
    { stage: 'Scanned', count: scannedRes.count ?? 0 },
    { stage: 'Sent', count: sentRes.count ?? 0 },
    { stage: 'Viewed', count: viewedRes.count ?? 0 },
    { stage: 'Replied', count: repliedRes.count ?? 0 },
  ]

  const scoreDistribution = buildScoreDistribution(scoresRes.data ?? [])

  // Resolve company domains for top domains chart
  const topDomainsRaw = topDomainsRes.data ?? []
  let topDomains: { domain: string; score: number }[] = []

  if (topDomainsRaw.length > 0) {
    const companyIds = [...new Set(topDomainsRaw.map(r => r.company_id))]
    const { data: companies } = await supabase
      .from('companies')
      .select('id, domain')
      .in('id', companyIds)

    const domainMap = new Map((companies ?? []).map(c => [c.id, c.domain]))
    topDomains = topDomainsRaw.map(row => ({
      domain: domainMap.get(row.company_id) ?? 'unknown',
      score: row.score ?? 0,
    }))
  }

  return { scansByDay, funnel, scoreDistribution, topDomains }
}

export default async function AnalyticsPage() {
  const { scansByDay, funnel, scoreDistribution, topDomains } = await getAnalyticsData()

  const hasAnyData =
    scansByDay.some(d => d.count > 0) ||
    funnel.some(d => d.count > 0) ||
    scoreDistribution.some(d => d.count > 0) ||
    topDomains.length > 0

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Section Header — blueprint style */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-[9px] tracking-[0.2em] uppercase text-slate-600 mb-1"
            style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
          >
            Section 06 · Analytics · 30-Day Window
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        </div>
        <p
          className="text-[9px] tracking-[0.12em] text-slate-600 hidden sm:block"
          style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
        >
          SCALE: 1:1 · AUTO-REFRESH
        </p>
      </div>

      {/* Divider line with dot */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
        <div className="flex-1 h-px bg-slate-700/40" />
        <span
          className="text-[8px] tracking-[0.15em] text-slate-600"
          style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
        >
          DATA PANELS
        </span>
        <div className="flex-1 h-px bg-slate-700/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
      </div>

      {!hasAnyData ? (
        <div className="flex items-center justify-center py-24">
          <p
            className="text-xs text-slate-600 text-center max-w-md"
            style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', letterSpacing: '0.05em' }}
          >
            No data yet. Analytics will populate as you scan websites and send reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ScansPerDayChart data={scansByDay} />
          <ConversionFunnelChart data={funnel} />
          <ScoreDistributionChart data={scoreDistribution} />
          <TopDomainsChart data={topDomains} />
        </div>
      )}
    </div>
  )
}
