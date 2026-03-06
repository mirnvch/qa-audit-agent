import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/stat-card'
import { ConversionFunnel } from '@/components/conversion-funnel'
import { RecentActivity } from '@/components/recent-activity'

type ActivityEntry = {
  id: string
  action: string
  details: string
  created_at: string
}

async function getDashboardData() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase env vars not set')
    }
    const supabase = await createClient()

    const [scannedRes, sentRes, viewedRes, repliedRes, activityRes] = await Promise.all([
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).neq('status', 'draft'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).in('status', ['viewed', 'replied']),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'replied'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
    ])

    const scanned = scannedRes.count ?? 0
    const sent = sentRes.count ?? 0
    const viewed = viewedRes.count ?? 0
    const replied = repliedRes.count ?? 0
    const conversion = scanned > 0 ? Math.round((replied / scanned) * 100) : 0

    return {
      stats: { scanned, sent, viewed, replied, conversion },
      funnel: { scanned, emailSent: sent, viewed, replied, converted: 0 },
      activities: (activityRes.data ?? []) as ActivityEntry[],
      isOffline: false,
    }
  } catch {
    return {
      stats: { scanned: 0, sent: 0, viewed: 0, replied: 0, conversion: 0 },
      funnel: { scanned: 0, emailSent: 0, viewed: 0, replied: 0, converted: 0 },
      activities: [],
      isOffline: true,
    }
  }
}

export default async function DashboardPage() {
  const { stats, funnel, activities, isOffline } = await getDashboardData()

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {isOffline && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-400 font-mono">
            Unable to connect to database. Showing empty state.
          </p>
        </div>
      )}

      {/* Section Header */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          Section 01 · Outreach Pipeline Overview
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Outreach Dashboard</h1>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="TOTAL" value={stats.scanned} subtitle="SITES SCANNED" color="white" />
        <StatCard label="EMAIL" value={stats.sent} subtitle="REPORTS SENT" color="yellow" />
        <StatCard label="OPENED" value={stats.viewed} subtitle="REPORTS VIEWED" color="blue" />
        <StatCard label="CONV." value={stats.replied} subtitle="REPLIES" color="green" />
        <StatCard label="RATE" value={`${stats.conversion}%`} subtitle="CONVERSION" color="red" />
      </div>

      {/* Two Column: Funnel + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel data={funnel} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  )
}
