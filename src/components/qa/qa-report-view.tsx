import type { QaReportViewProps } from '@/lib/qa/schema'
import { QaSummaryCards } from './qa-summary-cards'
import { QaAutomationPlanBar } from './qa-automation-plan-bar'
import { QaExecutionGroups } from './qa-execution-groups'
import { QaModuleCoverage } from './qa-module-coverage'
import { QaCoveredSections } from './qa-covered-sections'
import { QaHeaviestSections } from './qa-heaviest-sections'
import { QaAutomationTrend } from './qa-automation-trend'
import { QaProgressList } from './qa-progress-list'
import { QaRecommendations } from './qa-recommendations'
import { QaCiCdBlock } from './qa-ci-cd-block'

function SectionDivider() {
  return <div className="h-px bg-border/50" />
}

export function QaReportView({
  report,
  modules,
  coveredSections,
  remainingSections,
  history,
}: QaReportViewProps) {
  return (
    <div className="space-y-8">
      {/* Summary & Plan */}
      <QaSummaryCards report={report} />
      <QaAutomationPlanBar report={report} />

      <SectionDivider />

      {/* Codebase structure */}
      <QaExecutionGroups groups={report.execution_groups} />

      {/* Trend chart — only with 2+ historical reports */}
      {history && history.length >= 2 && (
        <>
          <SectionDivider />
          <QaAutomationTrend history={history} />
        </>
      )}

      <SectionDivider />

      {/* Coverage detail */}
      <QaModuleCoverage modules={modules} />
      <QaCoveredSections sections={coveredSections} />
      <QaHeaviestSections sections={remainingSections} />

      <SectionDivider />

      {/* Status & recommendations */}
      <QaProgressList
        progress={report.recent_progress}
        attention={report.needs_attention}
      />
      <QaRecommendations items={report.recommended_next} />

      {/* Infrastructure — only render divider + block when CI/CD has content */}
      {report.ci_cd && (report.ci_cd.pipelines.length > 0 || report.ci_cd.stack || report.ci_cd.wip_note) && (
        <>
          <SectionDivider />
          <QaCiCdBlock ciCd={report.ci_cd} />
        </>
      )}
    </div>
  )
}
