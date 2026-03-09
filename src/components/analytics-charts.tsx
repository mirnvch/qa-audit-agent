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
  AreaChart,
  Area,
} from 'recharts'

type ScansPerDayData = { date: string; count: number }
type FunnelData = { stage: string; count: number }
type ScoreDistData = { range: string; count: number }
type TopDomainData = { domain: string; score: number }

// ─── Blueprint palette ──────────────────────────────────────────────────────
const GRID_DOT = '#1e293b'
const AXIS = '#475569'
const AXIS_TICK = '#64748b'
const TOOLTIP_BG = '#0c1222'
const TOOLTIP_BORDER = '#1e293b'
const TEXT_DIM = '#94a3b8'

const CYAN = '#22d3ee'
const CYAN_DIM = '#0e7490'
const EMERALD = '#34d399'
const AMBER = '#fbbf24'
const RED = '#f87171'
const INDIGO = '#818cf8'

function scoreColor(score: number): string {
  if (score >= 80) return EMERALD
  if (score >= 60) return AMBER
  if (score >= 40) return '#fb923c'
  return RED
}

const SCORE_DIST_COLORS = [RED, '#fb923c', AMBER, EMERALD, '#10b981']

// ─── Blueprint tooltip ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BlueprintTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_BORDER}`,
        borderRadius: 2,
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        color: '#e2e8f0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ color: TEXT_DIM, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: CYAN, marginTop: 2 }}>
        {payload[0].value}{suffix ?? ''}
      </div>
    </div>
  )
}

// ─── Corner markers (blueprint crosshairs) ──────────────────────────────────
function CornerMarkers() {
  return (
    <>
      {/* Top-left */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-600/40" />
      {/* Top-right */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-600/40" />
      {/* Bottom-left */}
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-600/40" />
      {/* Bottom-right */}
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-600/40" />
    </>
  )
}

// ─── Chart card wrapper ─────────────────────────────────────────────────────
function ChartCard({
  label,
  rev,
  children,
  metrics,
}: {
  label: string
  rev: string
  children: React.ReactNode
  metrics?: { label: string; value: string | number; color?: string }[]
}) {
  return (
    <div className="relative rounded-sm border border-slate-700/50 bg-[#0a0f1a] p-0 overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)`,
          backgroundSize: '16px 16px',
        }}
      />

      <CornerMarkers />

      {/* Header bar */}
      <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
          <span
            className="text-[10px] tracking-[0.18em] uppercase text-slate-400"
            style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-[9px] tracking-[0.12em] text-slate-600"
          style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
        >
          {rev}
        </span>
      </div>

      {/* Chart area */}
      <div className="relative px-3 pt-4 pb-2">
        {children}
      </div>

      {/* Metric readouts */}
      {metrics && metrics.length > 0 && (
        <div className="relative flex border-t border-slate-700/30">
          {metrics.map((m, i) => (
            <div
              key={i}
              className={`flex-1 px-4 py-2.5 ${i > 0 ? 'border-l border-slate-700/30' : ''}`}
            >
              <div
                className="text-[8px] tracking-[0.15em] uppercase text-slate-600 mb-0.5"
                style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
              >
                {m.label}
              </div>
              <div
                className="text-sm font-semibold"
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  color: m.color ?? CYAN,
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Scans per Day (Area chart) ─────────────────────────────────────────────
export function ScansPerDayChart({ data }: { data: ScansPerDayData[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const peak = Math.max(...data.map(d => d.count))
  const avg = data.length > 0 ? (total / data.length).toFixed(1) : '0'

  if (data.every(d => d.count === 0)) {
    return (
      <ChartCard label="Scan Activity" rev="REV 1.0">
        <EmptyState message="No scans recorded in the last 30 days." />
      </ChartCard>
    )
  }

  return (
    <ChartCard
      label="Scan Activity"
      rev="REV 1.0"
      metrics={[
        { label: 'Total', value: total },
        { label: 'Peak', value: peak, color: EMERALD },
        { label: 'Avg/Day', value: avg, color: INDIGO },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CYAN} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CYAN} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke={GRID_DOT}
            opacity={0.6}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => v.split('-')[2]}
            tick={{ fill: AXIS_TICK, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: AXIS_TICK, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <Tooltip content={<BlueprintTooltip />} cursor={{ stroke: CYAN, strokeWidth: 0.5, strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={CYAN}
            strokeWidth={1.5}
            fill="url(#cyanArea)"
            dot={false}
            activeDot={{ r: 3, fill: CYAN, stroke: TOOLTIP_BG, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Conversion Funnel ──────────────────────────────────────────────────────
export function ConversionFunnelChart({ data }: { data: FunnelData[] }) {
  if (data.every(d => d.count === 0)) {
    return (
      <ChartCard label="Conversion Funnel" rev="REV 2.0">
        <EmptyState message="No reports yet. Funnel data will appear after scanning." />
      </ChartCard>
    )
  }

  const colors = [CYAN, INDIGO, AMBER, EMERALD]
  const total = data[0]?.count || 1
  const convRate = data.length >= 2 ? ((data[data.length - 1].count / total) * 100).toFixed(1) : '0'

  return (
    <ChartCard
      label="Conversion Funnel"
      rev="REV 2.0"
      metrics={[
        { label: 'Top of Funnel', value: total },
        { label: 'End Conv.', value: `${convRate}%`, color: EMERALD },
        { label: 'Stages', value: data.length, color: INDIGO },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <defs>
            {colors.map((color, i) => (
              <linearGradient key={i} id={`funnel${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke={GRID_DOT}
            opacity={0.6}
            horizontal={false}
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: AXIS_TICK, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fill: '#cbd5e1', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<BlueprintTooltip />} cursor={{ fill: 'rgba(34,211,238,0.04)' }} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={24}>
            {data.map((_, index) => (
              <Cell key={index} fill={`url(#funnel${index})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Score Distribution ─────────────────────────────────────────────────────
export function ScoreDistributionChart({ data }: { data: ScoreDistData[] }) {
  const totalScanned = data.reduce((s, d) => s + d.count, 0)
  const highScores = data.filter((_, i) => i >= 3).reduce((s, d) => s + d.count, 0)
  const healthRate = totalScanned > 0 ? ((highScores / totalScanned) * 100).toFixed(0) : '0'

  if (data.every(d => d.count === 0)) {
    return (
      <ChartCard label="Score Distribution" rev="REV 1.2">
        <EmptyState message="No scores recorded yet." />
      </ChartCard>
    )
  }

  return (
    <ChartCard
      label="Score Distribution"
      rev="REV 1.2"
      metrics={[
        { label: 'Total Scored', value: totalScanned },
        { label: 'Health Rate', value: `${healthRate}%`, color: EMERALD },
        { label: 'Ranges', value: '5', color: TEXT_DIM },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {SCORE_DIST_COLORS.map((color, i) => (
              <linearGradient key={i} id={`score${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.2} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke={GRID_DOT}
            opacity={0.6}
            vertical={false}
          />
          <XAxis
            dataKey="range"
            tick={{ fill: AXIS_TICK, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: AXIS_TICK, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <Tooltip content={<BlueprintTooltip />} cursor={{ fill: 'rgba(168,85,247,0.06)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={`url(#score${index})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Top Domains (Lowest Scores) ────────────────────────────────────────────
export function TopDomainsChart({ data }: { data: TopDomainData[] }) {
  const avgScore = data.length > 0
    ? (data.reduce((s, d) => s + d.score, 0) / data.length).toFixed(0)
    : '—'
  const lowest = data.length > 0 ? data[data.length - 1]?.score ?? '—' : '—'

  if (data.length === 0) {
    return (
      <ChartCard label="Lowest Scoring Domains" rev="REV 3.0">
        <EmptyState message="No domain scores yet." />
      </ChartCard>
    )
  }

  return (
    <ChartCard
      label="Lowest Scoring Domains"
      rev="REV 3.0"
      metrics={[
        { label: 'Domains', value: data.length },
        { label: 'Avg Score', value: avgScore, color: AMBER },
        { label: 'Lowest', value: lowest, color: RED },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke={GRID_DOT}
            opacity={0.6}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: AXIS_TICK, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="domain"
            tick={{ fill: '#cbd5e1', fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
            axisLine={{ stroke: AXIS, strokeWidth: 0.5 }}
            tickLine={false}
            width={110}
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
                    borderRadius: 2,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    color: '#e2e8f0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ color: TEXT_DIM, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {d.domain}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: scoreColor(d.score), marginTop: 2 }}>
                    {d.score}/100
                  </div>
                </div>
              )
            }}
            cursor={{ fill: 'rgba(239,68,68,0.04)' }}
          />
          <Bar dataKey="score" radius={[0, 3, 3, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={index} fill={scoreColor(entry.score)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[220px]">
      <span
        className="text-xs text-slate-600"
        style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', letterSpacing: '0.05em' }}
      >
        {message}
      </span>
    </div>
  )
}
