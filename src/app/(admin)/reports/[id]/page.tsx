import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ScoreCircle } from '@/components/score-circle'
import { ReportStatusBadge } from '@/components/report-status-badge'
import { FindingCard } from '@/components/finding-card'
import { ReportDetailActions } from '@/components/report-detail-actions'
import type { ReportStatus, Finding } from '@/lib/supabase/types'

type Props = {
  params: Promise<{ id: string }>
}

type MockFinding = Omit<Finding, 'id' | 'report_id' | 'created_at'>

const mockFindings: MockFinding[] = [
  {
    finding_id: 'CR-001',
    severity: 'critical',
    confidence: 'high',
    category: 'functionality',
    title: 'Contact page email link leads to wrong address (template placeholder)',
    description:
      'In the contact page carousel, the email link displays info@company.com but the actual mailto: href points to sanfrancisco@property.com — a template placeholder that was never replaced.',
    business_impact:
      'Every customer who clicks the email link sends their inquiry to a non-existent address. These leads are permanently lost.',
    page: '/en/contact',
    steps_to_reproduce: [
      'Open the contact page',
      'Scroll to the carousel section',
      'Click the email link displayed as info@company.com',
      'Email client opens with wrong recipient: sanfrancisco@property.com',
    ],
    evidence: {
      eval_data: "link text: 'info@company.com', href: 'mailto:sanfrancisco@property.com'",
    },
  },
  {
    finding_id: 'CR-002',
    severity: 'critical',
    confidence: 'high',
    category: 'seo',
    title: 'Homepage missing meta description',
    description:
      'The homepage has no meta description tag. Search engines will generate their own snippet, which is typically less effective for conversions.',
    business_impact:
      'Lower click-through rates from search results, reducing organic traffic by an estimated 15-30%.',
    page: '/',
    steps_to_reproduce: [
      'View page source of the homepage',
      'Search for <meta name="description"',
      'Tag is absent',
    ],
    evidence: {
      eval_data: 'document.querySelector(\'meta[name="description"]\') → null',
    },
  },
  {
    finding_id: 'CR-003',
    severity: 'critical',
    confidence: 'high',
    category: 'functionality',
    title: 'Contact form submits but shows no confirmation message',
    description:
      'After submitting the contact form, the page reloads silently with no success or error feedback. Users cannot tell if their message was sent.',
    business_impact:
      'Users who submit the form don\'t know if it worked. Most will leave thinking it failed, and won\'t follow up.',
    page: '/en/contact',
    steps_to_reproduce: [
      'Fill in the contact form with valid data',
      'Click Submit',
      'Page reloads — no confirmation shown',
    ],
    evidence: {
      eval_data: 'No .success, .confirmation, or [role="alert"] element found after submission',
    },
  },
  {
    finding_id: 'MO-001',
    severity: 'moderate',
    confidence: 'high',
    category: 'performance',
    title: 'Hero images not optimized — LCP above 4s on mobile',
    description:
      'The hero section loads 3 uncompressed JPEGs totaling 4.2 MB. On a typical mobile connection this causes the Largest Contentful Paint to exceed 4 seconds.',
    business_impact:
      'Google uses LCP as a Core Web Vital ranking signal. Poor LCP hurts SEO and increases bounce rate.',
    page: '/',
    steps_to_reproduce: [
      'Open Chrome DevTools → Lighthouse',
      'Run mobile audit',
      'Check LCP score and image sizes',
    ],
    evidence: {
      eval_data: 'hero-bg.jpg: 1.8 MB, slide-1.jpg: 1.4 MB, slide-2.jpg: 1.0 MB',
    },
  },
  {
    finding_id: 'MO-002',
    severity: 'moderate',
    confidence: 'medium',
    category: 'accessibility',
    title: 'All images lack alt attributes',
    description:
      'Property listing images and team photos have empty or missing alt attributes, making the site inaccessible to screen reader users.',
    business_impact:
      'WCAG 2.1 Level A violation. May expose the business to accessibility lawsuits in jurisdictions with ADA enforcement.',
    page: '/en/properties',
    steps_to_reproduce: [
      'Run axe accessibility audit on /en/properties',
      'Filter for "Images must have alternate text" rule',
    ],
    evidence: {
      eval_data: '14 img elements with alt="" or missing alt attribute',
    },
  },
  {
    finding_id: 'MO-003',
    severity: 'moderate',
    confidence: 'high',
    category: 'seo',
    title: 'Blog posts missing structured data (Article schema)',
    description:
      'Blog articles have no JSON-LD Article schema. Google cannot display rich snippets (author, date, breadcrumbs) in search results.',
    business_impact:
      'Missing rich snippets reduce click-through rates from search by approximately 20%.',
    page: '/en/blog',
    steps_to_reproduce: [
      'Open any blog post',
      'Check page source for <script type="application/ld+json">',
      'No Article schema present',
    ],
    evidence: {
      eval_data: 'document.querySelectorAll(\'script[type="application/ld+json"]\').length → 0',
    },
  },
  {
    finding_id: 'MO-004',
    severity: 'moderate',
    confidence: 'medium',
    category: 'functionality',
    title: 'Mobile navigation menu does not close on outside click',
    description:
      'On mobile, opening the hamburger menu and tapping outside it does not close the menu. Users must tap the hamburger icon again.',
    business_impact:
      'Poor mobile UX. With 60%+ of users on mobile, this friction reduces engagement.',
    page: '/',
    steps_to_reproduce: [
      'Open site on mobile (or resize to <768px)',
      'Tap hamburger menu to open it',
      'Tap anywhere outside the menu',
      'Menu remains open',
    ],
    evidence: {
      eval_data: 'No document click or pointer event listener detected on nav overlay',
    },
  },
  {
    finding_id: 'MI-001',
    severity: 'minor',
    confidence: 'low',
    category: 'ui',
    title: 'Footer copyright year is outdated (2023)',
    description: 'Footer shows "© 2023" instead of the current year.',
    business_impact: 'Minor trust signal — looks unmaintained.',
    page: '/en',
    steps_to_reproduce: ['Scroll to footer', 'Check copyright year'],
    evidence: { eval_data: 'footer text: "© 2023 Company Name. All rights reserved."' },
  },
]

type MockReport = {
  id: string
  code: string
  status: ReportStatus
  score: number
  score_calculation: string
  summary: string
  tier: string
  audit_date: string
  pages_checked: string[]
  skipped_checks: string[]
  positives: string[]
  view_count: number
  created_at: string
  companies: {
    id: string
    name: string
    domain: string
    contact_name: string | null
    contact_email: string | null
    created_at: string
  }
  findings: MockFinding[]
}

const mockReport: MockReport = {
  id: '3',
  code: 'RPT-9K2LP5',
  status: 'replied',
  score: 24,
  score_calculation: '100 - (3×15) - (4×7) - (1×3) = 24',
  summary:
    'The website has several critical issues that are actively hurting lead generation, including a broken email link and missing form confirmation. SEO and performance need attention.',
  tier: 'small',
  audit_date: '2026-03-04',
  pages_checked: ['/en', '/en/about', '/en/contact', '/en/properties', '/en/blog'],
  skipped_checks: ['payment_flow', 'user_account_flow'],
  positives: [
    'SSL certificate is valid and HTTPS is enforced site-wide',
    'Mobile layout is responsive and adapts correctly to all screen sizes',
    'Page load time on desktop is acceptable (under 2s)',
    'Social media links in footer are correct and working',
    'Privacy policy and terms pages are present',
  ],
  view_count: 7,
  created_at: '2026-03-04T10:00:00Z',
  companies: {
    id: 'c3',
    name: 'Evergreen Chiropractic',
    domain: 'evergreenchiro.com',
    contact_name: 'Dr. Amy Chen',
    contact_email: 'amy@evergreenchiro.com',
    created_at: '2026-01-01T00:00:00Z',
  },
  findings: mockFindings,
}

async function getReport(id: string) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error('Supabase env vars not set')
    }

    const supabase = await createClient()
    const { data: report, error } = await supabase
      .from('reports')
      .select('*, companies(*), findings(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return report ?? null
  } catch {
    return { ...mockReport, id }
  }
}

function groupFindingsBySeverity(findings: MockFinding[]) {
  return {
    critical: findings.filter((f) => f.severity === 'critical'),
    moderate: findings.filter((f) => f.severity === 'moderate'),
    minor: findings.filter((f) => f.severity === 'minor'),
  }
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params
  const report = await getReport(id)

  if (!report) notFound()

  const company = report.companies
  const findings = (report.findings ?? []) as MockFinding[]
  const grouped = groupFindingsBySeverity(findings)

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono mb-6"
      >
        ← Reports
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight truncate">{company?.name ?? '—'}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            {company?.domain ?? ''}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <ReportStatusBadge status={report.status as ReportStatus} />
            <span className="font-mono text-xs text-muted-foreground tracking-wider">
              {report.code}
            </span>
          </div>
        </div>

        <ScoreCircle score={report.score ?? 0} size={88} />
      </div>

      {/* Action buttons */}
      <ReportDetailActions
        reportId={report.id}
        reportCode={report.code}
        currentStatus={report.status as ReportStatus}
      />

      <hr className="my-8 border-border/40" />

      {/* Findings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Findings{' '}
          <span className="text-muted-foreground font-mono text-sm font-normal">
            ({findings.length})
          </span>
        </h2>

        {grouped.critical.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-red-400/70 tracking-[0.15em] uppercase">
              Critical — {grouped.critical.length}
            </p>
            {grouped.critical.map((f) => (
              <FindingCard key={f.finding_id} finding={f} defaultOpen={true} />
            ))}
          </div>
        )}

        {grouped.moderate.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-amber-400/70 tracking-[0.15em] uppercase">
              Moderate — {grouped.moderate.length}
            </p>
            {grouped.moderate.map((f) => (
              <FindingCard key={f.finding_id} finding={f} defaultOpen={false} />
            ))}
          </div>
        )}

        {grouped.minor.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase">
              Minor — {grouped.minor.length}
            </p>
            {grouped.minor.map((f) => (
              <FindingCard key={f.finding_id} finding={f} defaultOpen={false} />
            ))}
          </div>
        )}

        {findings.length === 0 && (
          <p className="text-muted-foreground text-sm font-mono">No findings recorded.</p>
        )}
      </section>

      <hr className="my-8 border-border/40" />

      {/* Positives */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">What&apos;s Working</h2>
        {(report.positives ?? []).length > 0 ? (
          <ul className="space-y-2">
            {report.positives.map((positive, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                {positive}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm font-mono">No positives recorded.</p>
        )}
      </section>

      <hr className="my-8 border-border/40" />

      {/* Metadata */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Details</h2>
        <dl className="space-y-2">
          {report.score_calculation && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Score Calculation
              </dt>
              <dd className="font-mono text-sm text-foreground">
                {report.score_calculation}
              </dd>
            </div>
          )}

          {report.audit_date && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Audit Date
              </dt>
              <dd className="text-sm text-foreground">{report.audit_date}</dd>
            </div>
          )}

          {(report.pages_checked ?? []).length > 0 && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Pages Checked
              </dt>
              <dd className="text-sm text-muted-foreground font-mono">
                {report.pages_checked.join(', ')}
              </dd>
            </div>
          )}

          {(report.skipped_checks ?? []).length > 0 && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.12em] uppercase">
                Skipped Checks
              </dt>
              <dd className="text-sm text-muted-foreground font-mono">
                {report.skipped_checks.join(', ')}
              </dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  )
}
