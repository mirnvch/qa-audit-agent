import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScansTable } from '@/components/scans-table'
import type { ScanRequest, ScanRequestStatus } from '@/lib/supabase/types'

const PAGE_SIZE = 20

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>
}

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Scanning', value: 'scanning' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
] as const

async function getScanRequests(statusFilter: string, page: number): Promise<{ scans: ScanRequest[]; total: number }> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Supabase env vars not set')
    }

    const supabase = await createClient()
    let query = supabase
      .from('scan_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as ScanRequestStatus)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return { scans: (data ?? []) as ScanRequest[], total: count ?? 0 }
  } catch {
    return { scans: [], total: 0 }
  }
}

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const filtered = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''
  )
  if (filtered.length === 0) return basePath
  return `${basePath}?${new URLSearchParams(filtered).toString()}`
}

export default async function ScansPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'all'
  const page = Math.max(1, parseInt(params.page || '1', 10))

  const { scans, total } = await getScanRequests(statusFilter, page)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Section 03 · Scan Queue
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Scan Queue</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1 bg-muted/20">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            const href = buildHref('/scans', {
              status: tab.value === 'all' ? undefined : tab.value,
            })

            return (
              <Link
                key={tab.value}
                href={href}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      <ScansTable
        initialScans={scans}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        statusFilter={statusFilter}
      />
    </div>
  )
}
