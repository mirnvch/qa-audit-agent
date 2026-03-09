import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { FindingCard } from '@/components/finding-card'
import { ScoreCircle } from '@/components/score-circle'
import Link from 'next/link'
import { Lock, CheckCircle2, ExternalLink, CalendarDays, FileText } from 'lucide-react'
import type { ReportWithFindings, Branding } from '@/lib/supabase/types'
import { Separator } from '@/components/ui/separator'

// Untyped client to avoid Database generic conflicts with update/insert
async function getRawClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // safe to ignore in Server Components
          }
        },
      },
    }
  )
}

// ─── Mock data (used when DB not connected) ────────────────────────────────
const mockReport: ReportWithFindings = {
  id: 'mock',
  company_id: 'mock',
  code: 'RPT-DEMO1',
  status: 'viewed',
  score: 24,
  view_count: 3,
  summary:
    'Real estate agency site with critical template placeholder links, non-clickable phone, contradictory content.',
  score_calculation: '100 - (3 × 15) - (4 × 7) - (1 × 3) = 24',
  tier: 'small',
  audit_date: '2026-03-04',
  expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: '2026-03-04T00:00:00Z',
  pages_checked: ['/en', '/en/about', '/en/contact', '/en/properties', '/en/blog'],
  skipped_checks: [],
  positives: [
    'All 5 pages load successfully (200 status)',
    'Unique page titles — good for SEO',
    'Meta descriptions present on all pages',
    'Mobile responsive with no horizontal overflow',
    'Hamburger menu works correctly',
  ],
  companies: {
    id: 'mock',
    name: 'Casa Rica Estate',
    domain: 'casaricaestate.com',
    contact_name: 'Demo User',
    contact_email: null,
    created_at: '2026-03-04T00:00:00Z',
  },
  findings: [
    {
      id: '1',
      report_id: 'mock',
      finding_id: 'CR-001',
      severity: 'critical',
      confidence: 'high',
      category: 'functionality',
      title: 'Email link leads to template placeholder address',
      description:
        'The email link displays the correct address but links to a template placeholder.',
      business_impact: 'Customer inquiries sent to wrong address — leads permanently lost.',
      page: '/en/contact',
      steps_to_reproduce: ['Open contact page', 'Click email link', 'Wrong address opens'],
      evidence: {},
      created_at: '2026-03-04T00:00:00Z',
    },
    {
      id: '2',
      report_id: 'mock',
      finding_id: 'CR-002',
      severity: 'critical',
      confidence: 'high',
      category: 'functionality',
      title: 'Phone link dials wrong number',
      description: 'Phone displays correct number but links to a US template placeholder.',
      business_impact: 'Customers call wrong number — direct revenue loss.',
      page: '/en/contact',
      steps_to_reproduce: ['Open contact page', 'Click phone link'],
      evidence: {},
      created_at: '2026-03-04T00:00:00Z',
    },
    {
      id: '3',
      report_id: 'mock',
      finding_id: 'MO-001',
      severity: 'moderate',
      confidence: 'high',
      category: 'seo',
      title: '30+ template alt texts in images',
      description: 'Images contain original template alt texts.',
      business_impact: 'Hurts SEO and accessibility.',
      page: 'site-wide',
      steps_to_reproduce: ['Inspect any image alt text'],
      evidence: {},
      created_at: '2026-03-04T00:00:00Z',
    },
  ],
}

// ─── Branding logo component ───────────────────────────────────────────────
function Logo({ branding }: { branding?: Branding | null }) {
  if (branding?.logo_url) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={branding.logo_url}
          alt={branding.company_name ?? 'Logo'}
          className="h-10 w-auto object-contain"
        />
        {branding.company_name && (
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {branding.company_name}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
        style={{
          background: branding?.primary_color
            ? branding.primary_color
            : 'linear-gradient(to bottom right, #6366f1, #9333ea)',
          boxShadow: branding?.primary_color
            ? `0 10px 15px -3px ${branding.primary_color}33`
            : '0 10px 15px -3px rgba(99,102,241,0.2)',
        }}
      >
        <span className="text-white font-bold text-lg leading-none">Q</span>
      </div>
      <span className="text-xl font-semibold tracking-tight text-foreground">
        {branding?.company_name ?? 'QualityShield'}
      </span>
    </div>
  )
}

// ─── Error cards ───────────────────────────────────────────────────────────
function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8">
      <Logo />
      <div className="w-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-2xl shadow-black/20 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

// ─── Score summary ─────────────────────────────────────────────────────────
function ScoreSummary({ score, findings }: { score: number; findings: ReportWithFindings['findings'] }) {
  const critical = findings.filter((f) => f.severity === 'critical').length
  const moderate = findings.filter((f) => f.severity === 'moderate').length
  const minor = findings.filter((f) => f.severity === 'minor').length

  return (
    <div className="flex items-center gap-6">
      <ScoreCircle score={score} size={96} />
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-mono">Quality Score</p>
        {critical > 0 && (
          <p className="text-sm text-red-400">{critical} critical issue{critical !== 1 ? 's' : ''}</p>
        )}
        {moderate > 0 && (
          <p className="text-sm text-amber-400">{moderate} moderate issue{moderate !== 1 ? 's' : ''}</p>
        )}
        {minor > 0 && (
          <p className="text-sm text-muted-foreground">{minor} minor issue{minor !== 1 ? 's' : ''}</p>
        )}
        {critical === 0 && moderate === 0 && minor === 0 && (
          <p className="text-sm text-emerald-400">No issues found</p>
        )}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default async function ReportPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const decodedCode = decodeURIComponent(code)

  let report: ReportWithFindings | null = null
  let branding: Branding | null = null
  let dbError = false

  // Try to fetch from Supabase
  try {
    const supabase = await getRawClient()
    const { data, error } = await supabase
      .from('reports')
      .select('*, companies(*), findings(*)')
      .eq('code', decodedCode)
      .single()

    if (error) {
      // PGRST116 = row not found; other codes = connection issue
      if (error.code !== 'PGRST116') {
        dbError = true
      }
    } else {
      report = data as unknown as ReportWithFindings
    }

    // Fetch branding
    const { data: brandingData } = await supabase
      .from('branding')
      .select('*')
      .limit(1)
      .single()
    if (brandingData) {
      branding = brandingData as unknown as Branding
    }
  } catch {
    dbError = true
  }

  // If DB unreachable and code matches demo, show mock
  if (dbError && decodedCode === 'RPT-DEMO1') {
    report = mockReport
  }

  // Not found
  if (!report) {
    return (
      <ErrorCard
        title="Report Not Found"
        message="We couldn't find a report matching this access code. Please check the code from your email and try again."
      />
    )
  }

  // Expired
  if (report.expires_at && new Date(report.expires_at) < new Date()) {
    return (
      <ErrorCard
        title="This Report Has Expired"
        message="Access codes expire after 14 days. Please contact us if you need access to this report."
      />
    )
  }

  // Track view (fire-and-forget, don't block render)
  if (report.id !== 'mock') {
    try {
      const supabase = await getRawClient()
      const newCount = (report.view_count || 0) + 1
      const newStatus = report.status === 'sent' ? 'viewed' : report.status

      await Promise.all([
        supabase
          .from('reports')
          .update({
            view_count: newCount,
            status: newStatus,
          })
          .eq('id', report.id),

        supabase.from('activity_log').insert({
          report_id: report.id,
          action: 'viewed',
          details: `Report viewed (${newCount}x)`,
        }),
      ])
    } catch {
      // Non-critical — don't break the page
    }
  }

  const { companies, findings, score, positives, summary, score_calculation, expires_at, pages_checked, audit_date } = report

  const expiresDate = expires_at
    ? new Date(expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const auditDateFormatted = audit_date
    ? new Date(audit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  // Sort findings: critical → moderate → minor
  const severityOrder: Record<string, number> = { critical: 0, moderate: 1, minor: 2 }
  const sortedFindings = [...findings].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  )

  const accentStyle = branding?.primary_color
    ? { '--brand-accent': branding.primary_color } as React.CSSProperties
    : undefined

  return (
    <div className="w-full max-w-4xl flex flex-col gap-10 py-8" style={accentStyle}>
      {/* Logo */}
      <Link href="/scan">
        <Logo branding={branding} />
      </Link>

      {/* Report header */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-xl shadow-black/10">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Company info */}
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{companies.name}</h1>
            <a
              href={`https://${companies.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {companies.domain}
              <ExternalLink className="h-3 w-3" />
            </a>

            {summary && (
              <p className="text-sm text-muted-foreground leading-relaxed pt-2 max-w-xl">
                {summary}
              </p>
            )}

            <div className="flex flex-wrap gap-4 pt-2">
              {auditDateFormatted && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <CalendarDays className="h-3 w-3" />
                  Audited {auditDateFormatted}
                </span>
              )}
              {pages_checked.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <FileText className="h-3 w-3" />
                  {pages_checked.length} pages checked
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="shrink-0">
            <ScoreSummary score={score ?? 0} findings={findings} />
          </div>
        </div>

        {score_calculation && (
          <>
            <Separator className="my-4" />
            <p className="text-xs font-mono text-muted-foreground/60">
              Score: {score_calculation}
            </p>
          </>
        )}
      </div>

      {/* Findings section */}
      {sortedFindings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Issues Found{' '}
            <span className="text-muted-foreground font-normal text-base">
              ({sortedFindings.length})
            </span>
          </h2>
          <div className="space-y-3">
            {sortedFindings.map((finding) => (
              <FindingCard
                key={finding.id || finding.finding_id}
                finding={{
                  finding_id: finding.finding_id,
                  severity: finding.severity,
                  confidence: finding.confidence,
                  category: finding.category,
                  title: finding.title,
                  description: finding.description,
                  business_impact: finding.business_impact,
                  page: finding.page,
                  steps_to_reproduce: finding.steps_to_reproduce ?? [],
                  evidence: finding.evidence ?? {},
                }}
                defaultOpen={finding.severity === 'critical'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Positives section */}
      {positives && positives.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            What&apos;s Working Well{' '}
            <span className="text-muted-foreground font-normal text-base">
              ({positives.length})
            </span>
          </h2>
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-3">
            {positives.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pages checked */}
      {pages_checked && pages_checked.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Pages Audited</h2>
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex flex-wrap gap-2">
              {pages_checked.map((page, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-mono bg-muted/40 border border-border/40 text-muted-foreground"
                >
                  {page}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Separator />
      <footer className="text-center text-xs text-muted-foreground/50 pb-4 space-y-1">
        <p>Report generated by {branding?.company_name ?? 'QualityShield'}</p>
        {expiresDate && <p>Access code expires {expiresDate}</p>}
      </footer>
    </div>
  )
}
