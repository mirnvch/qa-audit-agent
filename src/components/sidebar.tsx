'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  ScanSearch,
  Target,
  Grid3X3,
  Settings,
} from 'lucide-react'
import { NewScanDialog } from '@/components/new-scan-dialog'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { href: '/reports', label: 'Reports', icon: FileText, enabled: true },
  { href: '/scans', label: 'Scan Queue', icon: ScanSearch, enabled: true },
  { href: '/leads', label: 'Lead Pipeline', icon: Target, enabled: true },
  { href: '/templates', label: 'Email Templates', icon: Grid3X3, enabled: true },
  { href: '/settings', label: 'Settings', icon: Settings, enabled: true },
]

type QuickStats = {
  activeReports: number
  pendingViews: number
  weekReplies: number
  pendingScans: number
}

export function Sidebar({ stats }: { stats: QuickStats }) {
  const pathname = usePathname()

  return (
    <aside className="w-[250px] border-r border-border/50 flex flex-col h-screen sticky top-0">
      {/* New Scan Button */}
      <div className="p-4">
        <NewScanDialog />
      </div>

      {/* Navigation */}
      <div className="px-4 flex-1">
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase mb-3">
          Navigation
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            if (!item.enabled) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground/40 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-muted/50 text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-border/50">
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase mb-3">
          Quick Stats
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Reports</span>
            <span className="font-medium">{stats.activeReports}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending Views</span>
            <span className="font-medium">{stats.pendingViews}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">This Week Replies</span>
            <span className="font-medium">{stats.weekReplies}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending Scans</span>
            <span className="font-medium">{stats.pendingScans}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
