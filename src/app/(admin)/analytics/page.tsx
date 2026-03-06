import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      {/* Section Header */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          Section 06 · Analytics
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      </div>

      {!hasAnyData ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-muted-foreground font-mono text-center max-w-md">
            No data yet. Analytics will populate as you scan websites and send reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-wide">Scans per Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ScansPerDayChart data={scansByDay} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-wide">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ConversionFunnelChart data={funnel} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-wide">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreDistributionChart data={scoreDistribution} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono tracking-wide">Top Domains (Lowest Scores)</CardTitle>
            </CardHeader>
            <CardContent>
              <TopDomainsChart data={topDomains} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
