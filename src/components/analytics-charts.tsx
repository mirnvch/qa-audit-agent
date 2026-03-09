'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type ScansPerDayData = { date: string; count: number }
type FunnelData = { stage: string; count: number }
type ScoreDistData = { range: string; count: number }
type TopDomainData = { domain: string; score: number }

// ─── Theme-aware colors ──────────────────────────────────────────────────────
const AXIS_COLOR = '#64748b' // slate-500, visible on both themes
const GRID_COLOR = '#334155' // slate-700
const TOOLTIP_BG = '#0f172a' // slate-900
const TOOLTIP_BORDER = '#1e293b' // slate-800

const BLUE = '#3b82f6'
const CYAN = '#06b6d4'
const TEAL = '#14b8a6'
const GREEN = '#22c55e'
const PURPLE = '#a855f7'

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // green
  if (score >= 60) return '#eab308' // yellow
  if (score >= 40) return '#f97316' // orange
  return '#ef4444' // red
}

const SCORE_DIST_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']

// ─── Custom tooltip ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_BORDER}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{payload[0].value}</div>
    </div>
  )
}

// ─── Scans per Day ───────────────────────────────────────────────────────────
export function ScansPerDayChart({ data }: { data: ScansPerDayData[] }) {
  if (data.every(d => d.count === 0)) {
    return <EmptyState message="No scans recorded in the last 30 days." />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={1} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} opacity={0.3} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => v.split('-')[2]}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
        <Bar dataKey="count" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Conversion Funnel ───────────────────────────────────────────────────────
export function ConversionFunnelChart({ data }: { data: FunnelData[] }) {
  if (data.every(d => d.count === 0)) {
    return <EmptyState message="No reports yet. Funnel data will appear after scanning." />
  }

  const colors = [BLUE, CYAN, TEAL, GREEN]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 16, bottom: 0 }}>
        <defs>
          {colors.map((color, i) => (
            <linearGradient key={i} id={`funnel${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} opacity={0.3} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((_, index) => (
            <Cell key={index} fill={`url(#funnel${index})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Score Distribution ──────────────────────────────────────────────────────
export function ScoreDistributionChart({ data }: { data: ScoreDistData[] }) {
  if (data.every(d => d.count === 0)) {
    return <EmptyState message="No scores recorded yet." />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {SCORE_DIST_COLORS.map((color, i) => (
            <linearGradient key={i} id={`score${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.4} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} opacity={0.3} />
        <XAxis
          dataKey="range"
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168,85,247,0.08)' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={`url(#score${index})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Top Domains (Lowest Scores) ─────────────────────────────────────────────
export function TopDomainsChart({ data }: { data: TopDomainData[] }) {
  if (data.length === 0) {
    return <EmptyState message="No domain scores yet." />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} opacity={0.3} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="domain"
          tick={{ fill: '#e2e8f0', fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          width={120}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as TopDomainData
            return (
              <div
                style={{
                  background: TOOLTIP_BG,
                  border: `1px solid ${TOOLTIP_BORDER}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ color: '#94a3b8', marginBottom: 2 }}>{d.domain}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: scoreColor(d.score) }}>
                  Score: {d.score}/100
                </div>
              </div>
            )
          }}
          cursor={{ fill: 'rgba(239,68,68,0.06)' }}
        />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((entry, index) => (
            <Cell key={index} fill={scoreColor(entry.score)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground font-mono">
      {message}
    </div>
  )
}
