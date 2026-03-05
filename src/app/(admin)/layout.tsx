import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { createClient } from '@/lib/supabase/server'

async function getQuickStats() {
  try {
    const supabase = await createClient()

    const [activeRes, pendingRes, repliesRes] = await Promise.all([
      supabase.from('reports').select('*', { count: 'exact', head: true }).in('status', ['draft', 'sent', 'viewed']),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'replied').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    return {
      activeReports: activeRes.count ?? 0,
      pendingViews: pendingRes.count ?? 0,
      weekReplies: repliesRes.count ?? 0,
    }
  } catch {
    return { activeReports: 0, pendingViews: 0, weekReplies: 0 }
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const stats = await getQuickStats()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar stats={stats} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
