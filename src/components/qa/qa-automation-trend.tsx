'use client'

import { useTheme } from 'next-themes'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { QaReportHistoryItem } from '@/lib/qa/schema'

type Props = {
  history: QaReportHistoryItem[]
}

const palettes = {
  dark: {
    axis: '#64748b',
    grid: '#1e293b',
    gridOpacity: 0.6,
    tooltipBg: '#0c1222',
    tooltipBorder: '#1e293b',
    tooltipText: '#e2e8f0',
    tooltipDim: '#94a3b8',
  },
  light: {
    axis: '#94a3b8',
    grid: '#e2e8f0',
    gridOpacity: 0.8,
    tooltipBg: '#0f172a',
    tooltipBorder: '#1e293b',
    tooltipText: '#e2e8f0',
    tooltipDim: '#94a3b8',
  },
}

export function QaAutomationTrend({ history }: Props) {
  const { resolvedTheme } = useTheme()
  const p = resolvedTheme === 'dark' ? palettes.dark : palettes.light

  if (history.length < 2) return null

  const data = [...history]
    .sort((a, b) => a.period_to.localeCompare(b.period_to))
    .map((h) => ({
      date: new Date(h.period_to).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      automated: h.automated,
      scope: h.active_scope,
    }))

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Automation trend</h3>
      <div className="h-[250px] rounded-lg border bg-card p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke={p.grid} strokeOpacity={p.gridOpacity} />
            <XAxis
              dataKey="date"
              tick={{ fill: p.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: p.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: p.tooltipBg,
                border: `1px solid ${p.tooltipBorder}`,
                borderRadius: '6px',
                fontSize: '12px',
                color: p.tooltipText,
              }}
            />
            <Area
              type="monotone"
              dataKey="scope"
              stroke="#64748b"
              fill="#64748b"
              fillOpacity={0.1}
              strokeWidth={1}
              name="Active scope"
            />
            <Area
              type="monotone"
              dataKey="automated"
              stroke="#22d3ee"
              fill="#22d3ee"
              fillOpacity={0.2}
              strokeWidth={2}
              name="Automated"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
