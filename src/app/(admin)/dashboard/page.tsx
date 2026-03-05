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
    }
  } catch {
    // Fallback mock data when DB not connected
    return {
      stats: { scanned: 12, sent: 10, viewed: 6, replied: 2, conversion: 20 },
      funnel: { scanned: 12, emailSent: 10, viewed: 6, replied: 2, converted: 1 },
      activities: [
        { id: '1', action: 'replied', details: 'Dr. Amy Chen replied to report', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: '2', action: 'viewed', details: 'Bright Smile viewed report (3rd time)', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
        { id: '3', action: 'sent', details: 'Report sent to Pacific Law Group', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { id: '4', action: 'scanned', details: 'Scan completed: Coastal Pediatrics', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { id: '5', action: 'expired', details: 'Summit Financial report expired', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
      ] satisfies ActivityEntry[],
    }
  }
}

export default async function DashboardPage() {
  const { stats, funnel, activities } = await getDashboardData()

  return (
    <div className="p-6 lg:p-8 space-y-8">
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
