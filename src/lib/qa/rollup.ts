export type QaRollupStatus = 'green' | 'yellow' | 'red'

export type QaRollupHistoryPoint = {
  id: string
  period_from: string
  period_to: string
  automated: number
  active_scope: number
  remaining: number
  failures: number
  covered_sections: string[]
}

export type QaProjectProgressRollup = {
  latestReport: {
    id: string
    period_from: string
    period_to: string
  } | null
  automatedDeltaPrevious: number | null
  automatedDeltaLast7Days: number | null
  remainingDeltaPrevious: number | null
  remainingDeltaLast7Days: number | null
  newlyCoveredSections: string[]
  qualityGate: {
    status: QaRollupStatus
    reasons: string[]
  }
}

function sortHistory(history: QaRollupHistoryPoint[]) {
  return [...history].sort((left, right) => {
    if (left.period_to !== right.period_to) {
      return left.period_to.localeCompare(right.period_to)
    }
    if (left.period_from !== right.period_from) {
      return left.period_from.localeCompare(right.period_from)
    }
    return left.id.localeCompare(right.id)
  })
}

function getSevenDayAnchor(sortedHistory: QaRollupHistoryPoint[], latest: QaRollupHistoryPoint) {
  const latestDate = new Date(latest.period_to + 'T00:00:00Z')
  const windowStart = new Date(latestDate)
  windowStart.setUTCDate(windowStart.getUTCDate() - 7)

  const candidates = sortedHistory.filter((point) => {
    if (point.id === latest.id) return false
    const pointDate = new Date(point.period_to + 'T00:00:00Z')
    return pointDate >= windowStart && pointDate <= latestDate
  })

  return candidates[0] ?? null
}

function getNewlyCoveredSections(latest: QaRollupHistoryPoint, previous: QaRollupHistoryPoint | null) {
  if (!previous) return []

  const previousSections = new Set(previous.covered_sections)
  return latest.covered_sections.filter((section) => !previousSections.has(section))
}

function buildQualityGate(
  latest: QaRollupHistoryPoint | null,
  previous: QaRollupHistoryPoint | null,
  automatedDeltaPrevious: number | null,
  automatedDeltaLast7Days: number | null,
  remainingDeltaPrevious: number | null,
  remainingDeltaLast7Days: number | null,
  newlyCoveredSections: string[]
): QaProjectProgressRollup['qualityGate'] {
  if (!latest) {
    return {
      status: 'yellow',
      reasons: ['No QA reports available'],
    }
  }

  const redReasons: string[] = []
  const yellowReasons: string[] = []

  if (latest.failures > 0) {
    redReasons.push(`Latest report has ${latest.failures} failure${latest.failures === 1 ? '' : 's'}`)
  }

  if (automatedDeltaPrevious != null && automatedDeltaPrevious < 0) {
    redReasons.push(`Automated count dropped by ${Math.abs(automatedDeltaPrevious)} vs previous report`)
  }

  if (remainingDeltaPrevious != null && remainingDeltaPrevious > 0) {
    redReasons.push(`Remaining count increased by ${remainingDeltaPrevious} vs previous report`)
  }

  // Coverage threshold: <10% is red
  if (latest.active_scope > 0 && (latest.automated / latest.active_scope) < 0.10) {
    const pct = Math.round((latest.automated / latest.active_scope) * 100)
    redReasons.push(`Coverage below 10% (${pct}%)`)
  }

  if (redReasons.length > 0) {
    return { status: 'red', reasons: redReasons }
  }

  // Coverage threshold: <25% is yellow
  if (latest.active_scope > 0 && (latest.automated / latest.active_scope) < 0.25) {
    const pct = Math.round((latest.automated / latest.active_scope) * 100)
    yellowReasons.push(`Coverage below 25% (${pct}%)`)
  }

  if (!previous) {
    yellowReasons.push('No previous report to compare against yet')
  }

  if (
    previous &&
    automatedDeltaPrevious === 0 &&
    remainingDeltaPrevious === 0 &&
    newlyCoveredSections.length === 0
  ) {
    yellowReasons.push('No visible progress vs previous report')
  }

  if (
    automatedDeltaLast7Days != null &&
    remainingDeltaLast7Days != null &&
    automatedDeltaLast7Days <= 0 &&
    remainingDeltaLast7Days >= 0
  ) {
    yellowReasons.push('No net improvement over the last 7 days')
  }

  if (yellowReasons.length > 0) {
    return { status: 'yellow', reasons: yellowReasons }
  }

  return {
    status: 'green',
    reasons: ['Automation progress is stable or improving'],
  }
}

export function computeQaProjectRollup(history: QaRollupHistoryPoint[]): QaProjectProgressRollup {
  const sortedHistory = sortHistory(history)
  const latest = sortedHistory.at(-1) ?? null
  const previous = sortedHistory.length >= 2 ? sortedHistory[sortedHistory.length - 2] : null
  const sevenDayAnchor = latest ? getSevenDayAnchor(sortedHistory, latest) : null

  const automatedDeltaPrevious =
    latest && previous ? latest.automated - previous.automated : null
  const automatedDeltaLast7Days =
    latest && sevenDayAnchor ? latest.automated - sevenDayAnchor.automated : null
  const remainingDeltaPrevious =
    latest && previous ? latest.remaining - previous.remaining : null
  const remainingDeltaLast7Days =
    latest && sevenDayAnchor ? latest.remaining - sevenDayAnchor.remaining : null
  const newlyCoveredSections =
    latest ? getNewlyCoveredSections(latest, previous) : []

  return {
    latestReport: latest
      ? {
          id: latest.id,
          period_from: latest.period_from,
          period_to: latest.period_to,
        }
      : null,
    automatedDeltaPrevious,
    automatedDeltaLast7Days,
    remainingDeltaPrevious,
    remainingDeltaLast7Days,
    newlyCoveredSections,
    qualityGate: buildQualityGate(
      latest,
      previous,
      automatedDeltaPrevious,
      automatedDeltaLast7Days,
      remainingDeltaPrevious,
      remainingDeltaLast7Days,
      newlyCoveredSections
    ),
  }
}
