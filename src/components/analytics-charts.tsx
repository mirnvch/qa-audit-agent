'use client'

import { useTheme } from 'next-themes'
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

// ─── Theme palettes for SVG (CSS vars don't work in SVG) ────────────────────
const palettes = {
  dark: {
    axis: '#64748b',
    axisTick: '#64748b',
    grid: '#1e293b',
    gridOpacity: 0.6,
    tooltipBg: '#0c1222',
    tooltipBorder: '#1e293b',
    tooltipText: '#e2e8f0',
    tooltipDim: '#94a3b8',
    labelText: '#cbd5e1',
    cursorFill: 'rgba(34,211,238,0.04)',
  },
  light: {
    axis: '#94a3b8',
    axisTick: '#64748b',
    grid: '#e2e8f0',
    gridOpacity: 0.8,
    tooltipBg: '#0f172a',
    tooltipBorder: '#1e293b',
    tooltipText: '#e2e8f0',
    tooltipDim: '#94a3b8',
    labelText: '#334155',
    cursorFill: 'rgba(99,102,241,0.06)',
  },
}

function usePalette() {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === 'dark' ? palettes.dark : palettes.light
}

// ─── Accent colors (same in both themes) ────────────────────────────────────
const CYAN = '#22d3ee'
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
function BlueprintTooltip({ active, payload, label, suffix, palette }: any) {
  if (!active || !payload?.length) return null
  const p = palette ?? palettes.dark
  return (
    <div
      style={{
        background: p.tooltipBg,
        border: `1px solid ${p.tooltipBorder}`,
        borderRadius: 2,
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: 'var(--font-geist-mono), monospace',
        color: p.tooltipText,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ color: p.tooltipDim, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: CYAN, marginTop: 2 }}>
        {payload[0].value}{suffix ?? ''}
      </div>
    </div>
  )
}

// ─── Corner markers ─────────────────────────────────────────────────────────
function CornerMarkers() {
  return (
    <>
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-border/60" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-border/60" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-border/60" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-border/60" />
    </>
  )
}

// ─── Chart card wrapper (theme-aware) ───────────────────────────────────────
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
    <div className="relative rounded-sm border border-border bg-card overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 0.5px, transparent 0.5px)`,
          backgroundSize: '16px 16px',
        }}
      />

      <CornerMarkers />

      {/* Header bar */}
      <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 dark:bg-cyan-400/60" />
          <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-muted-foreground">
            {label}
          </span>
        </div>
        <span className="text-[9px] font-mono tracking-[0.12em] text-muted-foreground/40">
          {rev}
        </span>
      </div>

      {/* Chart area */}
      <div className="relative px-3 pt-4 pb-2">
        {children}
      </div>

      {/* Metric readouts */}
      {metrics && metrics.length > 0 && (
        <div className="relative flex border-t border-border/50">
          {metrics.map((m, i) => (
            <div
              key={i}
              className={`flex-1 px-4 py-2.5 ${i > 0 ? 'border-l border-border/50' : ''}`}
            >
              <div className="text-[8px] font-mono tracking-[0.15em] uppercase text-muted-foreground/50 mb-0.5">
                {m.label}
              </div>
              <div
                className="text-sm font-semibold font-mono"
                style={{ color: m.color ?? CYAN }}
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
  const p = usePalette()
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
          <CartesianGrid strokeDasharray="2 6" stroke={p.grid} opacity={p.gridOpacity} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => v.split('-')[2]}
            tick={{ fill: p.axisTick, fontSize: 9, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: p.axisTick, fontSize: 9, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <Tooltip content={<BlueprintTooltip palette={p} />} cursor={{ stroke: CYAN, strokeWidth: 0.5, strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={CYAN}
            strokeWidth={1.5}
            fill="url(#cyanArea)"
            dot={false}
            activeDot={{ r: 3, fill: CYAN, stroke: p.tooltipBg, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Conversion Funnel ──────────────────────────────────────────────────────
export function ConversionFunnelChart({ data }: { data: FunnelData[] }) {
  const p = usePalette()

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
          <CartesianGrid strokeDasharray="2 6" stroke={p.grid} opacity={p.gridOpacity} horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: p.axisTick, fontSize: 9, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fill: p.labelText, fontSize: 10, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<BlueprintTooltip palette={p} />} cursor={{ fill: p.cursorFill }} />
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
  const p = usePalette()
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
        { label: 'Ranges', value: '5', color: p.axisTick },
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
          <CartesianGrid strokeDasharray="2 6" stroke={p.grid} opacity={p.gridOpacity} vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: p.axisTick, fontSize: 9, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: p.axisTick, fontSize: 9, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <Tooltip content={<BlueprintTooltip palette={p} />} cursor={{ fill: 'rgba(168,85,247,0.06)' }} />
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
  const p = usePalette()
  const avgScore = data.length > 0
    ? (data.reduce((s, d) => s + d.score, 0) / data.length).toFixed(0)
    : '—'
  const lowest = data.length > 0 ? data[0]?.score ?? '—' : '—'

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
          <CartesianGrid strokeDasharray="2 6" stroke={p.grid} opacity={p.gridOpacity} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: p.axisTick, fontSize: 9, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="domain"
            tick={{ fill: p.labelText, fontSize: 9, fontFamily: 'var(--font-geist-mono), monospace' }}
            axisLine={{ stroke: p.axis, strokeWidth: 0.5 }}
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
                    background: p.tooltipBg,
                    border: `1px solid ${p.tooltipBorder}`,
                    borderRadius: 2,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontFamily: 'var(--font-geist-mono), monospace',
                    color: p.tooltipText,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  <div style={{ color: p.tooltipDim, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {d.domain}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: scoreColor(d.score), marginTop: 2 }}>
                    {d.score}/100
                  </div>
                </div>
              )
            }}
            cursor={{ fill: p.cursorFill }}
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
      <span className="text-xs font-mono text-muted-foreground/60 tracking-wide">
        {message}
      </span>
    </div>
  )
}
